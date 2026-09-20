# Apex Protocol

A nutrition and habit tracker built around one number: your calorie deficit.

**Log a meal by describing it to any LLM you already use — no API key required.**

> **Live demo:** _<!-- ← replace this line with your Vercel URL -->_

<!--
SCREENSHOTS — add these and uncomment the block below. Three is enough:
  docs/daily.png       the Daily dashboard with real data, micros drawer open
  docs/json.png        the Log textarea showing the "JSON DETECTED" badge
  docs/streak.png      the consistency calendar with a streak running

| Daily dashboard | Paste workflow | Consistency |
|---|---|---|
| ![](docs/daily.png) | ![](docs/json.png) | ![](docs/streak.png) |
-->

---

## The problem

Weight loss is a calorie deficit. Almost nobody fails because they don't know that — they
fail because logging is slow enough to skip, and once you skip a meal the day's number is
wrong, so you stop looking at it.

So this is built around three things:

1. **Logging is fast** — two taps and a sentence, or one paste
2. **The number that matters is on the first screen** — net intake, nothing else competing
3. **Consistency is visible** — a protein streak, deliberately forgiving

---

## Logging by LLM, without an API key

Most apps bolt on an AI and pay per user. This one **publishes the contract instead.**

1. **Settings → JSON Protocol Format → Copy**
2. Paste it into ChatGPT, Claude, Gemini — whatever you already have open
3. Tell it what you ate
4. Paste the JSON back into the app

The textarea detects JSON, parses it, and logs the meal with all twelve nutrients.
Paste an **array** and it logs a whole day at once.

No API key. No rate limit. No per-user cost. And your food data never touches my server.

<details>
<summary><b>The schema</b> (also available in-app with a Copy button)</summary>

```json
{
  "rawInput": "Meal description here",
  "mealType": "Breakfast | Lunch | Snacks | Dinner",
  "items": [
    {
      "name": "Component Name",
      "quantity": { "value": 1, "unit": "serving" },
      "macros": {
        "calories": 100, "protein": 10, "carbs": 10, "fat": 2, "fiber": 1,
        "sugar": 5, "sodium": 200, "saturatedFat": 1, "cholesterol": 10,
        "potassium": 150, "calcium": 50, "iron": 1
      }
    }
  ],
  "totals": {
    "calories": 100, "protein": 10, "carbs": 10, "fat": 2, "fiber": 1,
    "sugar": 5, "sodium": 200, "saturatedFat": 1, "cholesterol": 10,
    "potassium": 150, "calcium": 50, "iron": 1
  }
}
```

The parser is tolerant on purpose, because LLM output isn't deterministic:

- If `totals` is missing, it sums `items` instead
- If the object has none of `rawInput` / `items` / `totals`, it's rejected rather than half-logged
- `mealType` is matched fuzzily, so `Breakfast`, `breakfast` and `Morning / Breakfast` all work
- If the JSON won't parse at all, the text is logged as a plain description — you never lose the entry

</details>

There's also a built-in AI chat that does the same thing without leaving the app. It runs on my
key and a free tier capped at 5 requests/minute — which is exactly the constraint that made the
paste workflow the primary path.

---

## Features

- **Daily dashboard** — net intake (eaten − burned), protein and fiber against targets, water,
  sleep with a quality rating, goal completion, and a micros drawer with six more nutrients
- **Four entry modules** — nutrition, hydration, activity, sleep
- **Three ways to log food** — type it, paste LLM JSON, or use the in-app chat
- **Consistency calendar** — a protein streak that skips today rather than punishing you at 9am
- **7-day chart** — intake vs calories burned
- **Guest accounts** — start without signing up, attach an email later, keep all your history
- **Data export** — download your entire log as JSON
- **Installable PWA** — standalone app on mobile

---

## Tech stack

| Choice | Why |
|---|---|
| **React 19** | UI as a function of state. One saved meal changes five numbers at once — I'd rather describe the result than update each one. |
| **Next.js 15** (App Router) | File-based routing, plus a server runtime in the same project. The AI endpoint has to hold an API key; without it I'd run a separate backend for one route. |
| **TypeScript** | Five entry types share one table. A discriminated union on `type` makes `entry.meal` only valid when `entry.type === 'food'`. |
| **Supabase** | Auth, Postgres and row-level security in one product I don't have to operate. |
| **Postgres + jsonb** | Shared fields are columns, type-specific fields ride in `jsonb`. One table, one query, five entry types. |
| **Tailwind v4** | Styling stays in the component. No dead CSS when a component is deleted. |
| **Motion** | Layout animations — the sliding nav indicator is `layoutId`, two lines instead of measuring positions. |
| **Recharts** | Declarative charts. Heavy, which is why it's lazy-loaded. |
| **date-fns** | Every screen is date-scoped. `isSameDay` and `eachDayOfInterval` do work that's easy to get subtly wrong. |
| **Vercel** | Git push deploys, zero build config. |

