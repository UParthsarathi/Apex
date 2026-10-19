import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/login/page';

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const auth = vi.hoisted(() => ({ current: { user: null as null | { id: string }, loading: false } }));
const backend = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn(), signInAnonymously: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/components/AuthProvider', () => ({ useAuth: () => auth.current }));
vi.mock('@/backend/auth', () => backend);

beforeEach(() => {
  vi.clearAllMocks();
  auth.current = { user: null, loading: false };
});

describe('LoginPage (F-16)', () => {
  it('a double tap on Continue as Guest creates one guest, not two', async () => {
    let finish = () => {};
    backend.signInAnonymously.mockReturnValue(new Promise(resolve => { finish = () => resolve({ error: null }); }));
    render(<LoginPage />);
    const guest = screen.getByRole('button', { name: /continue as guest/i });

    await userEvent.dblClick(guest);
    expect(backend.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(guest).toBeDisabled();

    await act(async () => finish());
    expect(router.push).toHaveBeenCalledWith('/');
    expect(guest).toBeEnabled();
  });

  it('sends an already signed-in user to the app instead of offering a new guest account', () => {
    auth.current = { user: { id: 'u1' }, loading: false };
    render(<LoginPage />);
    expect(router.replace).toHaveBeenCalledWith('/');
  });

  it('still shows sign-in errors', async () => {
    backend.signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText('Email'), 'a@b.co');
    await userEvent.type(screen.getByPlaceholderText('App Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in with email/i }));
    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
  });
});
