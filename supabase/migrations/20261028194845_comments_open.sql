-- Comments open (Phase 3). Writes go only through the server actions in
-- src/lib/actions/comments.ts: they check the session, length, tags, links and profanity, then
-- write with the secret key. authenticated keeps no insert/update/delete grant
-- (security_hardening), so nothing reaches the table around those checks. The rules below hold
-- whoever writes: length, visible text, the fixed tag list, a clean author name, a per-user rate
-- limit and a date set by the database.

-- Shown to everyone next to the comment, so it follows profiles_username_check: no control,
-- invisible or direction-changing characters, no leading or trailing space. The bracket holds
-- U+061C, U+200B, U+200E, U+200F, U+2028-U+202E, U+2060, U+2066-U+2069 and U+FEFF as literal
-- characters, like that check.
alter table public.comments
  add column tags text[] not null default '{}',
  add column author_name text not null check (
    char_length(author_name) between 1 and 40
    and author_name !~ '[[:cntrl:]؜​‎‏ -‮⁠⁦-⁩﻿]'
    and author_name !~ '^[[:space:]]|[[:space:]]$'
  );

-- A comment can be only tags ("Works", "Laggy") or text up to 500 characters. Text needs two
-- visible characters: btrim alone lets newlines, NBSP and zero-width spaces through. The bracket
-- holds U+061C, U+200B-U+200F, U+2028-U+202E, U+2060-U+2069 and U+FEFF as literal characters.
alter table public.comments drop constraint comments_body_check;
alter table public.comments alter column body set default '';
alter table public.comments
  add constraint comments_body_check check (char_length(body) <= 500),
  add constraint comments_tags_check check (
    cardinality(tags) <= 3
    and tags <@ array['works', 'not_working', 'great', 'laggy', 'works_on_phone', 'controller_works', 'buggy']
    and not tags @> array['works', 'not_working']
  ),
  add constraint comments_content_check check (
    char_length(regexp_replace(body, '[[:space:][:cntrl:]؜​-‏ -‮⁠-⁩﻿]', '', 'g')) >= 2
    or cardinality(tags) > 0
  );

-- The init policies for writes were never reachable without a grant, and would let a user skip
-- the actions' checks (links, hidden games, any author name, backdating) if one came back.
drop policy "users write own comments" on public.comments;
drop policy "users or admins edit comments" on public.comments;

-- Comments on a draft or hidden game stay out of view, like the game itself.
drop policy "visible comments are public" on public.comments;
create policy "visible comments are public" on public.comments
  for select using (
    (
      deleted_at is null
      and exists (
        select 1 from public.games
        where games.id = comments.game_id and games.status = 'published'
      )
    )
    or (select public.is_admin())
  );

-- Rate limit lookups, and the foreign key the advisor flagged.
create index comments_user_idx on public.comments (user_id, created_at desc);

-- The lock makes a user's inserts take turns, so parallel ones can't all pass the count.
-- The database dates the row, so a writer can't backdate past the limit or pin a comment on top.
-- Deleted comments count too (the secret key skips RLS): they still take space, and posting and
-- deleting would otherwise have no limit.
create function public.comments_rate_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('comments_rate_limit:' || new.user_id::text, 0));
  new.created_at := now();
  if (
    select count(*) from public.comments
    where user_id = new.user_id and created_at > now() - interval '10 minutes'
  ) >= 5 or (
    select count(*) from public.comments
    where user_id = new.user_id and created_at > now() - interval '1 day'
  ) >= 30 then
    raise exception 'comment rate limit' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;

create trigger comments_rate_limit
before insert on public.comments
for each row execute function public.comments_rate_limit();

revoke execute on function public.comments_rate_limit() from public, anon, authenticated;