---

## Architecture

State flows one way. **No tab imports the database** — there's exactly one place data can change,
which is why the dashboard can't disagree with the history screen.

```
page.tsx ──owns──▶ activeTab, selectedDate
    │
    ├──calls──▶ useDailyLog()  ──▶ Supabase
    │
    └──props──▶ tabs ──▶ forms
```

Logging a meal, end to end:

```
type meal → onAdd prop → addFood → insert
                           ├─▶ setEntries   (screen, immediately)
                           └─▶ supabase     (disk, after)
                                    ↓
                    HomeTab: filter → reduce → number changes
```

That's an **optimistic update** — the entry enters React state before the network request is
sent, which is why logging feels instant. The dashboard totals are **derived**, never stored, so
they can't go stale when an entry is deleted.

### What each folder is responsible for

| Path | Responsibility |
|---|---|
| `app/` | Routing. Two pages (`/`, `/login`) and one API route (`/api/chat`). |
| `app/layout.tsx` | HTML shell, font, global CSS, PWA manifest. Server component. |
| `app/providers.tsx` | The `'use client'` boundary — exists so `AuthProvider` can use state inside a server-rendered layout. |
| `app/page.tsx` | App shell. Owns tab + date state, three auth gates, renders the active tab. No business logic. |
| `app/api/chat/route.ts` | Server-side AI proxy. Exists so the API key never reaches the browser. |
| `hooks/use-daily-log.ts` | **The entire data layer** — types, the fetch, and every mutation. Called once, at the top. |
| `backend/` | Supabase client (memoised) and the auth wrappers. |
| `components/tabs/` | One file per screen. They receive data and functions as props and render. |
| `components/QuickAdds.tsx` | Five input forms plus `parseFoodJson`, shared by the paste flow and the AI chat. |
| `components/AuthProvider.tsx` | Session lifecycle and the `useAuth()` context. |
| `components/modals/` | The 7-day chart and the consistency calendar. |
| `lib/utils.ts` | `cn()` — merges Tailwind classes. Six lines. |
| `supabase/migrations/` | One table, one RLS policy. |

---

## Data model

One table for all five entry types. Shared fields are real columns and get indexed;
everything type-specific rides in `jsonb`.

```sql
create table entries (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in ('food','workout','task','sleep','water')),
  timestamp  bigint not null,     -- epoch ms
  data       jsonb  not null,     -- meal, calories, quality, amount…
  created_at timestamptz not null default now()
);

create policy "own rows" on entries
  for all
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

That policy is the entire security boundary, and it's enforced by Postgres rather than by
client code — so a bug in the frontend still can't read someone else's rows. The anon key is
public by design; RLS is what protects the data.

---

## Running locally

Requires Node 18+ and a Supabase project.

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL + anon key
npm run dev                    # http://localhost:3000
```

Then run `supabase/migrations/0001_init.sql` and `0002_rls_initplan.sql` in the Supabase
SQL editor.

| Variable | Scope |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public — ships to the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — RLS is the real boundary |
| `GEMINI_API_KEY` | **Server only.** No `NEXT_PUBLIC_` prefix, or it leaks into the client bundle. Optional — only the in-app chat needs it. |

---

## Known limitations

Things I'd fix before anyone else relied on this:

- **Optimistic updates have no rollback.** If a write fails, the entry stays on screen and looks
  saved until a refresh. For a food tracker that's the worst class of bug — silent data loss.
  First thing on the list.
- **The initial fetch is unbounded** — it loads every entry a user has ever made to render one
  day. Fine at three months, wrong at three years. Needs a date range on the query.
- **No password reset.** Guest accounts can also strand data if they're never upgraded to email.
- **No error boundaries** — a malformed entry could take down an entire tab instead of one card.
- **Accessibility needs work** — some labels are 8px and several greys fall below WCAG contrast.
- **No test suite.** The one check that exists is a dev-only `console.assert` on the row↔entry
  mapping in `hooks/use-daily-log.ts`, because that's the single place data can be silently
  corrupted.
- **The in-app AI chat is rate-limited** to 5 requests/minute on the free tier, and returns 503s
  when the upstream model is under load. The paste workflow exists partly because of this.
