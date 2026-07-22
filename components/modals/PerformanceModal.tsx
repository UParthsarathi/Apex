'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, isSameDay, subDays, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogEntry } from '@/hooks/use-daily-log';

function PerformanceGraph({ entries, selectedDate }: { entries: LogEntry[], selectedDate: Date }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(day => {
      const dayEntries = entries.filter(e => isSameDay(e.timestamp, day));
      const intake = dayEntries.reduce((sum, e) => sum + (e.type === 'food' ? (e.calories || 0) : 0), 0);
      const activity = dayEntries.reduce((sum, e) => sum + (e.type === 'workout' ? (e.calories || 0) : 0), 0);
      return {
        name: format(day, 'd'),
        intake,
        activity,
        isCurrent: isSameDay(day, selectedDate)
      };
    });
  }, [entries, selectedDate]);

  if (!isMounted) {
    return <div className="w-full h-full bg-white/[0.02] rounded-2xl animate-pulse" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FB923C" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: '#ffffff20' }}
          dy={10}
        />
        <YAxis hide />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-[#111] border border-white/10 p-3 rounded-2xl shadow-2xl">
                  <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Summary</p>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-[9px] text-[#00FF88] uppercase">Nutrition</span>
                      <span className="text-[10px] font-mono text-white">{payload[0].value} kcal</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[9px] text-orange-400 uppercase">Activity</span>
                      <span className="text-[10px] font-mono text-white">{payload[1].value} kcal</span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey="intake"
          stroke="#00FF88"
          fillOpacity={1}
          fill="url(#colorIntake)"
          strokeWidth={2}
          animationDuration={2000}
        />
        <Area
          type="monotone"
          dataKey="activity"
          stroke="#FB923C"
          fillOpacity={1}
          fill="url(#colorActivity)"
          strokeWidth={2}
          animationDuration={2500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PerformanceModal({ isOpen, onClose, entries, selectedDate }: { isOpen: boolean, onClose: () => void, entries: LogEntry[], selectedDate: Date }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-0.5">
                <span className="small-caps !text-[#00FF88] text-[8px] !tracking-[0.3em]">Insights</span>
                <h2 className="text-xl font-light tracking-tight uppercase">Performance</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF88] shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Intake</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Activity</span>
              </div>
            </div>

            <div className="h-64 mb-4">
              <PerformanceGraph entries={entries} selectedDate={selectedDate} />
            </div>

            <p className="text-[8px] text-center text-white/10 uppercase tracking-[0.2em] font-bold py-2 border-t border-white/5">
              Synchronized with local persistence buffer
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
