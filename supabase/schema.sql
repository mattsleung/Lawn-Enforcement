create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;
revoke all on public.game_saves from anon;
grant select, insert, update, delete on public.game_saves to authenticated;

drop policy if exists "Players read only their save" on public.game_saves;
create policy "Players read only their save" on public.game_saves
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Players create only their save" on public.game_saves;
create policy "Players create only their save" on public.game_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Players update only their save" on public.game_saves;
create policy "Players update only their save" on public.game_saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players delete only their save" on public.game_saves;
create policy "Players delete only their save" on public.game_saves
  for delete to authenticated using ((select auth.uid()) = user_id);
