'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Droplets, Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoodEntry } from '@/hooks/use-daily-log';
import { DateNavigator } from '@/components/DateNavigator';
import { FoodQuickAdd, WaterQuickAdd, WorkoutQuickAdd, SleepQuickAdd } from '@/components/QuickAdds';
import { FoodChat } from '@/components/FoodChat';

export function ProtocolTab({ selectedDate, onDateChange, addFood, addWater, addWorkout, addSleep }: {
  selectedDate: Date,
  onDateChange: (d: Date) => void,
  addFood: (meal: FoodEntry['meal'], desc: string, nutrition?: any, date?: Date) => void,
  addWater: (amount: number, date?: Date) => void,
  addWorkout: (activity: string, calories: number, duration?: number, date?: Date) => void,
  addSleep: (duration: number, quality: number, category: 'Sleep' | 'Nap', date?: Date) => void,
}) {
  const [activeModule, setActiveModule] = useState<'intake' | 'water' | 'activity' | 'sleep'>('intake');
  const [foodMode, setFoodMode] = useState<'manual' | 'ai'>('manual');

  const modules = [
    { id: 'intake', label: 'Nutrition', icon: <Utensils size={14} />, color: 'text-[#00FF88]' },
    { id: 'water', label: 'Hydration', icon: <Droplets size={14} />, color: 'text-blue-500' },
    { id: 'activity', label: 'Activity', icon: <Flame size={14} />, color: 'text-orange-500' },
    { id: 'sleep', label: 'Sleep', icon: <Zap size={14} />, color: 'text-violet-400' },
  ] as const;

  return (
    <div className="px-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="space-y-4">
        <div>
          <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Quick Entry</span>
          <h1 className="display-light">Journal</h1>
        </div>
        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </header>

      {/* Module Selector - Segmented Control */}
      <div className="p-1.5 bg-[#111] border border-white/5 rounded-[24px] flex gap-1 shadow-2xl shadow-black/50 overflow-x-auto no-scrollbar">
        {modules.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={cn(
              "flex-1 min-w-[70px] py-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-500 relative overflow-hidden",
              activeModule === mod.id ? "text-white" : "text-white/10 hover:text-white/30"
            )}
          >
            {activeModule === mod.id && (
              <motion.div
                layoutId="protocol-active-bg"
                className="absolute inset-0 bg-white/[0.03] border border-white/5 shadow-inner"
                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
              />
            )}
            <div className={cn("relative z-10 transition-transform duration-500", activeModule === mod.id && mod.color)}>
              {mod.icon}
            </div>
            <span className="relative z-10 text-[7px] font-bold uppercase tracking-[0.2em]">{mod.label}</span>
          </button>
        ))}
      </div>

      <section className="min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {activeModule === 'intake' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Utensils size={12} className="text-[#00FF88]" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Add Meal</span>
                  </div>
                  <div className="flex bg-white/5 p-0.5 rounded-full">
                    {(['manual', 'ai'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setFoodMode(mode)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.15em] transition-all",
                          foodMode === mode ? "bg-[#00FF88] text-black" : "text-white/25 hover:text-white/50"
                        )}
                      >
                        {mode === 'ai' ? 'AI Chat' : 'Manual'}
                      </button>
                    ))}
                  </div>
                </div>
                {foodMode === 'manual'
                  ? <FoodQuickAdd onAdd={(m, d, n) => addFood(m, d, n, selectedDate)} />
                  : <FoodChat onAdd={(m, d, n) => addFood(m, d, n, selectedDate)} />}
              </div>
            )}

            {activeModule === 'water' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Droplets size={12} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Add Water</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">Module 02</span>
                </div>
                <WaterQuickAdd onAdd={(a) => addWater(a, selectedDate)} />
              </div>
            )}

            {activeModule === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Flame size={12} className="text-orange-500" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Log Activity</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">Module 03</span>
                </div>
                <WorkoutQuickAdd onAdd={(a, c, du) => addWorkout(a, c, du, selectedDate)} />
              </div>
            )}

            {activeModule === 'sleep' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-violet-400" />
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Log Sleep</span>
                  </div>
                  <span className="text-[8px] font-mono text-white/10 italic">Module 04</span>
                </div>
                <SleepQuickAdd onAdd={(dur, qual, cat) => addSleep(dur, qual, cat, selectedDate)} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="bento-card bg-white/[0.01] border-white/5 p-6 text-center">
        <p className="text-[8px] text-white/10 uppercase tracking-[0.3em] font-medium italic">
          Local data is synchronized
        </p>
      </div>
    </div>
  );
}
