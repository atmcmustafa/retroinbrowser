-- Phase 2 (docs/AUTOMATION.md): discovered candidates with LLM-extracted fields, every place a
-- candidate was mentioned, and daily link checks. Scripts write with the secret key; admins read
-- through RLS; anon reads none of it.

-- Values added here can't be used until this transaction commits, so nothing below refers to them.
-- Enum order is fixed once added; this one sorts healthy before broken: unknown, ok, slow,
-- changed, broken, taken_down.
alter type public.candidate_source add value if not exists 'googlenews';
alter type public.link_status add value if not exists 'slow' after 'ok';
alter type public.link_status add value if not exists 'changed' before 'broken';
alter type public.link_status add value if not exists 'taken_down' after 'broken';

alter table public.candidates
  add column extracted jsonb,
  add column extracted_at timestamptz,
  add column extract_attempts smallint not null default 0,
  add column first_seen_at timestamptz not null default now(),
  add column last_seen_at timestamptz not null default now();
update public.candidates set first_seen_at = created_at, last_seen_at = created_at;

-- Discovery grows this table; these foreign keys had no index.
create index candidates_game_idx on public.candidates (game_id);
create index candidates_reviewed_by_idx on public.candidates (reviewed_by);
create index candidates_submitted_by_idx on public.candidates (submitted_by);

-- url is where the candidate was mentioned (HN item, news wrapper, repo), not the candidate itself.
create table public.candidate_mentions (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  source public.candidate_source not null,
  url text not null check (url ~* '^https?://'),
  title text,
  points integer,
  seen_at timestamptz not null default now(),
  unique (candidate_id, url)
);
create index candidate_mentions_url_idx on public.candidate_mentions (url);

alter table public.candidate_mentions enable row level security;
revoke all on public.candidate_mentions from anon, authenticated;
grant select on public.candidate_mentions to authenticated;
create policy "admins read candidate mentions" on public.candidate_mentions
  for select to authenticated
  using ((select public.is_admin()));

-- anon can read every column of a published game, so scripts only write ok/broken to
-- link_status; slow, changed and taken_down stay in link_checks until an admin acts.
alter table public.games
  add column fail_streak smallint not null default 0,
  add column last_ok_at timestamptz,
  add column page_title text,
  add column page_fingerprint text,
  add column taken_down_at timestamptz;

create table public.link_checks (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games (id) on delete cascade,
  checked_at timestamptz not null default now(),
  kind text not null check (kind in ('http', 'smoke')),
  http_status smallint,
  final_url text check (final_url ~* '^https?://'),
  response_ms integer,
  page_title text,
  fingerprint text,
  verdict public.link_status not null,
  error text,
  details jsonb
);
create index link_checks_game_idx on public.link_checks (game_id, checked_at desc);

alter table public.link_checks enable row level security;
revoke all on public.link_checks from anon, authenticated;
grant select on public.link_checks to authenticated;
create policy "admins read link checks" on public.link_checks
  for select to authenticated
  using ((select public.is_admin()));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- Clicks and link-check bookkeeping aren't edits: they shouldn't reorder "recently updated" in
  -- the admin or move the sitemap's lastmod. link_status does count, the game page shows it.
  -- search is null in a BEFORE trigger (generated afterwards), so it's left out too. Any new
  -- column a script rewrites on a schedule belongs in this list.
  bookkeeping constant text[] := array[
    'updated_at', 'search', 'click_count', 'last_checked_at', 'fail_streak', 'last_ok_at',
    'page_title', 'page_fingerprint'
  ];
begin
  if tg_op = 'INSERT' or (to_jsonb(new) - bookkeeping) is distinct from (to_jsonb(old) - bookkeeping) then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
