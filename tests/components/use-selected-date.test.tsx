import { act, renderHook } from '@testing-library/react';
import { format } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSelectedDate } from '@/hooks/use-selected-date';

const day = (d: Date) => format(d, 'yyyy-MM-dd');
const reopenApp = () => act(() => { document.dispatchEvent(new Event('visibilitychange')); });

describe('useSelectedDate (F-12)', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 23, 50));
  });
  afterEach(() => vi.useRealTimers());

  it('moves to the new today when the app is reopened after midnight', () => {
    const { result } = renderHook(() => useSelectedDate());
    expect(day(result.current[0])).toBe('2026-10-15');
    vi.setSystemTime(new Date(2026, 9, 16, 8, 0));
    reopenApp();
    expect(day(result.current[0])).toBe('2026-10-16');
  });

  it('leaves a day the user picked on purpose alone', () => {
    const { result } = renderHook(() => useSelectedDate());
    act(() => result.current[1](new Date(2026, 9, 12)));
    vi.setSystemTime(new Date(2026, 9, 16, 8, 0));
    reopenApp();
    expect(day(result.current[0])).toBe('2026-10-12');
  });
});
