-- Long-form text for the game page (how to play, what you need, caveats), in the small Markdown
-- subset that src/components/site/rich-text.tsx renders. The one-line summary stays the meta
-- description.
alter table public.games
  add column description text check (char_length(description) <= 8000);
