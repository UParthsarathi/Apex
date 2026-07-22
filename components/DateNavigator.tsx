'use client';

import { useMemo } from 'react';
import { format, isSameDay, subDays, addDays, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

export function DateNavigator({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (d: Date) => void }) {
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 5),
      end: addDays(new Date(), 1)
    });
  }, []);

  return (
    <div className="flex justify-between items-center bg-white/[0.03] border border-white/[0.05] rounded-2xl p-1">
      {days.map((day) => {
        const active = isSameDay(day, selectedDate);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateChange(day)}
            className={cn(
              "flex-1 py-2 flex flex-col items-center rounded-xl transition-all duration-300",
              active ? "bg-[#00FF88] text-black shadow-[0_0_15px_rgba(0,255,136,0.3)]" : "text-white/20 hover:text-white/40"
            )}
          >
            <span className={cn("text-[7px] font-bold uppercase tracking-widest mb-0.5", active ? "text-black/60" : "text-white/10")}>
              {format(day, 'EEE')}
            </span>
            <span className="text-sm font-light tabular-nums">{format(day, 'd')}</span>
          </button>
        );
      })}
    </div>
  );
}
