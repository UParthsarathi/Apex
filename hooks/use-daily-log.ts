import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/backend/supabase';
import { useAuth } from '@/components/AuthProvider';
import { entryTimestamp } from '@/lib/dates';
import { entryFor, rowFor, type FoodEntry, type FoodItem, type LogEntry, type Row, type TaskEntry } from '@/lib/entries';

// Types and NUTRIENT_KEYS live in lib/entries.ts (pure, unit-tested); re-exported so existing imports keep working.
export { NUTRIENT_KEYS } from '@/lib/entries';
export type { LogType, NutrientKey, WaterEntry, FoodItem, FoodEntry, WorkoutEntry, TaskEntry, SleepEntry, LogEntry } from '@/lib/entries';

const SAVE_ERROR = "Couldn't save that change. Check your connection and try again.";
const LOAD_ERROR = "Couldn't load your log. Check your connection and try again.";
const PAGE = 1000; // Supabase's default API max-rows; pages advance by what actually came back

// One-time import of pre-Supabase localStorage data. supabase-js reports failures in `error`
// instead of throwing, so the local copy is only removed after a successful upload.
async function importLegacyEntries(supabase: SupabaseClient) {
  if (localStorage.getItem('apex_migrated') === 'true') return;
  try {
    const local: LogEntry[] = JSON.parse(localStorage.getItem('daily_log_entries') || '[]');
    if (local.length) {
      const { error } = await supabase.from('entries').upsert(local.map(rowFor)); // upsert = idempotent
      if (error) return console.error('local import failed; keeping the local copy', error);
    }
    localStorage.setItem('apex_migrated', 'true');
    localStorage.removeItem('daily_log_entries'); // DB is the source of truth now
  } catch (e) {
    console.error('local import failed', e);
  }
}

// Every row, page by page: a single request is silently cut off at the API's max-rows limit.
// The id tiebreak keeps page boundaries stable when timestamps are equal.
async function fetchAllRows(supabase: SupabaseClient) {
  const rows: Row[] = [];
  for (;;) {
    const { data, error, count } = await supabase
      .from('entries')
      .select('id, type, timestamp, data', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .order('id')
      .range(rows.length, rows.length + PAGE - 1);
    if (error) return { rows: null, error };
    rows.push(...(data as Row[]));
    if (!data.length || rows.length >= (count ?? rows.length)) return { rows, error: null };
  }
}

export function useDailyLog() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id; // refetch only when the account changes, not on every token refresh
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    const supabase = getSupabase();

    if (!userId || !supabase) {
      setEntries([]);
      setIsLoaded(true); // no session — page.tsx redirects to /login
      return;
    }

    let cancelled = false;
    (async () => {
      await importLegacyEntries(supabase);
      const { rows, error } = await fetchAllRows(supabase);
      if (cancelled) return;
      if (error) {
        // An empty list here would look like the user's data was wiped; page.tsx shows Retry instead.
        console.error('fetch entries failed', error);
        setLoadError(LOAD_ERROR);
      } else {
        setLoadError(null);
        setEntries(rows.map(entryFor));
      }
      setIsLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [userId, authLoading, reloads]);

  const retryLoad = () => {
    setIsLoaded(false);
    setReloads(n => n + 1);
  };

  // Every write is optimistic: the screen updates first. Returns false (and tells the user) on failure,
  // so the caller can undo its optimistic change.
  const write = async (what: string, run: (s: SupabaseClient) => PromiseLike<{ error: unknown }>) => {
    const supabase = getSupabase();
    const { error } = supabase ? await run(supabase) : { error: 'Supabase not configured' };
    if (!error) return true;
    console.error(what, error);
    setSaveError(SAVE_ERROR);
    return false;
  };

  // user_id fills from the auth.uid() column default
  const insert = async (entry: LogEntry) => {
    setEntries(prev => [entry, ...prev]);
    if (!(await write('insert failed', s => s.from('entries').insert(rowFor(entry))))) {
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    }
  };

  const ts = (date?: Date) => entryTimestamp(date); // real time of day, not the selected day's midnight

  const addFood = (
    meal: FoodEntry['meal'],
    description: string,
    nutrition?: { calories?: number, protein?: number, fat?: number, carbs?: number, fiber?: number, items?: FoodItem[] },
    date?: Date
  ) => insert({ id: uuidv4(), type: 'food', timestamp: ts(date), meal, description, ...nutrition });

  const addWater = (amount: number, date?: Date) =>
    insert({ id: uuidv4(), type: 'water', timestamp: ts(date), amount });

  const addWorkout = (activity: string, calories: number, duration?: number, date?: Date) =>
    insert({ id: uuidv4(), type: 'workout', timestamp: ts(date), activity, calories, duration });

  const addTask = (description: string, date?: Date) =>
    insert({ id: uuidv4(), type: 'task', timestamp: ts(date), description, completed: false });

  const addSleep = (duration: number, quality: number, category: 'Sleep' | 'Nap' = 'Sleep', date?: Date) =>
    insert({ id: uuidv4(), type: 'sleep', timestamp: ts(date), duration, quality, category });

  const toggleTask = async (id: string) => {
    const target = entries.find(e => e.id === id && e.type === 'task') as TaskEntry | undefined;
    if (!target) return;
    const updated: TaskEntry = { ...target, completed: !target.completed };
    setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
    // `data` is replaced as a whole, so send every field, not only the two this screen shows
    if (!(await write('toggle failed', s => s.from('entries').update({ data: rowFor(updated).data }).eq('id', id)))) {
      setEntries(prev => prev.map(e => (e.id === id ? target : e)));
    }
  };

  const deleteEntry = async (id: string) => {
    const removed = entries.find(e => e.id === id);
    if (!removed) return;
    setEntries(prev => prev.filter(e => e.id !== id));
    if (!(await write('delete failed', s => s.from('entries').delete().eq('id', id)))) {
      setEntries(prev => (prev.some(e => e.id === id) ? prev : [removed, ...prev]));
    }
  };

  return {
    entries,
    addFood,
    addWater,
    addWorkout,
    addTask,
    addSleep,
    toggleTask,
    deleteEntry,
    isLoaded,
    loadError,
    retryLoad,
    saveError,
    dismissSaveError: () => setSaveError(null),
  };
}
