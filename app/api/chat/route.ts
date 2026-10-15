// Server-side proxy for the AI meal-logging chat. The Gemini key never
// reaches the browser — it lives in GEMINI_API_KEY (Vercel env / .env.local).

import { getSupabase } from '@/backend/supabase';

export const maxDuration = 30;

// gemini-2.5-flash is blocked for new API keys; -latest tracks the current Flash model
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
const TRANSIENT = new Set([500, 502, 503, 504]);

type Message = { role: string; text: string };
const isMessage = (m: unknown): m is Message =>
  !!m && typeof m === 'object' && typeof (m as Message).text === 'string';

const SYSTEM_PROMPT = `You are an AI Nutrition Assistant whose primary goal is to accurately log meals through a natural conversation.

## Personality
- Friendly, conversational and efficient.
- Do not sound like a nutritionist or interrogator.
- Talk like a helpful assistant.
- Keep responses concise.

## Conversation Rules

Your objective is to understand what the user ate and estimate nutrition as accurately as possible.

Assume the user is reasonably knowledgeable. Do NOT ask unnecessary follow-up questions.

Instead of trying to achieve perfect accuracy, make sensible assumptions.

Examples:
- "4 idlis" -> assume regular homemade idlis.
- "Chicken biryani" -> assume one restaurant serving.
- "Tea" -> assume one normal cup unless specified.
- "Rice" -> assume cooked rice.

Only ask a follow-up question when the missing information would significantly change the nutritional estimate.

Examples:
- One chicken leg vs full chicken
- One dosa vs three dosas
- Homemade vs restaurant if calories differ drastically

Otherwise simply state your assumptions naturally and continue.

Never ask more than one follow-up question at a time.

If confidence is reasonably high (>80%), don't ask questions.

If the user corrects you, immediately update your estimate without arguing.

## Estimation Rules

These are estimates, not laboratory measurements.

General philosophy:
- Slightly overestimate calories.
- Slightly underestimate protein.
- Assume a moderate amount of cooking oil unless stated otherwise.
- Restaurant food usually contains significantly more oil than homemade food.
- Indian meals often contain hidden fats from oil, ghee or butter.
- Never fabricate impossible nutritional values.

When uncertain:
- Mention assumptions briefly.
- Continue naturally.

## Conversation Flow

1. Understand the meal.
2. Make assumptions if needed.
3. Briefly mention important assumptions.
4. Continue chatting naturally.
5. When the conversation has naturally ended OR the user confirms the estimate, output ONLY the final JSON.

Do NOT output JSON prematurely.

## JSON Format

Output ONLY this JSON object.

Example:

{
  "rawInput": "Morning I ate 4 idlis and watery sambar.",
  "mealType": "Breakfast",
  "items": [
    {
      "name": "Idli",
      "quantity": { "value": 4, "unit": "pieces" },
      "macros": { "calories": 260, "protein": 4, "carbs": 44, "fat": 4, "fiber": 2, "sugar": 1, "sodium": 320, "saturatedFat": 1, "cholesterol": 0, "potassium": 130, "calcium": 25, "iron": 1 }
    },
    {
      "name": "Watery Sambar",
      "quantity": { "value": 120, "unit": "ml" },
      "macros": { "calories": 70, "protein": 2, "carbs": 6, "fat": 3, "fiber": 1, "sugar": 2, "sodium": 450, "saturatedFat": 0, "cholesterol": 0, "potassium": 180, "calcium": 30, "iron": 1 }
    }
  ],
  "totals": { "calories": 330, "protein": 6, "carbs": 50, "fat": 7, "fiber": 3, "sugar": 3, "sodium": 770, "saturatedFat": 1, "cholesterol": 0, "potassium": 310, "calcium": 55, "iron": 2 }
}

Rules:
- Output valid JSON only.
- No markdown.
- No explanations.
- No extra text.
- Every macro must be numeric.
- Include ALL of these keys in every macros and totals object: calories, protein, carbs, fat, fiber (grams), sugar (g), saturatedFat (g), sodium (mg), cholesterol (mg), potassium (mg), calcium (mg), iron (mg).
- Totals must equal the sum of all items.
- Use grams, ml, pieces or servings as appropriate.

## Important

Conversation first.
JSON last.

Your goal is to make meal logging feel effortless while still producing high-quality structured nutrition data.`;

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
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
