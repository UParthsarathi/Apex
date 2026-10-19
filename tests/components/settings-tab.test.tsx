import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { FOOD_PROMPT } from '@/lib/food-prompt';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/backend/auth', () => ({ signOut: vi.fn(), updateDisplayName: vi.fn() }));

async function copyFrom(section: RegExp) {
  const user = userEvent.setup(); // installs a clipboard jsdom lacks
  render(<SettingsTab entries={[]} user={null} />);
  await user.click(screen.getByRole('button', { name: section }));
  await user.click(screen.getByRole('button', { name: 'Copy' }));
  expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  return navigator.clipboard.readText();
}

describe('Settings copy sections', () => {
  it('AI Prompt copies the same prompt the in-app chat uses', async () => {
    expect(await copyFrom(/ai prompt/i)).toBe(FOOD_PROMPT);
    expect(screen.getByText(/ChatGPT Project/)).toBeInTheDocument();
  });

  it('JSON Protocol Format still copies the JSON template', async () => {
    const copied = await copyFrom(/json protocol format/i);
    expect(JSON.parse(copied)).toMatchObject({ rawInput: expect.any(String), items: expect.any(Array), totals: expect.any(Object) });
  });
});
