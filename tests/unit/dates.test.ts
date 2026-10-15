import { format } from 'date-fns';
import { afterEach, describe, expect, it } from 'vitest';
import { entryTimestamp, parseDayKey } from '@/lib/dates';

describe('entryTimestamp (F-05)', () => {
  const now = new Date(2026, 9, 16, 8, 30, 15);

  it('uses the current time when logging for today', () => {
    expect(entryTimestamp(new Date(2026, 9, 16), now)).toBe(now.getTime());
    expect(entryTimestamp(undefined, now)).toBe(now.getTime());
  });

  it('keeps the time of day when logging for another day, instead of midnight', () => {
    expect(format(entryTimestamp(new Date(2026, 9, 14), now), 'yyyy-MM-dd HH:mm:ss')).toBe('2026-10-14 08:30:15');
  });
});

describe('parseDayKey (F-09)', () => {
  const original = process.env.TZ;
  afterEach(() => { process.env.TZ = original; });

  for (const tz of ['America/New_York', 'Asia/Kolkata', 'Pacific/Auckland']) {
    it(`reads 'yyyy-MM-dd' as that local day in ${tz}`, () => {
      process.env.TZ = tz;
      expect(format(parseDayKey('2026-10-15'), 'yyyy-MM-dd')).toBe('2026-10-15');
      expect(format(parseDayKey('2026-10-01'), 'MMMM yyyy')).toBe('October 2026');
    });
  }

  it('guards against the original bug: new Date(key) is the previous day in New York', () => {
    process.env.TZ = 'America/New_York';
    expect(format(new Date('2026-10-15'), 'yyyy-MM-dd')).toBe('2026-10-14');
  });
});
