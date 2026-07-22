'use client';

import { isSameDay } from 'date-fns';
import { motion } from 'motion/react';
import { Droplets, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry, TaskEntry, FoodEntry, WorkoutEntry, SleepEntry, WaterEntry } from '@/hooks/use-daily-log';
import { DateNavigator } from '@/components/DateNavigator';

export function HomeTab({ entries, selectedDate, onDateChange, addTask }: {
  entries: LogEntry[],
  selectedDate: Date,
  onDateChange: (d: Date) => void,
  addTask: (desc: string, date?: Date) => void,
}) {
  const todayEntries = entries.filter(e => isSameDay(e.timestamp, selectedDate));
  const tasks = todayEntries.filter(e => e.type === 'task') as TaskEntry[];
  const workouts = todayEntries.filter(e => e.type === 'workout') as WorkoutEntry[];
  const food = todayEntries.filter(e => e.type === 'food') as FoodEntry[];
  const waterEntries = todayEntries.filter(e => e.type === 'water') as WaterEntry[];

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalBurned = workouts.reduce((sum, w) => sum + w.calories, 0);
  const totalWater = waterEntries.reduce((sum, w) => sum + w.amount, 0);

  const sleepEntries = todayEntries.filter(e => e.type === 'sleep') as SleepEntry[];
  const coreSleep = sleepEntries.filter(s => s.category !== 'Nap').reduce((sum, s) => sum + s.duration, 0);
  const napSleep = sleepEntries.filter(s => s.category === 'Nap').reduce((sum, s) => sum + s.duration, 0);
  const totalSleep = coreSleep + napSleep;
  const avgSleepQuality = sleepEntries.length > 0
    ? sleepEntries.reduce((sum, s) => sum + s.quality, 0) / sleepEntries.length
    : 0;

  const nutrition = food.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fat: acc.fat + (f.fat || 0),
    fiber: acc.fiber + (f.fiber || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  return (
    <div className="px-5 space-y-6">
       <header className="space-y-4">
        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </header>

      {entries.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-center space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-extralight tracking-tight text-white">Empty Log</h2>
            <p className="text-xs text-white/30 uppercase tracking-widest leading-relaxed">No records found. Start tracking your activities manually below.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => addTask('Establish your daily goals')}
              className="flex-1 bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer relative z-10"
            >
              Start Log
            </button>
          </div>
        </motion.div>
      )}

      {/* Primary Metrics Bento - High Density */}
      <section className="grid grid-cols-4 gap-3">
        {/* Main Burn/Intake Card */}
        <div className="col-span-4 bento-card bg-white/[0.03] border-white/5 p-5 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 space-y-0.5">
            <span className="small-caps text-white/30 !tracking-widest">Net Intake</span>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-extralight tracking-tighter text-white/90">
                 {nutrition.calories - totalBurned}
               </span>
               <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap">kcal</span>
            </div>
          </div>

          <div className="relative z-10 flex gap-4 text-right">
            <div className="space-y-0">
               <span className="text-[8px] font-bold text-[#00FF88]/40 uppercase tracking-widest">Eaten</span>
               <p className="text-xl font-light leading-none text-white/80">{nutrition.calories}</p>
            </div>
            <div className="space-y-0 text-orange-500/80">
               <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Burned</span>
               <p className="text-xl font-light leading-none">{totalBurned}</p>
            </div>
          </div>
        </div>

        {/* Macronutrient Status */}
        <div className="col-span-2 bento-card flex flex-col gap-2.5 p-4 border-violet-500/10 bg-violet-500/[0.02] group">
           <div className="flex items-center justify-between">
              <span className="small-caps !text-violet-400/40 text-[8px] !tracking-[0.2em]">Protein</span>
              <span className="text-base font-light font-mono tabular-nums text-violet-100/80">{nutrition.protein}<small className="text-[8px] opacity-20 ml-0.5">g</small></span>
           </div>
           <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((nutrition.protein / 90) * 100, 100)}%` }}
                className="h-full bg-violet-400/80 shadow-[0_0_8px_rgba(167,139,250,0.3)]"
              />
           </div>
        </div>

        <div className="col-span-2 bento-card flex flex-col gap-2.5 p-4 border-emerald-500/10 bg-emerald-500/[0.02] group">
           <div className="flex items-center justify-between">
              <span className="small-caps !text-emerald-400/40 text-[8px] !tracking-[0.2em]">Fiber</span>
              <span className="text-base font-light font-mono tabular-nums text-emerald-100/80">{nutrition.fiber}<small className="text-[8px] opacity-20 ml-0.5">g</small></span>
           </div>
           <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((nutrition.fiber / 30) * 100, 100)}%` }}
                className="h-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.3)]"
              />
           </div>
        </div>

        {/* Water Intake Card */}
        <div className="col-span-2 bento-card p-4 flex flex-col justify-between border-blue-500/10 bg-blue-500/[0.03] group">
          <div className="flex justify-between items-start">
            <span className="small-caps !text-blue-400/40 text-[8px] !tracking-[0.2em]">Hydration</span>
            <Droplets size={12} className="text-blue-400/40" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-blue-400/90 leading-none tabular-nums">{totalWater}</span>
            <span className="text-[8px] text-blue-400/20 uppercase font-bold tracking-widest">ml</span>
          </div>
          <div className="h-[1.5px] w-full bg-white/5 rounded-full overflow-hidden mt-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalWater / 3000) * 100, 100)}%` }}
              className="h-full bg-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            />
          </div>
        </div>

        {/* Sleep Card */}
        <div className="col-span-2 bento-card p-4 flex flex-col justify-between border-violet-500/10 bg-violet-500/[0.03] group">
          <div className="flex justify-between items-start">
            <span className="small-caps !text-violet-400/40 text-[8px] !tracking-[0.2em]">Rest</span>
            <Zap size={12} className="text-violet-400/40" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-violet-400/90 leading-none tabular-nums">{Math.floor(totalSleep)}</span>
            <span className="text-[10px] text-violet-400/20 uppercase font-bold tracking-widest">h</span>
            <span className="text-2xl font-light text-violet-400/90 leading-none tabular-nums ml-1">{Math.round((totalSleep % 1) * 60)}</span>
            <span className="text-[10px] text-violet-400/20 uppercase font-bold tracking-widest">m</span>
          </div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn("flex-1 h-0.5 rounded-full shadow-sm", i < (avgSleepQuality / 2) ? "bg-violet-400" : "bg-white/5")} />
            ))}
          </div>
        </div>

        <div className="bento-card p-3 flex flex-col items-center gap-1 border-amber-500/5 bg-amber-500/[0.02]">
           <span className="text-base font-light text-amber-400/80 leading-none">{nutrition.carbs}g</span>
           <span className="text-[7px] font-bold tracking-[0.2em] text-amber-500/20 uppercase">Carbs</span>
        </div>

        <div className="bento-card p-3 flex flex-col items-center gap-1 border-rose-500/5 bg-rose-500/[0.02]">
           <span className="text-base font-light text-rose-500/80 leading-none">{nutrition.fat}g</span>
           <span className="text-[7px] font-bold tracking-[0.2em] text-rose-500/20 uppercase">Fats</span>
        </div>

        <div className="col-span-2 bento-card p-3 flex items-center justify-center gap-4 bg-indigo-500/[0.02] border-indigo-500/10 group">
           <div className="flex flex-col items-center">
              <span className="text-base font-light font-mono text-white/80 leading-tight">{completedTasks}<span className="text-white/20 mx-0.5">/</span>{tasks.length}</span>
              <span className="text-[7px] font-bold text-white/10 tracking-[0.2em] uppercase">Goals</span>
           </div>
           <div className="w-[1px] h-6 bg-white/5" />
           <div className="flex flex-col items-center">
              <span className="text-base font-light font-mono text-indigo-400/90 leading-tight">{tasks.length > 0 ? Math.round((completedTasks/tasks.length)*100) : 0}%</span>
              <span className="text-[7px] font-bold text-white/10 tracking-[0.2em] uppercase">Done</span>
           </div>
        </div>
      </section>
    </div>
  );
}
