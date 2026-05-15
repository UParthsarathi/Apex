import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type LogType = 'food' | 'workout' | 'task';

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

export type LogEntry = (FoodEntry | WorkoutEntry | TaskEntry) & { isSimulation?: boolean };

export function useDailyLog() {
  const [realEntries, setRealEntries] = useState<LogEntry[]>([]);
  const [simulationEntries, setSimulationEntries] = useState<LogEntry[]>([]);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedReal = localStorage.getItem('daily_log_entries');
    const storedSim = localStorage.getItem('simulation_log_entries');
    const storedMode = localStorage.getItem('daily_log_mode');

    if (storedReal) {
      try {
        setRealEntries(JSON.parse(storedReal));
      } catch (e) {
        console.error("Failed to parse stored real entries");
      }
    }
    if (storedSim) {
      try {
        setSimulationEntries(JSON.parse(storedSim));
      } catch (e) {
        console.error("Failed to parse stored simulation entries");
      }
    }
    if (storedMode === 'simulation') {
      setIsSimulationMode(true);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('daily_log_entries', JSON.stringify(realEntries));
      localStorage.setItem('simulation_log_entries', JSON.stringify(simulationEntries));
      localStorage.setItem('daily_log_mode', isSimulationMode ? 'simulation' : 'real');
    }
  }, [realEntries, simulationEntries, isSimulationMode, isLoaded]);

  const activeEntries = isSimulationMode ? simulationEntries : realEntries;

  const addFood = (
    meal: FoodEntry['meal'], 
    description: string, 
    nutrition?: { calories?: number, protein?: number, fat?: number, carbs?: number, fiber?: number, items?: FoodItem[] }
  ) => {
    const entry: FoodEntry = {
      id: uuidv4(),
      type: 'food',
      timestamp: Date.now(),
      meal,
      description,
      ...nutrition
    };
    if (isSimulationMode) {
      setSimulationEntries(prev => [entry, ...prev]);
    } else {
      setRealEntries(prev => [entry, ...prev]);
    }
  };

  const addWorkout = (activity: string, calories: number, duration?: number) => {
    const entry: WorkoutEntry = {
      id: uuidv4(),
      type: 'workout',
      timestamp: Date.now(),
      activity,
      calories,
      duration,
    };
    if (isSimulationMode) {
      setSimulationEntries(prev => [entry, ...prev]);
    } else {
      setRealEntries(prev => [entry, ...prev]);
    }
  };

  const addTask = (description: string) => {
    const entry: TaskEntry = {
      id: uuidv4(),
      type: 'task',
      timestamp: Date.now(),
      description,
      completed: false,
    };
    if (isSimulationMode) {
      setSimulationEntries(prev => [entry, ...prev]);
    } else {
      setRealEntries(prev => [entry, ...prev]);
    }
  };

  const toggleTask = (id: string) => {
    const updater = (prev: LogEntry[]) => 
      prev.map(entry => 
        entry.id === id && entry.type === 'task' 
          ? { ...entry, completed: !entry.completed } 
          : entry
      );
    
    if (isSimulationMode) {
      setSimulationEntries(updater);
    } else {
      setRealEntries(updater);
    }
  };

  const deleteEntry = (id: string) => {
    const updater = (prev: LogEntry[]) => prev.filter(entry => entry.id !== id);
    if (isSimulationMode) {
      setSimulationEntries(updater);
    } else {
      setRealEntries(updater);
    }
  };

  const clearLogs = () => {
    if (isSimulationMode) {
      setSimulationEntries([]);
    } else {
      setRealEntries([]);
    }
  };

  const clearSimulation = () => {
    setSimulationEntries([]);
    setIsSimulationMode(false);
  };

  const seedSimulation = () => {
    const mockEntries: LogEntry[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const baseTime = date.getTime();
      
      const meals: { meal: FoodEntry['meal'], hour: number, desc: string, cals: number }[] = [
        { meal: 'Breakfast', hour: 8, desc: 'Oatmeal with berries and nuts', cals: 350 },
        { meal: 'Lunch', hour: 13, desc: 'Grilled chicken salad with avocado', cals: 550 },
        { meal: 'Snacks', hour: 16, desc: 'Greek yogurt with honey', cals: 200 },
        { meal: 'Dinner', hour: 19, desc: 'Salmon with wilted greens and quinoa', cals: 650 }
      ];

      meals.forEach(m => {
        const mealTime = new Date(baseTime);
        mealTime.setHours(m.hour, Math.floor(Math.random() * 60));
        mockEntries.push({
          id: uuidv4(),
          type: 'food',
          timestamp: mealTime.getTime(),
          meal: m.meal,
          description: m.desc,
          calories: m.cals,
          protein: Math.floor(m.cals / 15),
          carbs: Math.floor(m.cals / 10),
          fat: Math.floor(m.cals / 30),
          fiber: 5,
          isSimulation: true
        });
      });

      const tasks = ['Update system protocols', 'Optimize neural pathways', 'Cardiovascular maintenance', 'Review tactical logs'];
      tasks.forEach((t, index) => {
        const taskTime = new Date(baseTime);
        taskTime.setHours(9 + index * 2);
        mockEntries.push({
          id: uuidv4(),
          type: 'task',
          timestamp: taskTime.getTime(),
          description: t,
          completed: Math.random() > 0.3,
          isSimulation: true
        });
      });

      if (Math.random() > 0.4) {
        const workoutTime = new Date(baseTime);
        workoutTime.setHours(17, 30);
        mockEntries.push({
          id: uuidv4(),
          type: 'workout',
          timestamp: workoutTime.getTime(),
          activity: Math.random() > 0.5 ? 'Zone 2 Endurance' : 'Hypertrophy Session',
          calories: 400 + Math.floor(Math.random() * 200),
          isSimulation: true
        });
      }
    }

    setSimulationEntries(mockEntries.sort((a, b) => b.timestamp - a.timestamp));
    setIsSimulationMode(true);
  };

  return {
    entries: activeEntries,
    isSimulationMode,
    setIsSimulationMode,
    addFood,
    addWorkout,
    addTask,
    toggleTask,
    deleteEntry,
    clearLogs,
    clearSimulation,
    seedSimulation,
    isLoaded
  };
}
