import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type LogType = 'food' | 'workout' | 'task' | 'sleep' | 'water';

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

export function useDailyLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('daily_log_entries');

    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored entries");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('daily_log_entries', JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addFood = (
    meal: FoodEntry['meal'], 
    description: string, 
    nutrition?: { calories?: number, protein?: number, fat?: number, carbs?: number, fiber?: number, items?: FoodItem[] },
    date?: Date
  ) => {
    const timestamp = date ? date.getTime() : Date.now();
    const entry: FoodEntry = {
      id: uuidv4(),
      type: 'food',
      timestamp,
      meal,
      description,
      ...nutrition
    };
    setEntries(prev => [entry, ...prev]);
  };

  const addWater = (amount: number, date?: Date) => {
    const timestamp = date ? date.getTime() : Date.now();
    const entry: WaterEntry = {
      id: uuidv4(),
      type: 'water',
      timestamp,
      amount,
    };
    setEntries(prev => [entry, ...prev]);
  };

  const addWorkout = (activity: string, calories: number, duration?: number, date?: Date) => {
    const timestamp = date ? date.getTime() : Date.now();
    const entry: WorkoutEntry = {
      id: uuidv4(),
      type: 'workout',
      timestamp,
      activity,
      calories,
      duration,
    };
    setEntries(prev => [entry, ...prev]);
  };

  const addTask = (description: string, date?: Date) => {
    const timestamp = date ? date.getTime() : Date.now();
    const entry: TaskEntry = {
      id: uuidv4(),
      type: 'task',
      timestamp,
      description,
      completed: false,
    };
    setEntries(prev => [entry, ...prev]);
  };

  const addSleep = (duration: number, quality: number, category: 'Sleep' | 'Nap' = 'Sleep', date?: Date) => {
    const timestamp = date ? date.getTime() : Date.now();
    const entry: SleepEntry = {
      id: uuidv4(),
      type: 'sleep',
      timestamp,
      duration,
      quality,
      category,
    };
    setEntries(prev => [entry, ...prev]);
  };

  const toggleTask = (id: string) => {
    setEntries(prev => 
        prev.map(entry => 
          entry.id === id && entry.type === 'task' 
            ? { ...entry, completed: !entry.completed } 
            : entry
        )
      );
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const clearLogs = () => {
    setEntries([]);
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
    clearLogs,
    isLoaded
  };
}
