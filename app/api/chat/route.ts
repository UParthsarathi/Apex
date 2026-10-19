// Server-side proxy for the AI meal-logging chat. The Gemini key never
// reaches the browser — it lives in GEMINI_API_KEY (Vercel env / .env.local).

import { getSupabase } from '@/backend/supabase';
import { FOOD_PROMPT } from '@/lib/food-prompt';

export const maxDuration = 30;

// gemini-2.5-flash is blocked for new API keys; -latest tracks the current Flash model
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const TRANSIENT = new Set([500, 502, 503, 504]);

type Message = { role: string; text: string };
const isMessage = (m: unknown): m is Message =>
  !!m && typeof m === 'object' && typeof (m as Message).text === 'string';

export async function POST(req: Request) {
  // Without this, anyone who finds the URL can POST and burn the Gemini quota.
  // getUser(jwt) is stateless — it validates the token against Supabase's auth server.
  // ponytail: auth only, no rate limit. A user can still loop anon signups; add a
  // per-uid counter (Upstash/Vercel KV) if the quota actually gets drained.
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '');
  const supabase = getSupabase();
  if (!token || !supabase) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let messages: unknown;
  try {
    ({ messages } = await req.json());
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isMessage)) {
    return Response.json({ error: 'messages must be a non-empty array of { role, text }' }, { status: 400 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: FOOD_PROMPT }] },
    contents: messages.slice(-20).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text.slice(0, 4000) }],
    })),
  });

  // Gemini's free tier sheds load with 5xx in bursts; two quick retries ride most of them out.
  // 429 (the 5 requests/minute cap) is not retried: it only clears after about a minute.
  // ponytail: in-process retry within one request; add a queue only if traffic outgrows the free tier.
  const deadline = Date.now() + 25_000; // maxDuration is 30 s; keep time to answer
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3 && Date.now() < deadline; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 500 * attempt));
    try {
      res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body,
        signal: AbortSignal.timeout(Math.max(deadline - Date.now(), 1)),
      });
    } catch (e) {
      console.error('gemini request failed', e);
      res = null;
    }
    if (res && !TRANSIENT.has(res.status)) break;
  }

  if (!res) return Response.json({ error: 'Could not reach the AI service. Try again.' }, { status: 502 });
  if (res.status === 429) {
    return Response.json({ error: 'The AI is at its free-tier limit (5 requests a minute). Try again in a minute.' }, { status: 429 });
  }
  if (!res.ok) {
    console.error('gemini error', res.status, await res.text());
    return Response.json({ error: `AI request failed (${res.status}). Try again.` }, { status: 502 });
  }

  const data = await res.json();
  const text: string =
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!text.trim()) return Response.json({ error: 'The AI sent an empty reply. Try rephrasing.' }, { status: 502 });
  return Response.json({ text });
}
