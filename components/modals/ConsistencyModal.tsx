'use client';

import { useState, useMemo } from 'react';
import { format, isToday, isSameDay, subDays, eachDayOfInterval, startOfToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, subMonths, addMonths } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry, FoodEntry } from '@/hooks/use-daily-log';

export function ConsistencyModal({ isOpen, onClose, entries }: { isOpen: boolean, onClose: () => void, entries: LogEntry[] }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()));

  // Protein status for any date, computed from all entries (no 30-day window).
  const proteinForDay = (date: Date) => {
    const food = entries.filter(e => e.type === 'food' && isSameDay(e.timestamp, date)) as FoodEntry[];
    const protein = food.reduce((sum, f) => sum + (f.protein || 0), 0);
    let ratio = 0; // 50-90g target
    if (protein >= 90) ratio = 1;
    else if (protein >= 50) ratio = 0.5;
    return { protein, ratio };
  };

  // Streak + stats stay a rolling 30-day window (momentum is recent by nature).
  const dayStats = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i))
      .map(date => ({ date, ...proteinForDay(date) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const streak = useMemo(() => {
    let currentStreak = 0;
    const sortedDays = [...dayStats].reverse();
    for (const day of sortedDays) {
      if (day.ratio >= 0.5) {
        currentStreak++;
      } else if (isToday(day.date)) {
        continue;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [dayStats]);

  const stats = useMemo(() => {
    const perfectDays = dayStats.filter(d => d.ratio === 1).length;
    const partialDays = dayStats.filter(d => d.ratio === 0.5).length;
    const totalActiveDays = dayStats.filter(d => d.ratio > 0).length;
    const consistencyRate = dayStats.length > 0 ? Math.round((totalActiveDays / dayStats.length) * 100) : 0;
    return { perfectDays, partialDays, consistencyRate };
  }, [dayStats]);

  // Calendar grid for the viewed month, full data from all entries.
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(viewMonth)),
      end: endOfWeek(endOfMonth(viewMonth))
    }).map(date => ({
      date,
      isCurrentMonth: isSameMonth(date, viewMonth),
      isToday: isToday(date),
      ...proteinForDay(date)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, viewMonth]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-[#0c0c0c] border border-white/10 rounded-[32px] p-7 shadow-3xl relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/5 blur-[100px] rounded-full" />

            <header className="flex items-center justify-between mb-8 relative z-10">
              <div className="space-y-0.5">
                <span className="small-caps text-violet-400 !tracking-[0.4em] text-[8px]">Daily Momentum</span>
                <h2 className="text-2xl font-extralight tracking-tighter uppercase leading-none">Consistency</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-95"
              >
                <X size={14} />
              </button>
            </header>

            {/* Main Streak Display */}
            <div className="bento-card bg-white/[0.03] border-white/5 p-6 mb-8 flex items-center justify-between overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em] block mb-1">Execution Streak</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extralight tracking-tighter text-white/90">{streak}</span>
                  <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest leading-none">Cycles</span>
                </div>
              </div>
              <div className="text-right relative z-10">
                <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em] block mb-1">Success Rate</span>
                <span className="text-xl font-light text-violet-400/80 tabular-nums leading-none">{stats.consistencyRate}%</span>
                <div className="text-[6px] text-white/10 uppercase font-black tracking-tighter mt-1">Anabolic Continuity</div>
              </div>
            </div>

            {/* Momentum / Psychological Insight Section */}
            <div className="mb-8 px-1">
               <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "px-2 py-0.5 rounded-full border text-[7px] font-bold uppercase tracking-widest",
                    streak >= 7 ? "bg-violet-400/10 border-violet-400/20 text-violet-400" :
                    streak >= 3 ? "bg-sky-500/10 border-sky-500/20 text-sky-400" :
                    "bg-white/5 border-white/10 text-white/40"
                  )}>
                    {streak >= 7 ? "Apex State" : streak >= 3 ? "Momentum Locked" : "System Warming"}
                  </div>
                  <div className="h-[1px] flex-1 bg-white/5" />
               </div>
               <p className="text-[10px] font-light text-white/40 leading-relaxed italic">
                 {streak >= 7
                   ? "You are currently in a high-density anabolic window. Neural pathways are optimized for discipline. Do not break the cycle."
                   : streak >= 3
                   ? "Consistent protein synthesis detected. Psychological momentum is building. Your system is adapting to the protocol."
                   : "Initial phase active. Focus on hitting the 50g protein floor to maintain continuity and trigger baseline metabolic response."}
               </p>
            </div>

            {/* Proper Calendar Grid */}
            <div className="mb-8 relative z-10">
              <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                    className="p-1 text-white/30 hover:text-violet-400 transition-colors active:scale-90"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em] min-w-[76px] text-center">{format(viewMonth, 'MMM yyyy')}</span>
                  <button
                    onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                    className="p-1 text-white/30 hover:text-violet-400 transition-colors active:scale-90"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-sm bg-violet-400" />
                     <span className="text-[6px] font-bold text-white/20 uppercase">Target (90g+)</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-sm bg-violet-400/20" />
                     <span className="text-[6px] font-bold text-white/20 uppercase">Fair (50g+)</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={`${day}-${i}`} className="text-[7px] font-bold text-white/10 text-center mb-2">{day}</div>
                ))}
                {calendarDays.map((day, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className={cn(
                      "aspect-square rounded-md flex items-center justify-center transition-all duration-300 relative group",
                      !day.isCurrentMonth ? "opacity-0 pointer-events-none" : "",
                      day.protein === 0 ? "bg-white/[0.03]" :
                      day.ratio === 1 ? "bg-violet-400 text-black shadow-[0_0_10px_rgba(167,139,250,0.2)]" :
                      day.ratio > 0 ? "bg-violet-400/20 text-violet-400/60" :
                      "bg-rose-500/10 border border-rose-500/10 text-rose-500/40"
                    )}
                  >
                    <span className="text-[8px] font-mono leading-none">{format(day.date, 'd')}</span>
                    {day.isToday && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-white/40 rounded-full" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em]">Neuro-Sync Active</span>
              </div>
              <p className="text-[7px] font-mono text-white/10 italic">
                {streak > 0 ? 'Habit loop stabilized' : 'Awaiting baseline...'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
