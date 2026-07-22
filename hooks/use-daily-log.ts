import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from '@/backend/supabase';
import { useAuth } from '@/components/AuthProvider';

export type LogType = 'food' | 'workout' | 'task' | 'sleep' | 'water';

// Single source of truth for every tracked nutrient — the JSON parser,
// manual entry, and dashboard sums all iterate this list.
// Units by convention: g for macros/sugar/saturatedFat, mg for the rest.
export const NUTRIENT_KEYS = [
  'calories', 'protein', 'carbs', 'fat', 'fiber',
  'sugar', 'sodium', 'saturatedFat', 'cholesterol',
  'potassium', 'calcium', 'iron',
] as const;
export type NutrientKey = typeof NUTRIENT_KEYS[number];

export interface WaterEntry {
  id: string;
  type: 'water';
  timestamp: number;
  amount: number; // in ml
}

export interface FoodItem {
  id: string;
  name: string;
  quantity: {
    value: number;
    unit: string;
  };
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar?: number;
    sodium?: number;
    saturatedFat?: number;
    cholesterol?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
  };
}

export interface FoodEntry {
  id: string;
  type: 'food';
  timestamp: number;
  meal: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  description: string;
  items?: FoodItem[];
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  cholesterol?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
}

export interface WorkoutEntry {
  id: string;
  type: 'workout';
  timestamp: number;
  activity: string;
  calories: number;
  duration?: number; // in minutes
}

export interface TaskEntry {
  id: string;
  type: 'task';
  timestamp: number;
  description: string;
  completed: boolean;
}

export interface SleepEntry {
  id: string;
  type: 'sleep';
  timestamp: number;
  duration: number; // in hours
  quality: number; // 1-10
  category: 'Sleep' | 'Nap';
}

export type LogEntry = (FoodEntry | WorkoutEntry | TaskEntry | SleepEntry | WaterEntry);

// --- row <-> entry mapping (id/type/timestamp are columns, the rest rides in jsonb) ---
type Row = { id: string; type: LogType; timestamp: number; data: Record<string, unknown> };

function rowFor(e: LogEntry): Row {
  const { id, type, timestamp, ...data } = e;
  return { id, type, timestamp, data };
}

function entryFor(r: Row): LogEntry {
  // Supabase/PostgREST serializes bigint as a string — coerce back to number for date math.
  return { id: r.id, type: r.type, timestamp: Number(r.timestamp), ...r.data } as LogEntry;
}

// one runnable check on the data-integrity path (dev only)
if (process.env.NODE_ENV !== 'production') {
  const sample: FoodEntry = { id: 'x', type: 'food', timestamp: 1, meal: 'Lunch', description: 'a', calories: 10 };
  console.assert(
    JSON.stringify(entryFor(rowFor(sample) as Row)) === JSON.stringify(sample),
    'use-daily-log: row<->entry roundtrip broken'
  );
}

export function useDailyLog() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const supabase = getSupabase();

    if (!user || !supabase) {
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
  }, [user?.id, authLoading]);

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
