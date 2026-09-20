# Apex Protocol

Calorie tracker I built for myself. The thing it does differently: you log meals using
whatever LLM you already pay for, instead of me paying for one.

Live: _<!-- put your Vercel URL here -->_

<!--
Screenshots: add these three, then uncomment.
  docs/daily.png    Daily screen with real data, micros open
  docs/json.png     the Log box showing "JSON DETECTED"
  docs/streak.png   consistency calendar with a streak going

| | | |
|---|---|---|
| ![](docs/daily.png) | ![](docs/json.png) | ![](docs/streak.png) |
-->

## Why I built it

I've tried tracking calories three times and quit three times. Never because an app was
missing a feature. It was always that logging a meal took too long, so I'd skip one, and
once the day's number was wrong I stopped checking it at all.

So three things had to be true. Logging fast. The deficit number is the first thing I see,
not buried under a menu. And something that shows me a streak, so one bad day doesn't feel
like the whole thing is over.

## Logging with your own LLM

Settings → JSON Protocol Format → Copy. Paste that into ChatGPT or Claude or whatever you
have open, say what you ate, paste the answer back into the app. It notices it's JSON and
logs the meal with all twelve nutrients.

Paste an array and it'll do a whole day in one go.

I did it this way because the alternative is me paying per user and rate limiting everyone.
This costs me nothing, there's no quota, and your food log never goes through my server.

There's also a built-in chat that does the same thing on my API key. It's on a free tier
capped at 5 requests a minute and it 503s when the model is busy, which is why the paste
flow is the main path and not the fallback.

<details>
<summary>The JSON format (there's a copy button for this in the app)</summary>

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
</details>

The parser is loose on purpose, because no two models return the same thing twice. If
`totals` is missing it adds up the items instead. If `mealType` comes back as
"Morning / Breakfast" it still matches. If the JSON is broken it just logs whatever you
pasted as plain text so you don't lose the entry.

## What's in it

- Daily screen: net intake (eaten minus burned), protein, fiber, water, sleep, goals. Six
  more nutrients behind a toggle.
- Log tab for food, water, workouts and sleep
- Three ways to add food: type it, paste JSON, or the chat
- Protein streak calendar. It skips today, because at 9am you obviously haven't hit your
  target yet and breaking the streak for that is annoying.
- 7 day chart, intake vs burned
- Guest login you can upgrade to a real account later without losing your history
- Export everything as JSON
- Installs as a PWA

## Stack

Next.js 15 (App Router) + React 19, TypeScript, Tailwind v4, Supabase for auth and Postgres,
Recharts, Motion, deployed on Vercel.

The choices I'd actually defend: Supabase because I didn't want to run a database. One table
with a `jsonb` column because five entry types in five tables means five queries and five
sets of CRUD. TypeScript because the union on `type` caught real bugs when I added sleep.

One I'm less sure about. I'm using Next as basically a single page app with one API route.
Vite would have been lighter. I picked Next partly because it's what you're expected to know.

## How it's wired

```
page.tsx ──owns──> activeTab, selectedDate
    │
    ├──calls──> useDailyLog()  ──> Supabase
    │
    └──props──> tabs ──> forms
```

State goes one direction and no tab talks to Supabase. Everything goes through
`useDailyLog`, which is the only file that knows the database exists. That's why the
dashboard can't end up disagreeing with the history screen.

Saving a meal:

```
type meal -> onAdd prop -> addFood -> insert
                             |-> setEntries   (screen, right away)
                             +-> supabase     (disk, after)
                                      |
                     HomeTab: filter -> reduce -> number changes
```

The entry goes into React state before the network request is sent, so there's no spinner.
And the dashboard totals aren't stored anywhere, they get recalculated from `entries` on
every render, so there's nothing to update when you delete something.

| Path | What it does |
|---|---|
| `app/` | Routing. Two pages and one API route. |
| `app/providers.tsx` | The `'use client'` boundary. Only exists because `layout.tsx` runs on the server and `AuthProvider` needs state. |
| `app/page.tsx` | Shell. Holds the tab and date, three auth gates, renders the active tab. |
| `app/api/chat/route.ts` | AI proxy. Exists so the API key stays off the client. |
| `hooks/use-daily-log.ts` | The data layer. Types, the fetch, every mutation. Called once. |
| `backend/` | Supabase client and auth wrappers. |
| `components/tabs/` | One file per screen. They get data and functions as props. |
| `components/QuickAdds.tsx` | The five input forms, plus `parseFoodJson` which the paste flow and the chat both use. |
| `components/modals/` | 7 day chart and the streak calendar. |
| `supabase/migrations/` | One table, one RLS policy. |

## Data

Everything is one table. The fields every entry type shares are real columns, the rest goes
in `jsonb`.

```sql
create table entries (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in ('food','workout','task','sleep','water')),
  timestamp  bigint not null,     -- epoch ms
  data       jsonb  not null,
  created_at timestamptz not null default now()
);

create policy "own rows" on entries
  for all
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

That policy is the whole security model. It runs in Postgres, not in my code, so a bug in
the frontend still can't read someone else's rows. The anon key being public is fine for
the same reason.

## Running it

Needs Node 18+ and a Supabase project.

```bash
npm install
cp .env.example .env.local    # add your Supabase URL and anon key
npm run dev
```

Then run the two files in `supabase/migrations/` in the Supabase SQL editor.

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public, they ship to the
browser and that's intended. `GEMINI_API_KEY` has no prefix on purpose so it stays server
side, and it's optional unless you want the in-app chat.

## Stuff that's broken or missing

Writing these down because I'd rather say it than have you find it.

- If a save fails the entry stays on screen and looks fine until you refresh. It needs to
  roll back and tell you. This is the one that actually bothers me.
- It loads your entire history to render a single day. Fine now, not fine in a year.
- No password reset. And a guest account that never gets an email attached is unrecoverable.
- No error boundaries, so one malformed entry could take out a whole tab.
- Some of the text is 8px and a few of the greys are too dim. Looks good on my phone and
  probably nowhere else.
- No tests. There's one `console.assert` on the row/entry mapping in `use-daily-log.ts`
  because that's the spot where data would get silently mangled and I'd never notice.
