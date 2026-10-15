// Entry types and the row <-> entry mapping. Pure: no React, no Supabase client.

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
  id?: string; // LLM-produced items have no id
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
export type Row = { id: string; type: LogType; timestamp: number; data: Record<string, unknown> };

export function rowFor(e: LogEntry): Row {
  const { id, type, timestamp, ...data } = e;
  return { id, type, timestamp, data };
}

export function entryFor(r: Row): LogEntry {
  // Supabase/PostgREST serializes bigint as a string — coerce back to number for date math.
  return { id: r.id, type: r.type, timestamp: Number(r.timestamp), ...r.data } as LogEntry;
}
