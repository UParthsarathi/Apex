# Apex Protocol

A nutrition and habit tracker. It logs food, water, workouts, sleep and daily goals, and
shows the day's net calories (eaten minus burned) along with macro and micronutrient totals.

Next.js 15 (App Router) with React 19 and TypeScript on the front, Supabase for auth and
Postgres, deployed on Vercel.

Live: _<!-- put your Vercel URL here -->_

<!--
Screenshots: add these three, then uncomment.
  docs/daily.png    Daily screen with data
  docs/json.png     the Log box showing "JSON DETECTED"
  docs/streak.png   consistency calendar

| | | |
|---|---|---|
| ![](docs/daily.png) | ![](docs/json.png) | ![](docs/streak.png) |
-->

## Running it locally

Needs Node 18+ and a Supabase project.

```bash
npm install
cp .env.example .env.local    # add your Supabase URL and anon key
npm run dev                   # http://localhost:3000
```

Run the two files in `supabase/migrations/` in the Supabase SQL editor before first use.

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public. Ships to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public by design. Row level security is what restricts access, not the key. |
| `GEMINI_API_KEY` | Server only, no `NEXT_PUBLIC_` prefix. Optional, only the in-app chat uses it. |

Scripts: `npm run dev`, `build`, `start`, `lint`.

## Project structure

```
app/          routes and the one API endpoint
components/   UI
hooks/        data layer
backend/      Supabase client and auth calls
lib/          utils
supabase/     schema and RLS policy
```

| Path | Responsibility |
|---|---|
| `app/layout.tsx` | HTML shell, font, global CSS, PWA manifest. Server component, no state. |
| `app/providers.tsx` | The `'use client'` boundary. `layout.tsx` runs on the server and `AuthProvider` needs state, so the wrapping happens here. |
| `app/page.tsx` | App shell. Holds `activeTab` and `selectedDate`, gates on auth state, renders the active tab. No data logic. |
| `app/login/page.tsx` | Sign in, sign up, anonymous sign in. |
| `app/api/chat/route.ts` | Server-side proxy to Gemini for the in-app chat. Validates the caller's Supabase JWT before forwarding. |
| `hooks/use-daily-log.ts` | All entry types, the initial fetch, and every mutation (`addFood`, `addWater`, `addWorkout`, `addTask`, `addSleep`, `toggleTask`, `deleteEntry`). Called once, in `page.tsx`. |
| `backend/supabase.ts` | Creates and memoises the Supabase client. |
| `backend/auth.ts` | `signIn`, `signUp`, `signInAnonymously`, `linkEmail`, `updateDisplayName`, `signOut`. |
| `components/AuthProvider.tsx` | Holds the session, subscribes to auth changes, exposes `useAuth()`. |
| `components/tabs/` | One component per screen: Home, Protocol (logging), Tasks, History, Settings. They receive data and callbacks as props. |
| `components/QuickAdds.tsx` | Five input forms, plus `parseFoodJson` which both the paste flow and the chat use. |
| `components/FoodChat.tsx` | In-app LLM chat. Posts to `/api/chat`, parses JSON out of the reply. |
| `components/LogEntryCard.tsx` | Renders any of the five entry types in the history list. |
| `components/DateNavigator.tsx` | Seven day date strip. Takes a date, emits a date. |
| `components/modals/` | `PerformanceModal` (7 day chart, lazy loaded), `ConsistencyModal` (streak calendar). |
| `lib/utils.ts` | `cn()`, merges Tailwind classes. |
| `supabase/migrations/` | `0001_init.sql` creates the table and policy, `0002` fixes a policy performance lint. |

## How state flows

There is one data layer and it is `hooks/use-daily-log.ts`. Nothing else imports Supabase for
entry data. `page.tsx` calls `useDailyLog()` once and passes `entries` plus the mutation
functions down to whichever tab is active.

```
page.tsx ──owns──> activeTab, selectedDate
    │
    ├──calls──> useDailyLog()  ──> Supabase
    │
    └──props──> tabs ──> forms
```

Saving an entry:

