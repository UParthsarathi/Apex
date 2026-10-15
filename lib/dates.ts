import { isSameDay, set } from 'date-fns';

// When an entry is logged "on" a day: now if that day is today, otherwise that day at the current
// clock time. Using the day's midnight (the old behaviour) showed 00:00 on every card and moved
// entries to the previous day for anyone viewing from further west.
export function entryTimestamp(day?: Date, now: Date = new Date()): number {
  if (!day || isSameDay(day, now)) return now.getTime();
  return set(day, {
    hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), milliseconds: now.getMilliseconds(),
  }).getTime();
}

// History groups entries by local 'yyyy-MM-dd' keys. new Date('2026-10-15') would read that as UTC
// midnight, which is still the 14th anywhere west of UTC.
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
