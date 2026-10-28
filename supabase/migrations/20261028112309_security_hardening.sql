-- Anon never writes directly (submissions go through /submit, clicks through /go), and RLS
-- doesn't cover TRUNCATE, TRIGGER, REFERENCES or MAINTAIN, so only the owner keeps those.
revoke insert, update, delete on all tables in schema public from anon;
revoke truncate, references, trigger, maintain on all tables in schema public from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke insert, update, delete on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;

-- New functions are callable by nobody but the owner and service_role. A function used in RLS
-- or meant as a public RPC needs an explicit grant (is_admin keeps its existing one).
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

-- Profiles now carry names and avatars from Google and Discord, and nothing lists other users yet.
drop policy "profiles are public" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

revoke insert, delete on public.profiles from authenticated;

-- Users can edit these two columns over the REST API. Names can't hide behind invisible or
-- direction-flipping characters, and avatars stay on provider avatar paths so a profile can't
-- make every visitor's browser call an arbitrary URL.
alter table public.profiles
  add constraint profiles_username_check
    check (
      char_length(username) between 1 and 32
      and username !~ '[[:cntrl:]؜​‎‏ -‮⁠⁦-⁩﻿]'
      and username !~ '^[[:space:]]|[[:space:]]$'
    ),
  add constraint profiles_avatar_url_check
    check (
      char_length(avatar_url) <= 500
      and avatar_url ~ '^https://(cdn\.discordapp\.com/(embed/)?avatars/|lh[0-9]+\.googleusercontent\.com/a-?/|avatars\.githubusercontent\.com/u/)'
    );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw text := coalesce(
    nullif(btrim(meta ->> 'user_name'), ''),
    nullif(btrim(meta ->> 'preferred_username'), ''),
    nullif(btrim(meta ->> 'full_name'), ''),
    nullif(btrim(meta ->> 'name'), '')
  );
  -- Same rules as profiles_username_check, applied as a cleanup so the insert can't fail on them.
  wanted text := nullif(regexp_replace(left(regexp_replace(regexp_replace(
    raw, '[[:cntrl:]؜​‎‏ -‮⁠⁦-⁩﻿]', '', 'g'),
    '^[[:space:]]+', ''), 32), '[[:space:]]+$', ''), '');
  avatar text := meta ->> 'avatar_url';
begin
  if char_length(avatar) > 500
    or avatar !~ '^https://(cdn\.discordapp\.com/(embed/)?avatars/|lh[0-9]+\.googleusercontent\.com/a-?/|avatars\.githubusercontent\.com/u/)' then
    avatar := null;
  end if;

  begin
    insert into public.profiles (id, username, avatar_url) values (new.id, wanted, avatar);
  exception when unique_violation then
    -- Google names repeat ("John Smith"); a taken one must not fail the sign-up.
    insert into public.profiles (id, username, avatar_url) values (new.id, null, avatar);
  end;
  return new;
end;
$$;

-- Comments and ratings come in Phase 3. Until then any signed-in user could fill these tables
-- through the REST API, so writes stay closed; reopen them together with a rate limit.
revoke insert, update, delete on public.comments, public.ratings from authenticated;

-- Rendered as links on the site and in the admin panel. Phase 2 scripts will insert candidates
-- found on other sites, so a javascript: URL must not get in by any path.
alter table public.games
  add constraint games_play_url_check check (play_url ~* '^https?://'),
  add constraint games_source_url_check check (source_url ~* '^https?://');
alter table public.candidates
  add constraint candidates_url_check check (url ~* '^https?://');

create table public.game_click_visitors (
  day date not null default current_date,
  game_id uuid not null references public.games (id) on delete cascade,
  visitor text not null,
  primary key (day, game_id, visitor)
);

alter table public.game_click_visitors enable row level security;
revoke all on public.game_click_visitors from anon, authenticated;

drop function public.increment_click(text);

-- One click per visitor, game and day. Only /go calls this, with the secret key and a keyed hash
-- of the visitor's IP, so the public REST API can no longer move the Popular ranking.
create function public.increment_click(game_slug text, visitor text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  target uuid;
begin
  select id into target from public.games where slug = game_slug and status = 'published';
  if target is null then
    return;
  end if;

  insert into public.game_click_visitors (game_id, visitor) values (target, visitor)
  on conflict do nothing;
  if found then
    update public.games set click_count = click_count + 1 where id = target;
  end if;

  delete from public.game_click_visitors where day < current_date - 1;
end;
$$;

revoke execute on function public.increment_click(text, text) from public, anon, authenticated;
grant execute on function public.increment_click(text, text) to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only increment_click changes click_count. A click isn't an edit, so it shouldn't reorder
  -- "recently updated" in the admin or move the sitemap's lastmod.
  if tg_op = 'INSERT' then
    new.updated_at = now();
  elsif new.click_count is not distinct from old.click_count then
    new.updated_at = now();
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

-- Trigger functions run without an EXECUTE check; this only closes /rest/v1/rpc/<name>.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
