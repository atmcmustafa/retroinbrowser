insert into public.platforms (slug, name, short_name, color, sort) values
  ('pc', 'PC', 'PC', '#94a3b8', 1),
  ('dos', 'MS-DOS', 'DOS', '#a8a29e', 2),
  ('nintendo-64', 'Nintendo 64', 'N64', '#ef4444', 3),
  ('playstation', 'PlayStation', 'PS1', '#9ca3af', 4),
  ('playstation-2', 'PlayStation 2', 'PS2', '#3b82f6', 5),
  ('gamecube', 'GameCube', 'GC', '#8b5cf6', 6),
  ('snes', 'Super Nintendo', 'SNES', '#c084fc', 7),
  ('nes', 'NES', 'NES', '#f87171', 8),
  ('game-boy-advance', 'Game Boy Advance', 'GBA', '#6366f1', 9),
  ('sega-genesis', 'Sega Genesis', 'GEN', '#0ea5e9', 10),
  ('xbox', 'Xbox', 'XBOX', '#22c55e', 11),
  ('arcade', 'Arcade', 'ARC', '#f59e0b', 12),
  ('other', 'Other', 'OTH', '#64748b', 99);

insert into public.genres (slug, name, icon, sort) values
  ('action', 'Action', 'swords', 1),
  ('adventure', 'Adventure', 'compass', 2),
  ('racing', 'Racing', 'flag', 3),
  ('shooter', 'Shooter', 'crosshair', 4),
  ('platformer', 'Platformer', 'footprints', 5),
  ('rpg', 'RPG', 'shield', 6),
  ('fighting', 'Fighting', 'hand-fist', 7),
  ('sports', 'Sports', 'volleyball', 8),
  ('strategy', 'Strategy', 'castle', 9),
  ('puzzle', 'Puzzle', 'puzzle', 10);
