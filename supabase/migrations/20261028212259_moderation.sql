-- Bans from /admin/users and moderation from /admin/comments.

-- The admin action also bans the account in Supabase Auth (ban_duration), which stops new
-- sign-ins and token refreshes, but an access token already issued stays valid until it expires.
-- banned_at takes effect at once: getCurrentUser treats a banned profile as signed out, and the
-- update policy below stops a banned user renaming themselves in that window (undoing an admin
-- rename). Users can't set the ban columns: their column grant on profiles covers username and
-- avatar_url only (init). Only the actions write them, with the secret key.
alter table public.profiles
  add column banned_at timestamptz,
  add column ban_reason text,
  add constraint profiles_ban_reason_check check (
    ban_reason is null or (banned_at is not null and char_length(ban_reason) between 1 and 200)
  );

drop policy "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id and banned_at is null)
  with check ((select auth.uid()) = id);

-- Who took a comment down. An admin can restore what an admin deleted, never what its author
-- deleted. The actions set it together with deleted_at. Comments deleted before this migration
-- count as the author's, so they stay down. The explicit "is not null" matters: with a NULL
-- deleted_by the "in" test is NULL, and a check passes on NULL.
alter table public.comments add column deleted_by text;
update public.comments set deleted_by = 'author' where deleted_at is not null;
alter table public.comments
  add constraint comments_deleted_by_check check (
    (deleted_at is null and deleted_by is null)
    or (deleted_at is not null and deleted_by is not null and deleted_by in ('author', 'admin'))
  );
