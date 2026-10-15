// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock('@/backend/supabase', () => ({ getSupabase: () => ({ auth }) }));

import { POST } from '@/app/api/chat/route';

const call = (body: unknown, token = 'good') =>
  POST(new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

const gemini = (status: number, text = 'ok') =>
  new Response(status === 200 ? JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) : 'upstream error', { status });

const hi = { messages: [{ role: 'user', text: '4 idlis' }] };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  auth.getUser.mockImplementation(async (token: string) =>
    token === 'good' ? { data: { user: { id: 'u1' } }, error: null } : { data: { user: null }, error: { message: 'invalid JWT' } });
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('/api/chat', () => {
  it('rejects a missing or forged session with 401, before calling Gemini', async () => {
    expect((await call(hi, '')).status).toBe(401);
    expect((await call(hi, 'forged')).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-14: rejects malformed bodies with 400 instead of crashing with 500', async () => {
    for (const body of [{ messages: [null] }, { messages: [{ role: 'user' }] }, { messages: [] }, 'not json']) {
      expect((await call(body)).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the model text', async () => {
    fetchMock.mockResolvedValueOnce(gemini(200, 'hello'));
    const res = await call(hi);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ text: 'hello' });
  });

  it('F-10: retries a transient 503 and succeeds', async () => {
    fetchMock.mockResolvedValueOnce(gemini(503)).mockResolvedValueOnce(gemini(200, 'second try'));
    const res = await call(hi);
    expect(await res.json()).toEqual({ text: 'second try' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('F-10: gives up after three transient failures with a clear 502', async () => {
    fetchMock.mockImplementation(async () => gemini(503));
    const res = await call(hi);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/AI request failed \(503\)/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('F-10: does not retry the 5-per-minute limit, and says so', async () => {
    fetchMock.mockResolvedValueOnce(gemini(429));
    const res = await call(hi);
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/try again in a minute/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a network failure like a transient error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed')).mockResolvedValueOnce(gemini(200, 'back'));
    expect(await (await call(hi)).json()).toEqual({ text: 'back' });
  });

  it('reports an empty model reply instead of returning blank text', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
    const res = await call(hi);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/empty reply/);
  });
});
