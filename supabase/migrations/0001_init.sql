-- Apex Protocol data backend. Run once (Supabase SQL editor or MCP).
-- One table, jsonb payload. RLS scopes every row to its owner.

create table if not exists entries (
  id         uuid primary key default gen_random_uuid(),  -- client sends its own uuidv4; default is a safety net
  user_id    uuid not null default auth.uid()
               references auth.users(id) on delete cascade,
  type       text not null
               check (type in ('food','workout','task','sleep','water')),
  timestamp  bigint not null,                              -- event time, epoch ms (the app already uses this)
  data       jsonb  not null,                              -- type-specific fields (meal, calories, quality, amount…)
  created_at timestamptz not null default now()
);

alter table entries enable row level security;

-- The entire security boundary: a user can only touch their own rows.
create policy "own rows" on entries
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Covers the one query the app makes: all of a user's rows, newest first.
create index if not exists entries_user_ts_idx on entries (user_id, timestamp desc);
