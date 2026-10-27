create extension if not exists pg_trgm with schema extensions;

create type public.user_role as enum ('user', 'admin');
create type public.game_status as enum ('draft', 'published', 'hidden');
create type public.link_status as enum ('unknown', 'ok', 'broken');
create type public.candidate_source as enum ('reddit', 'hackernews', 'github', 'user');
create type public.candidate_status as enum ('pending', 'approved', 'rejected', 'duplicate');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.platforms (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  short_name text,
  color text not null default '#94a3b8',
  sort smallint not null default 0
);

create table public.genres (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  icon text,
  sort smallint not null default 0
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  original_title text not null,
  platform_id smallint references public.platforms (id) on delete set null,
  play_url text not null unique,
  source_url text,
  developer text,
  summary text check (char_length(summary) <= 280),
  cover_url text,
  hero_url text,
  steamgriddb_id integer,
  tech text,
  requires_own_files boolean not null default false,
  mobile_support boolean not null default false,
  gamepad_support boolean not null default false,
  featured boolean not null default false,
  status public.game_status not null default 'draft',
  link_status public.link_status not null default 'unknown',
  last_checked_at timestamptz,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(original_title, '') || ' ' || coalesce(developer, ''))
  ) stored
);

create index games_status_published_idx on public.games (status, published_at desc);
create index games_popular_idx on public.games (status, click_count desc);
create index games_platform_idx on public.games (platform_id);
create index games_search_idx on public.games using gin (search);
create index games_title_trgm_idx on public.games using gin (title extensions.gin_trgm_ops);

create table public.game_genres (
  game_id uuid not null references public.games (id) on delete cascade,
  genre_id smallint not null references public.genres (id) on delete cascade,
  primary key (game_id, genre_id)
);

create index game_genres_genre_idx on public.game_genres (genre_id);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text,
  source public.candidate_source not null,
  source_ref text,
  raw jsonb,
  score real,
  note text,
  status public.candidate_status not null default 'pending',
  game_id uuid references public.games (id) on delete set null,
  submitted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

create index candidates_status_idx on public.candidates (status, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comments_game_idx on public.comments (game_id, created_at desc);

create table public.ratings (
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (game_id, user_id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger games_set_updated_at
before insert or update on public.games
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_click(game_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.games
  set click_count = click_count + 1
  where slug = game_slug and status = 'published';
$$;

revoke execute on function public.increment_click(text) from public;
grant execute on function public.increment_click(text) to anon, authenticated;

create view public.game_ratings
with (security_invoker = true)
as
select game_id, round(avg(value)::numeric, 1) as average, count(*)::int as count
from public.ratings
group by game_id;

alter table public.profiles enable row level security;
alter table public.platforms enable row level security;
alter table public.genres enable row level security;
alter table public.games enable row level security;
alter table public.game_genres enable row level security;
alter table public.candidates enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;

create policy "profiles are public" on public.profiles
  for select using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (username, avatar_url) on public.profiles to authenticated;

create policy "platforms are public" on public.platforms
  for select using (true);
create policy "admins manage platforms" on public.platforms
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "genres are public" on public.genres
  for select using (true);
create policy "admins manage genres" on public.genres
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "published games are public" on public.games
  for select using (status = 'published' or (select public.is_admin()));
create policy "admins manage games" on public.games
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "game genres are public" on public.game_genres
  for select using (true);
create policy "admins manage game genres" on public.game_genres
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins manage candidates" on public.candidates
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "visible comments are public" on public.comments
  for select using (deleted_at is null or (select public.is_admin()));
create policy "users write own comments" on public.comments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users or admins edit comments" on public.comments
  for update to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "ratings are public" on public.ratings
  for select using (true);
create policy "users rate as themselves" on public.ratings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "users change own rating" on public.ratings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "users remove own rating" on public.ratings
  for delete to authenticated
  using ((select auth.uid()) = user_id);
