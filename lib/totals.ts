import { format, subDays } from 'date-fns';
import type { LogEntry } from '@/lib/entries';

// Never let a stray string turn a sum into concatenation ("0" + "260" = "0260").
export const toNumber = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Sums of decimal macros pick up float noise (4.5 + 2.2 + 1.1 = 7.800000000000001); show at most one decimal.
export const formatAmount = (n: number) => String(Math.round(n * 10) / 10);

export const dayKey = (d: Date | number) => format(d, 'yyyy-MM-dd');

export function proteinByDay(entries: LogEntry[]) {
  const byDay = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== 'food') continue;
    const key = dayKey(e.timestamp);
    byDay.set(key, (byDay.get(key) ?? 0) + toNumber(e.protein));
  }
  return byDay;
}

// Consecutive days at or above the protein floor, ending today (or yesterday while today is in progress).
export function currentStreak(byDay: Map<string, number>, today: Date, floor = 50) {
  let day = today;
  if ((byDay.get(dayKey(day)) ?? 0) < floor) day = subDays(day, 1);
  let streak = 0;
  while ((byDay.get(dayKey(day)) ?? 0) >= floor) {
    streak++;
    day = subDays(day, 1);
  }
  return streak;
}
