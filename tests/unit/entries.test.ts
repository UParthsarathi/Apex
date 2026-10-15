import { describe, expect, it } from 'vitest';
import { entryFor, rowFor, type FoodEntry, type Row } from '@/lib/entries';

describe('row <-> entry mapping', () => {
  it('round-trips an entry through the database row shape', () => {
    const entry: FoodEntry = { id: 'x', type: 'food', timestamp: 1, meal: 'Lunch', description: 'a', calories: 10 };
    expect(rowFor(entry)).toEqual({ id: 'x', type: 'food', timestamp: 1, data: { meal: 'Lunch', description: 'a', calories: 10 } });
    expect(entryFor(rowFor(entry))).toEqual(entry);
  });

  it('turns a bigint timestamp that arrives as a string back into a number', () => {
    const row = { id: 'x', type: 'task', timestamp: '1760000000000', data: { description: 'd', completed: false } } as unknown as Row;
    expect(entryFor(row).timestamp).toBe(1760000000000);
  });
});
