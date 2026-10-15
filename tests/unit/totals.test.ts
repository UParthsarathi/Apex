import { setHours, startOfToday, subDays } from 'date-fns';
import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@/lib/entries';
import { currentStreak, formatAmount, proteinByDay, toNumber } from '@/lib/totals';

const food = (daysAgo: number, protein: unknown): LogEntry =>
  ({ id: `${daysAgo}-${String(protein)}`, type: 'food', timestamp: setHours(subDays(startOfToday(), daysAgo), 12).getTime(), meal: 'Lunch', description: 'x', protein } as LogEntry);

describe('toNumber (F-08)', () => {
  it('adds numbers written as text instead of concatenating them', () => {
    expect([0, '260', 330].reduce<number>((s, v) => s + toNumber(v), 0)).toBe(590);
    expect(toNumber('abc')).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });
});

describe('formatAmount (F-21)', () => {
  it('shows at most one decimal', () => {
    expect(formatAmount(4.5 + 2.2 + 1.1)).toBe('7.8');
    expect(formatAmount(0.1 + 0.2)).toBe('0.3');
    expect(formatAmount(590)).toBe('590');
    expect(formatAmount(-150.25)).toBe('-150.2');
  });
});

describe('currentStreak (F-22)', () => {
  const today = startOfToday();

  it('counts past 30 days', () => {
    const entries = Array.from({ length: 45 }, (_, i) => food(i, 60));
    expect(currentStreak(proteinByDay(entries), today)).toBe(45);
  });

  it("does not break the streak while today's protein is still below the floor", () => {
    expect(currentStreak(proteinByDay([food(0, 10), food(1, 60), food(2, 60)]), today)).toBe(2);
  });

  it('stops at the first missed day and adds up several meals per day', () => {
    expect(currentStreak(proteinByDay([food(0, 30), food(0, 25), food(1, 60), food(3, 60)]), today)).toBe(2);
  });
});