```
form -> onAdd prop -> addFood -> insert
                        |-> setEntries   (local state, immediately)
                        +-> supabase     (network, after)
```

`insert` updates local state before the network call, so the UI does not wait. Note the
consequence: a failed write is currently not rolled back. See Known issues.

Totals are not stored. `HomeTab` filters `entries` down to the selected day and reduces over
`NUTRIENT_KEYS` on each render, so there is nothing to invalidate when an entry is deleted.

`NUTRIENT_KEYS` in `hooks/use-daily-log.ts` is the single list of tracked nutrients. The JSON
parser, the manual entry form and the dashboard all iterate it, so adding a nutrient means
adding one string to that array.

## Logging food

Three paths, all ending in the same `addFood` call.

**Manual.** Type a description, optionally fill the macro fields. The macro inputs are held as
strings rather than numbers so an empty field stays empty instead of becoming 0.

**Pasted JSON.** Settings has a copy button for the format below. The intended use is to paste
it into an LLM along with what you ate, then paste the reply into the food input. The textarea
checks whether the current value starts and ends with braces or brackets and shows a "JSON
DETECTED" badge, then parses on save. An array logs multiple entries at once.

**In-app chat.** Same thing without leaving the app, going through `/api/chat`. It uses the
project's Gemini key and a free tier limited to 5 requests per minute.

The format:

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
  "totals": { "calories": 100, "protein": 10, "...": "same keys as macros" }
}
```

`parseFoodJson` is deliberately tolerant, since model output varies:

- Returns `null` if the object has none of `rawInput`, `items` or `totals`, rather than
  logging a partial entry
- Falls back to summing `items` when `totals` is missing. Uses `??` rather than `||` so a
  genuine `0` is not treated as absent
- Matches `mealType` by substring, so casing and prefixes do not break it
- If `JSON.parse` throws, the input is logged as a plain text description instead

## Data model

One table for all five entry types. Fields common to every type are columns; the rest goes in
`jsonb`. `rowFor` and `entryFor` in `use-daily-log.ts` convert between the flat object the app
uses and this shape.

```sql
create table entries (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type       text not null check (type in ('food','workout','task','sleep','water')),
  timestamp  bigint not null,     -- epoch ms
  data       jsonb  not null,
  created_at timestamptz not null default now()
);

create index entries_user_ts_idx on entries (user_id, timestamp desc);

create policy "own rows" on entries
  for all
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
```

Access control is entirely this policy. It runs in Postgres, so client code cannot bypass it.

`timestamp` is `bigint` and PostgREST serialises it as a string, so `entryFor` coerces it back
with `Number()`. Without that, date comparisons silently fail and every day reads as empty.
There is a dev-only `console.assert` covering that round trip.

## Auth

Supabase Auth. `AuthProvider` fetches the session on mount and subscribes to
`onAuthStateChange`; the subscription is cleaned up on unmount. `page.tsx` redirects to
`/login` when there is no user, and shows a name-entry screen until `display_name` is set.

Anonymous sign in is supported. `linkEmail` attaches an email and password to the existing
anonymous user via `updateUser`, so the uid and all existing rows are preserved.

The fetch effect in `use-daily-log.ts` uses a `cancelled` flag in its cleanup, so a response
that arrives after the user changed is discarded rather than overwriting the new user's data.

## Known issues

- Optimistic writes are not rolled back. If the Supabase insert fails, the entry stays on
  screen and only disappears on reload. Errors currently go to `console.error` only.
- The initial fetch has no date range or limit. It loads every entry the user has ever
  created in order to render one day.
- No password reset flow. An anonymous account that never calls `linkEmail` cannot be
  recovered.
- No error boundaries, so a render error in one card takes down the whole tab.
- Several labels are 8px and some grey text falls below WCAG contrast minimums.
- `/api/chat` has authentication but no rate limiting of its own.
- Dates use browser-local time throughout, so entries can appear to shift day across
  timezones.
- No test suite. The only automated check is the `console.assert` on the row/entry mapping.
- `package.json` still carries `@hookform/resolvers` and `class-variance-authority`, neither
  of which is imported anywhere.
