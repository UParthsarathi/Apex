'use client';

import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Trash2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry, TaskEntry } from '@/hooks/use-daily-log';
import { DateNavigator } from '@/components/DateNavigator';
import { TaskQuickAdd } from '@/components/QuickAdds';

export function TasksTab({ entries, selectedDate, onDateChange, addTask, toggleTask, deleteEntry }: {
  entries: LogEntry[],
  selectedDate: Date,
  onDateChange: (d: Date) => void,
  addTask: (desc: string, date?: Date) => void,
  toggleTask: (id: string) => void,
  deleteEntry: (id: string) => void
}) {
  const dayEntries = entries.filter(e => isSameDay(e.timestamp, selectedDate));
  const dayTasks = dayEntries.filter(e => e.type === 'task') as TaskEntry[];

  const sortedTasks = [...dayTasks].sort((a, b) => {
    if (a.completed === b.completed) return b.timestamp - a.timestamp;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="px-5 flex flex-col min-h-full font-sans">
      <header className="mb-6 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="small-caps text-[#00FF88] !tracking-[0.3em]">Your Roadmap</span>
            <h1 className="display-light">Goals</h1>
          </div>
          <div className="pb-1 text-right flex flex-col items-end gap-1.5">
            <span className="text-xl font-light tracking-tight opacity-40">{format(selectedDate, 'MMM d')}</span>
            <div className="flex items-baseline gap-1 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
              <span className="text-[7px] font-bold text-emerald-500/40 uppercase tracking-[0.2em] leading-none">Status</span>
              <span className="text-sm font-light tabular-nums leading-none text-emerald-400">{dayTasks.filter(t => t.completed).length}</span>
              <span className="text-[8px] text-white/20 uppercase font-bold">/</span>
              <span className="text-[8px] text-white/20 font-bold tabular-nums">{dayTasks.length}</span>
            </div>
          </div>
        </div>

        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </header>

      <TaskQuickAdd onAdd={(desc) => addTask(desc, selectedDate)} className="mb-6" />

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className={cn(
                "group flex items-center justify-between p-4 rounded-3xl border transition-all duration-500",
                task.completed ? "bg-white/[0.02] border-white/5" : "bg-white/[0.05] border-white/10"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => toggleTask(task.id)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                    task.completed
                      ? "bg-[#00FF88] border-[#00FF88] text-black"
                      : "border-white/10 text-transparent"
                  )}
                >
                  <ArrowUpRight size={12} strokeWidth={3} className={cn("transition-transform duration-500", task.completed ? "rotate-0" : "rotate-45")} />
                </button>
                <span className={cn("text-base font-light tracking-tight transition-all duration-500", task.completed && "line-through text-white/10")}>
                  {task.description}
                </span>
              </div>
              <button
                onClick={() => deleteEntry(task.id)}
                className="p-2 text-white/5 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} strokeWidth={1} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedTasks.length === 0 && (
          <div className="text-center py-20 opacity-5">
            <CheckSquare size={48} strokeWidth={0.5} className="mx-auto mb-4" />
            <span className="small-caps">Zero Pending Tasks</span>
          </div>
        )}
      </div>
    </div>
  );
}
