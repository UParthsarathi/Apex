import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryTab } from '@/components/tabs/HistoryTab';
import type { LogEntry } from '@/lib/entries';

describe('HistoryTab dates west of UTC (F-09)', () => {
  const original = process.env.TZ;
  beforeEach(() => { process.env.TZ = 'America/New_York'; });
  afterEach(() => { process.env.TZ = original; });

  it("labels today's entries 'Today', names the month right, and opens the right day", async () => {
    const now = Date.now();
    const entries: LogEntry[] = [{ id: '1', type: 'water', timestamp: now, amount: 250 }];
    const onDateJump = vi.fn();
    render(<HistoryTab entries={entries} deleteEntry={vi.fn()} onDateJump={onDateJump} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: format(now, 'MMMM yyyy') })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /view day/i }));
    expect(format(onDateJump.mock.calls[0][0], 'yyyy-MM-dd')).toBe(format(now, 'yyyy-MM-dd'));
  });
});
