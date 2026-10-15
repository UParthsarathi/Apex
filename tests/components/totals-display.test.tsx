import { render, screen } from '@testing-library/react';
import { setHours, startOfToday, subDays } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import { ConsistencyModal } from '@/components/modals/ConsistencyModal';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import { HomeTab } from '@/components/tabs/HomeTab';
import type { LogEntry } from '@/lib/entries';

let n = 0;
const food = (daysAgo: number, fields: Record<string, unknown>) =>
  ({ id: String(n++), type: 'food', timestamp: setHours(subDays(startOfToday(), daysAgo), 12).getTime(), meal: 'Lunch', description: 'x', ...fields } as LogEntry);

describe('totals on screen', () => {
  it('F-21: Home shows decimal sums rounded, without float noise', () => {
    const entries = [food(0, { protein: 4.5 }), food(0, { protein: 2.2 }), food(0, { protein: 1.1 })];
    const { container } = render(<HomeTab entries={entries} selectedDate={startOfToday()} onDateChange={vi.fn()} addTask={vi.fn()} />);
    expect(container.textContent).toContain('7.8g');
    expect(container.textContent).not.toContain('7.800000000000001');
  });

  it('F-08: History adds a calorie value stored as text instead of gluing it on', () => {
    const entries = [food(0, { calories: '260' }), food(0, { calories: 330 })];
    const { container } = render(<HistoryTab entries={entries} deleteEntry={vi.fn()} onDateJump={vi.fn()} />);
    expect(container.textContent).toContain('590 CALS');
    expect(container.textContent).not.toContain('0260330');
  });

  it('F-22: the consistency streak counts past 30 days', () => {
    render(<ConsistencyModal isOpen onClose={vi.fn()} entries={Array.from({ length: 45 }, (_, i) => food(i, { protein: 60 }))} />);
    expect(screen.getByText('45')).toBeInTheDocument();
  });
});
