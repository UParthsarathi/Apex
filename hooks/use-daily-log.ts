import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/backend/supabase';
import { useAuth } from '@/components/AuthProvider';
import { entryFor, rowFor, type FoodEntry, type FoodItem, type LogEntry, type Row, type TaskEntry } from '@/lib/entries';

// Types and NUTRIENT_KEYS live in lib/entries.ts (pure, unit-tested); re-exported so existing imports keep working.
export { NUTRIENT_KEYS } from '@/lib/entries';
export type { LogType, NutrientKey, WaterEntry, FoodItem, FoodEntry, WorkoutEntry, TaskEntry, SleepEntry, LogEntry } from '@/lib/entries';

export function useDailyLog() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id; // refetch only when the account changes, not on every token refresh
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
      // one-time import of pre-existing localStorage data into this account
      if (localStorage.getItem('apex_migrated') !== 'true') {
        try {
          const local: LogEntry[] = JSON.parse(localStorage.getItem('daily_log_entries') || '[]');
          if (local.length) await supabase.from('entries').upsert(local.map(rowFor)); // upsert = idempotent
          localStorage.setItem('apex_migrated', 'true');
          localStorage.removeItem('daily_log_entries'); // DB is the source of truth now
        } catch (e) {
          console.error('local import failed', e);
        }
      }

      const { data, error } = await supabase
        .from('entries')
        .select('id, type, timestamp, data')
        .order('timestamp', { ascending: false });

      if (cancelled) return;
      if (error) console.error('fetch entries failed', error);
      setEntries((data ?? []).map(entryFor as (r: Row) => LogEntry));
      setIsLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [userId, authLoading]);

  // optimistic local insert + single-row write; user_id fills from auth.uid() default
  const insert = (entry: LogEntry) => {
    setEntries(prev => [entry, ...prev]);
    getSupabase()?.from('entries').insert(rowFor(entry)).then(({ error }) => {
      if (error) console.error('insert failed', error);
    });
  };

  const ts = (date?: Date) => (date ? date.getTime() : Date.now());

  const addFood = (
    meal: FoodEntry['meal'],
    description: string,
    nutrition?: { calories?: number, protein?: number, fat?: number, carbs?: number, fiber?: number, items?: FoodItem[] },
    date?: Date
  ) => {
    insert({ id: uuidv4(), type: 'food', timestamp: ts(date), meal, description, ...nutrition });
  };

  const addWater = (amount: number, date?: Date) => {
    insert({ id: uuidv4(), type: 'water', timestamp: ts(date), amount });
  };

  const addWorkout = (activity: string, calories: number, duration?: number, date?: Date) => {
    insert({ id: uuidv4(), type: 'workout', timestamp: ts(date), activity, calories, duration });
  };

  const addTask = (description: string, date?: Date) => {
    insert({ id: uuidv4(), type: 'task', timestamp: ts(date), description, completed: false });
  };

  const addSleep = (duration: number, quality: number, category: 'Sleep' | 'Nap' = 'Sleep', date?: Date) => {
    insert({ id: uuidv4(), type: 'sleep', timestamp: ts(date), duration, quality, category });
  };

  const toggleTask = (id: string) => {
    const target = entries.find(e => e.id === id && e.type === 'task') as TaskEntry | undefined;
    if (!target) return;
    const completed = !target.completed;
    setEntries(prev => prev.map(e =>
      e.id === id && e.type === 'task' ? { ...e, completed } : e
    ));
    getSupabase()?.from('entries')
      .update({ data: { description: target.description, completed } })
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('toggle failed', error); });
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    getSupabase()?.from('entries').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('delete failed', error);
    });
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
    isLoaded
  };
}
