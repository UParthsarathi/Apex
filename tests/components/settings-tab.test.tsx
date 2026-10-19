import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { FOOD_PROMPT } from '@/lib/food-prompt';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/backend/auth', () => ({ signOut: vi.fn(), updateDisplayName: vi.fn() }));

function setup() {
  const user = userEvent.setup(); // installs a clipboard jsdom lacks
  render(<SettingsTab entries={[]} user={null} />);
  return user;
}

describe('Settings: log meals with your AI', () => {
  it('one tap copies the whole prompt, JSON example included', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Copy Prompt' }));
    expect(await navigator.clipboard.readText()).toBe(FOOD_PROMPT);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('Appearance starts on Dark and switches the whole app to Light and back', async () => {
    localStorage.clear();
    const user = setup();
    expect(screen.getByRole('radio', { name: 'dark' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: 'light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('radio', { name: 'light' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: 'dark' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('Show prompt reveals the full text; the separate JSON template is gone', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Show prompt' }));
    expect(screen.getByText(/"rawInput": "Morning I ate 4 idlis/)).toBeInTheDocument();
    expect(screen.queryByText(/json protocol format/i)).not.toBeInTheDocument();
  });
});
