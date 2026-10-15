import { act, renderHook, waitFor } from '@testing-library/react';
import { isSameDay, startOfToday, subDays } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDailyLog } from '@/hooks/use-daily-log';
import type { Row, TaskEntry } from '@/lib/entries';
import { createFakeSupabase } from '../fakes/supabase';

const state = vi.hoisted(() => ({ fake: null as ReturnType<typeof createFakeSupabase> | null }));
vi.mock('@/backend/supabase', () => ({ getSupabase: () => state.fake?.client ?? null }));
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1' }, session: null, loading: false }) }));
vi.spyOn(console, 'error').mockImplementation(() => {}); // the hook logs every failure it handles

const task = (id: string, timestamp: number, data: Record<string, unknown> = { description: id, completed: false }): Row =>
  ({ id, type: 'task', timestamp, data });

async function load(rows: Row[] = [], setup?: (fake: ReturnType<typeof createFakeSupabase>) => void) {
  state.fake = createFakeSupabase(rows);
  setup?.(state.fake);
  const hook = renderHook(() => useDailyLog());
  await waitFor(() => expect(hook.result.current.isLoaded).toBe(true));
  return { ...hook, fake: state.fake };
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('apex_migrated', 'true');
});

describe('useDailyLog: loading', () => {
  it('loads every entry, newest first', async () => {
    const { result } = await load([task('a', 1), task('b', 2)]);
    expect(result.current.entries.map(e => e.id)).toEqual(['b', 'a']);
    expect(result.current.loadError).toBeNull();
  });

  it('F-06: a failed load reports an error instead of an empty log, and Retry recovers', async () => {
    const { result, fake } = await load([task('a', 1)], f => f.fail('select'));
    expect(result.current.loadError).toMatch(/Couldn't load/);
    fake.recover('select');
    act(() => result.current.retryLoad());
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.loadError).toBeNull();
  });

  it.each([1000, 600])('F-13: pages past an API row cap of %i instead of silently truncating', async cap => {
    const rows = Array.from({ length: 2500 }, (_, i) => task(`r${String(i).padStart(4, '0')}`, i % 7));
    const { result } = await load(rows, f => f.capPages(cap));
    expect(result.current.entries).toHaveLength(2500);
    expect(new Set(result.current.entries.map(e => e.id)).size).toBe(2500);
  });
});

describe('useDailyLog: saving (F-01)', () => {
  it('keeps a saved entry and stores it with the real time of day (F-05)', async () => {
    const { result, fake } = await load();
    const day = subDays(startOfToday(), 2);
    await act(() => result.current.addWater(250, day));
    expect(fake.db.rows).toHaveLength(1);
    const { timestamp } = result.current.entries[0];
    expect(isSameDay(timestamp, day)).toBe(true);
    expect(timestamp).not.toBe(day.getTime());
    expect(result.current.saveError).toBeNull();
  });

  it('undoes a failed insert and tells the user', async () => {
    const { result } = await load([], f => f.fail('insert'));
    await act(() => result.current.addTask('drink water'));
    expect(result.current.entries).toEqual([]);
    expect(result.current.saveError).toMatch(/Couldn't save/);
    act(() => result.current.dismissSaveError());
    expect(result.current.saveError).toBeNull();
  });

  it('puts an entry back when the delete fails', async () => {
    const { result } = await load([task('a', 1)], f => f.fail('delete'));
    await act(() => result.current.deleteEntry('a'));
    expect(result.current.entries.map(e => e.id)).toEqual(['a']);
    expect(result.current.saveError).not.toBeNull();
  });

  it('F-18: a toggle keeps every stored field; a failed toggle is undone', async () => {
    const { result, fake } = await load([task('t', 1, { description: 'a', completed: false, note: 'keep me' })]);
    await act(() => result.current.toggleTask('t'));
    expect(fake.db.rows[0].data).toEqual({ description: 'a', completed: true, note: 'keep me' });

    fake.fail('update');
    await act(() => result.current.toggleTask('t'));
    expect((result.current.entries[0] as TaskEntry).completed).toBe(true);
    expect(result.current.saveError).not.toBeNull();
  });
});

describe('useDailyLog: legacy localStorage import (F-15)', () => {
  const legacy = JSON.stringify([{ id: 'old', type: 'water', timestamp: 1, amount: 250 }]);
  beforeEach(() => {
    localStorage.removeItem('apex_migrated');
    localStorage.setItem('daily_log_entries', legacy);
  });

  it('keeps the local copy when the upload fails, so it can retry next launch', async () => {
    await load([], f => f.fail('upsert'));
    expect(localStorage.getItem('daily_log_entries')).toBe(legacy);
    expect(localStorage.getItem('apex_migrated')).toBeNull();
  });

  it('uploads, then clears the local copy', async () => {
    const { result } = await load();
    expect(result.current.entries.map(e => e.id)).toEqual(['old']);
    expect(localStorage.getItem('daily_log_entries')).toBeNull();
    expect(localStorage.getItem('apex_migrated')).toBe('true');
  });
});
