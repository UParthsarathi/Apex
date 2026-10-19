import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoodChat } from '@/components/FoodChat';

vi.mock('@/components/AuthProvider', () => ({ useAuth: () => ({ session: { access_token: 'token' } }) }));

const reply = (status: number, body: string) => vi.fn(async () => new Response(body, { status }));
afterEach(() => vi.unstubAllGlobals());

async function ask(fetchMock: ReturnType<typeof reply>, onAdd = vi.fn()) {
  vi.stubGlobal('fetch', fetchMock);
  render(<FoodChat onAdd={onAdd} />);
  await userEvent.type(screen.getByRole('textbox'), '4 idlis{Enter}');
  return onAdd;
}

describe('FoodChat', () => {
  it("F-10: shows the server's explanation when the AI is rate-limited", async () => {
    await ask(reply(429, JSON.stringify({ error: 'The AI is at its free-tier limit (5 requests a minute). Try again in a minute.' })));
    expect(await screen.findByText(/free-tier limit/)).toBeInTheDocument();
  });

  it('F-10: a non-JSON error page is reported with its status, not as a network error', async () => {
    await ask(reply(504, '<html>gateway timeout</html>'));
    expect(await screen.findByText('Something went wrong (504). Try again.')).toBeInTheDocument();
  });

  it('turns the final JSON reply into a Log It card that logs the meal', async () => {
    const meal = { rawInput: '4 idlis', mealType: 'Breakfast', totals: { calories: 260, protein: 8 } };
    const onAdd = await ask(reply(200, JSON.stringify({ text: JSON.stringify(meal) })));
    await userEvent.click(await screen.findByRole('button', { name: /log it/i }));
    expect(onAdd).toHaveBeenCalledWith('Breakfast', '4 idlis', expect.objectContaining({ calories: 260, protein: 8 }));
  });

  it('the Log It card shows a fenced reply with rounded totals', async () => {
    const meal = { rawInput: 'rice', items: [{ name: 'Rice', macros: { calories: 100.1, protein: 0.2 } }, { name: 'Dal', macros: { calories: 200.2, protein: 0.1 } }] };
    await ask(reply(200, JSON.stringify({ text: '```json\n' + JSON.stringify(meal) + '\n```' })));
    await screen.findByRole('button', { name: /log it/i });
    expect(screen.getByText('300.3')).toBeInTheDocument();
    expect(screen.getByText('0.3')).toBeInTheDocument();
  });
});
