-- A signed-in user's own library: saved games and the games they opened with Play. Both are
-- private and bounded by the catalog (one row per user and game).
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- The primary keys serve per-user reads (a user has at most one row per game); these cover the
-- cascade when a game is deleted.
create index favorites_game_idx on public.favorites (game_id);

create table public.play_history (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  played_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index play_history_game_idx on public.play_history (game_id);

alter table public.favorites enable row level security;
alter table public.play_history enable row level security;

-- Column grants keep direct REST calls to the same shape as the app: users pick a game, the
-- database picks the timestamps.
revoke all on public.favorites, public.play_history from anon, authenticated;
grant select, delete on public.favorites, public.play_history to authenticated;
grant insert (user_id, game_id) on public.favorites, public.play_history to authenticated;
grant update (played_at) on public.play_history to authenticated;

create policy "users read own favorites" on public.favorites
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users save published games" on public.favorites
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.games g where g.id = game_id and g.status = 'published')
  );
create policy "users remove own favorites" on public.favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "users read own history" on public.play_history
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "users record published games" on public.play_history
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.games g where g.id = game_id and g.status = 'published')
  );
-- record_play needs the played_at grant for its ON CONFLICT update; the check keeps a direct
-- PATCH from setting any other time (an "infinity" row would break the profile page).
create policy "users bump own history" on public.play_history
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and played_at = now());
create policy "users clear own history" on public.play_history
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- /go calls this with the visitor's session. Invoker rights, so the policies above apply; the
-- user comes from the JWT, never from an argument.
create function public.record_play(p_game_id uuid)
returns void
language sql
set search_path = ''
as $$
  insert into public.play_history (user_id, game_id)
  values ((select auth.uid()), p_game_id)
  on conflict (user_id, game_id) do update set played_at = now();
$$;

revoke execute on function public.record_play(uuid) from public, anon;
grant execute on function public.record_play(uuid) to authenticated;
