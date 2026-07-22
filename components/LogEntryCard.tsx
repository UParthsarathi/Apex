'use client';

import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry, TaskEntry } from '@/hooks/use-daily-log';

export function LogEntryCard({ entry, onDelete }: { entry: LogEntry, onDelete: () => void }) {
  const time = format(entry.timestamp, 'HH:mm');

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0a0a] border border-white/[0.04] rounded-2xl p-4 relative group hover:border-white/10 transition-all duration-500"
    >
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono text-white/10 tracking-widest uppercase">{time}</span>
            <div className="w-[1px] h-1.5 bg-white/5" />
            <span className={cn(
              "text-[8px] font-bold tracking-[0.2em] uppercase",
              entry.type === 'food' ? "text-[#00FF88]/40" :
              entry.type === 'workout' ? "text-orange-500/40" :
              entry.type === 'water' ? "text-blue-500/40" :
              entry.type === 'sleep' ? "text-violet-400/40" :
              "text-[#00FF88]/40"
            )}>
              {entry.type === 'food' ? entry.meal :
               entry.type === 'workout' ? 'Workout' :
               entry.type === 'water' ? 'Hydration' :
               entry.type === 'sleep' ? 'Regeneration' :
               'Goal'}
            </span>
         </div>
         <button onClick={onDelete} className="text-white/20 hover:text-red-500 transition-all duration-300 transform active:scale-110">
           <Trash2 size={12} />
         </button>
      </div>

      <div className="space-y-3">
        {entry.type === 'food' && (
          <div className="space-y-2">
             <p className="text-base font-extralight tracking-tight leading-snug text-white/90">{entry.description}</p>

             {entry.items && entry.items.length > 0 && (
               <div className="space-y-1.5 pt-1">
                 {entry.items.map((item, idx) => (
                   <div key={item.id || idx} className="flex justify-between items-center text-[10px] border-b border-white/[0.02] last:border-0 pb-1.5 last:pb-0">
                     <div className="flex flex-col">
                       <span className="font-light text-white/50">{item.name}</span>
                       <span className="text-[7px] text-white/10 uppercase tracking-widest">
                         {item.quantity?.value} {item.quantity?.unit}
                       </span>
                     </div>
                     <div className="flex gap-2">
                       <span className="text-white/20 font-mono tracking-tighter tabular-nums">
                         {item.macros?.calories ?? 0}
                         <small className="text-[6px] ml-0.5 opacity-30 uppercase font-sans">kcal</small>
                       </span>
                       <span className="text-indigo-400/20 font-mono tracking-tighter tabular-nums">
                         {item.macros?.protein ?? 0}g
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {(entry.protein || entry.carbs || entry.fat || entry.calories || entry.fiber) ? (
               <div className="flex flex-wrap gap-3 pt-1">
                 {[
                   { label: 'kcal', val: entry.calories, color: 'text-white' },
                   { label: 'p', val: entry.protein, color: 'text-indigo-400' },
                   { label: 'fib', val: entry.fiber, color: 'text-emerald-400' },
                   { label: 'f', val: entry.fat, color: 'text-rose-400' },
                   { label: 'c', val: entry.carbs, color: 'text-amber-400' },
                   { label: 'sug', val: entry.sugar, color: 'text-white' },
                   { label: 'na', val: entry.sodium, color: 'text-white' },
                   { label: 'sat', val: entry.saturatedFat, color: 'text-white' },
                   { label: 'chol', val: entry.cholesterol, color: 'text-white' },
                   { label: 'k', val: entry.potassium, color: 'text-white' },
                   { label: 'ca', val: entry.calcium, color: 'text-white' },
                   { label: 'fe', val: entry.iron, color: 'text-white' },
                 ].filter(m => m.val).map(m => (
                   <div key={m.label} className="flex items-baseline gap-0.5">
                     <span className={cn("text-xs font-light opacity-60", m.color)}>{m.val}</span>
                     <span className="text-[7px] font-bold text-white/5 uppercase tracking-tighter">{m.label}</span>
                   </div>
                 ))}
               </div>
             ) : null}
          </div>
        )}
        {entry.type === 'water' && (
          <div className="flex justify-between items-end">
             <div className="flex flex-col">
               <span className="text-base font-extralight tracking-tight text-white/90">Water Intake</span>
               <span className="text-[7px] text-white/10 uppercase tracking-widest mt-0.5">Hydration Protocol</span>
             </div>
             <div className="text-right">
               <span className="text-xl font-light text-blue-500/80 leading-none mb-0.5 block">{entry.amount}</span>
               <span className="text-[7px] font-bold tracking-widest text-white/10 uppercase">ml</span>
             </div>
          </div>
        )}
        {entry.type === 'workout' && (
          <div className="flex justify-between items-end">
             <p className="text-lg font-extralight tracking-tight flex-1 pr-4 text-white/80">{entry.activity}</p>
             <div className="text-right">
               <span className="text-xl font-light text-orange-500/80 leading-none mb-0.5 block">{entry.calories}</span>
               <span className="text-[7px] font-bold tracking-widest text-white/10 uppercase">Net Burn</span>
             </div>
          </div>
        )}
        {entry.type === 'sleep' && (
          <div className="flex justify-between items-end">
             <div className="space-y-1">
                <p className="text-lg font-extralight tracking-tight text-white/80">
                  {Math.floor(entry.duration)}h {Math.round((entry.duration % 1) * 60)}m {entry.category || 'Sleep'}
                </p>
                <div className="flex gap-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn("w-2 h-1 rounded-full", i < entry.quality ? "bg-violet-400" : "bg-white/5")} />
                  ))}
                </div>
             </div>
             <div className="text-right">
               <span className="text-xl font-light text-violet-400/80 leading-none mb-0.5 block">{entry.quality}/10</span>
               <span className="text-[7px] font-bold tracking-widest text-white/10 uppercase">Quality Index</span>
             </div>
          </div>
        )}
        {entry.type === 'task' && (
          <p className={cn("text-lg font-extralight tracking-tight", (entry as TaskEntry).completed ? "line-through text-white/10" : "text-white/80")}>
            {entry.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
