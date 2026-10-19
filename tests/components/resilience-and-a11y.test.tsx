import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from '@/app/error';
import { FoodChat } from '@/components/FoodChat';
import { LogEntryCard } from '@/components/LogEntryCard';
import { ConsistencyModal } from '@/components/modals/ConsistencyModal';
import { PerformanceModal } from '@/components/modals/PerformanceModal';
import { SleepQuickAdd, TaskQuickAdd, WorkoutQuickAdd } from '@/components/QuickAdds';
import { TasksTab } from '@/components/tabs/TasksTab';
import type { LogEntry } from '@/lib/entries';

vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ session: null }) }));
vi.spyOn(console, 'error').mockImplementation(() => {});
// recharts measures its container; jsdom has no layout engine
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

describe('error screen (F-17)', () => {
  it('replaces a crashed screen with a way back', async () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your saved entries are safe');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalled();
  });
});

describe('every button has an accessible name (F-24)', () => {
  const task: LogEntry = { id: 't', type: 'task', timestamp: Date.now(), description: 'Walk', completed: false };
  const screens: [string, React.ReactElement][] = [
    ['TasksTab', <TasksTab key="t" entries={[task]} selectedDate={new Date()} onDateChange={vi.fn()} addTask={vi.fn()} toggleTask={vi.fn()} deleteEntry={vi.fn()} />],
    ['LogEntryCard', <LogEntryCard key="c" entry={task} onDelete={vi.fn()} />],
    ['FoodChat', <FoodChat key="f" onAdd={vi.fn()} />],
    ['quick adds', <div key="q"><WorkoutQuickAdd onAdd={vi.fn()} /><TaskQuickAdd onAdd={vi.fn()} /><SleepQuickAdd onAdd={vi.fn()} /></div>],
    ['ConsistencyModal', <ConsistencyModal key="m" isOpen onClose={vi.fn()} entries={[]} />],
    ['PerformanceModal', <PerformanceModal key="p" isOpen onClose={vi.fn()} entries={[]} selectedDate={new Date()} />],
  ];

  it.each(screens)('%s', (_name, element) => {
    render(element);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toHaveAccessibleName();
  });
});
