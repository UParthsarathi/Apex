'use client';

import { useState, useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { History, Activity } from 'lucide-react';
import { LogEntry, TaskEntry, FoodEntry, WorkoutEntry, SleepEntry, WaterEntry } from '@/hooks/use-daily-log';
import { LogEntryCard } from '@/components/LogEntryCard';

export function HistoryTab({ entries, deleteEntry, onDateJump }: {
  entries: LogEntry[],
  deleteEntry: (id: string) => void,
  onDateJump: (d: Date) => void
}) {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const months = useMemo(() => {
    const unique = new Set<string>();
    entries.forEach(e => unique.add(format(e.timestamp, 'yyyy-MM')));
    unique.add(format(new Date(), 'yyyy-MM')); // Always show current month
    return Array.from(unique).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (focusedDate) {
      return entries.filter(e => format(e.timestamp, 'yyyy-MM-dd') === focusedDate);
    }
    return entries.filter(e => format(e.timestamp, 'yyyy-MM') === selectedMonth);
  }, [entries, selectedMonth, focusedDate]);

  const grouped = useMemo(() => {
    const data = filteredEntries.reduce((acc, entry) => {
      const dateStr = format(entry.timestamp, 'yyyy-MM-dd');
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(entry);
      return acc;
    }, {} as Record<string, LogEntry[]>);
    return data;
  }, [filteredEntries]);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="px-5 flex flex-col min-h-full transition-all duration-500">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Timeline</span>
          <h1 className="display-light text-3xl">History</h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          {focusedDate ? (
            <button
              onClick={() => setFocusedDate(null)}
              className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              Close Day Focus
            </button>
          ) : (
            <>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg text-[10px] p-2 font-sans uppercase tracking-widest outline-none focus:border-white/20 transition-all font-bold"
              >
                {months.map(m => (
                  <option key={m} value={m} className="bg-neutral-900">{format(new Date(m + '-01'), 'MMMM yyyy')}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </header>

      {/* Ribbon Navigator */}
      {!focusedDate && sortedDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 mb-2 border-b border-white/5">
          {sortedDates.map(date => (
            <button
              key={`jump-${date}`}
              onClick={() => setFocusedDate(date)}
              className="flex-shrink-0 group flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 group-hover:border-[#00FF88]/50 flex items-center justify-center text-[10px] font-mono transition-all">
                {format(new Date(date), 'd')}
              </div>
              <span className="text-[6px] font-bold text-white/20 uppercase tracking-[0.1em]">{format(new Date(date), 'EEE')}</span>
            </button>
          )).reverse()}
        </div>
      )}

      {sortedDates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-24">
          <History size={100} strokeWidth={0.3} />
          <span className="small-caps mt-6 text-center">No records detected for<br/>this period</span>
        </div>
      ) : (
        <div className="space-y-10 pb-24">
          {sortedDates.map(date => {
            const dayEntries = grouped[date].sort((a, b) => b.timestamp - a.timestamp);
            let dateLabel = format(new Date(date), 'MMMM d');
            if (isToday(new Date(date))) dateLabel = 'Today';
            else if (isYesterday(new Date(date))) dateLabel = 'Yesterday';

            const stats = dayEntries.reduce((acc, e) => {
              if (e.type === 'food') {
                acc.calories += (e.calories || 0);
              } else if (e.type === 'workout') {
                acc.burned += (e.calories || 0);
              } else if (e.type === 'sleep') {
                acc.sleep += e.duration;
              } else if (e.type === 'task' && e.completed) {
                acc.tasksDone += 1;
              } else if (e.type === 'water') {
                acc.water += e.amount;
              }
              return acc;
            }, { calories: 0, burned: 0, tasksDone: 0, sleep: 0, water: 0 });

            const foods = dayEntries.filter(e => e.type === 'food') as FoodEntry[];
            const workouts = dayEntries.filter(e => e.type === 'workout') as WorkoutEntry[];
            const tasks = dayEntries.filter(e => e.type === 'task') as TaskEntry[];
            const sleeps = dayEntries.filter(e => e.type === 'sleep') as SleepEntry[];
            const water = dayEntries.filter(e => e.type === 'water') as WaterEntry[];

            return (
              <div key={date} className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/[0.05] pb-2.5 px-0.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88]/50 shadow-[0_0_8px_rgba(0,255,136,0.3)]" />
            <h3 className="small-caps !text-[#00FF88]/80 text-[10px] !tracking-[0.2em]">{dateLabel}</h3>
          </div>
          <div className="flex gap-4 text-[8px] font-mono tracking-tighter uppercase tabular-nums items-center">
            <span className="text-white/40"><span className="text-white/80 font-bold">{stats.calories}</span> CALS</span>
            <span className="text-white/40"><span className="text-blue-500/80 font-bold">{stats.water}</span> ML</span>
            <span className="text-orange-500/80 font-bold">{stats.burned} BURN</span>
            {stats.sleep > 0 && (
              <span className="text-violet-400/40">
                <span className="text-violet-500/80 font-bold">{Math.floor(stats.sleep)}h {Math.round((stats.sleep % 1) * 60)}m</span> SLEEP
              </span>
            )}
            <button
              onClick={() => onDateJump(new Date(date))}
              className="text-[#00FF88]/40 hover:text-[#00FF88] flex items-center gap-1 transition-colors ml-2"
            >
              <Activity size={10} />
              <span className="text-[7px] font-bold uppercase">View Day</span>
            </button>
          </div>
                </div>

                <div className="space-y-6">
                  {foods.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Fuel Intake</span>
                      <div className="space-y-2">
                        {foods.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {water.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Hydration</span>
                      <div className="space-y-2">
                        {water.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {workouts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Kinetic Output</span>
                      <div className="space-y-2">
                        {workouts.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {sleeps.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Regeneration</span>
                      <div className="space-y-2">
                        {sleeps.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}

                  {tasks.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest block pl-1">Objectives</span>
                      <div className="space-y-2">
                        {tasks.map(entry => <LogEntryCard key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
