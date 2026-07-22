-- Fix auth_rls_initplan lint: (select auth.uid()) is evaluated once per query,
-- bare auth.uid() once per row. Also collapses the 4 dashboard-created policies
-- back to the single "own rows" policy 0001 intended.

drop policy if exists "Users can read own entries"   on entries;
drop policy if exists "Users can insert own entries" on entries;
drop policy if exists "Users can update own entries" on entries;
drop policy if exists "Users can delete own entries" on entries;
drop policy if exists "own rows" on entries;

create policy "own rows" on entries
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
