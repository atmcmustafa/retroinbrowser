-- Starter catalog. Generated from data/starter-games.json. Safe to re-run.
insert into public.platforms (slug, name, short_name, color, sort)
values ('psp', 'PSP', 'PSP', '#64748b', 13)
on conflict (slug) do nothing;

insert into public.games (slug, title, original_title, platform_id, play_url, source_url, developer, summary, tech, requires_own_files, mobile_support, gamepad_support, featured, status)
select v.slug, v.title, v.original_title, p.id, v.play_url, v.source_url, v.developer, v.summary, v.tech, v.requires_own_files, v.mobile_support, v.gamepad_support, v.featured, 'draft'
from (values
  ('need-for-speed-underground-2-revived', 'Underground 2 Revived', 'Need for Speed: Underground 2', 'pc', 'https://nfsu2.xyz/', 'https://github.com/th0mk/nfsu2-web', 'th0mk', 'Static recompilation of the PC version to WebAssembly and WebGPU. Up to 120 FPS, controllers and wheels, and online free roam with no login.', 'Static recompilation, WebAssembly, WebGPU', false, true, true, true),
  ('need-for-speed-most-wanted-online', 'NFS Most Wanted Online', 'Need for Speed: Most Wanted (2005)', 'pc', 'https://nfsmwonline.com/', null, null, 'Experimental browser build of the 2005 racer. Career and free roam in single player; needs Chrome or Edge with WebGPU.', 'WebAssembly, WebGPU', false, false, false, false),
  ('half-life-2-web', 'Web HL2', 'Half-Life 2', 'pc', 'https://hl2.slqnt.dev/', null, 'slqnt, 98006', 'The full Half-Life 2 campaign plus both episodes in a browser tab over WebGL 2, with save states and console support.', 'WebAssembly, WebGL 2', false, false, false, true),
  ('halo-combat-evolved-combat-lab', 'Combat Lab', 'Halo: Combat Evolved', 'xbox', 'https://mitchellhynes.com/combat-lab/', 'https://github.com/OpenCommunityEdition/OpenCE', 'Mitchell Hynes', 'Browser build of the community Halo CE decompilation with 128-player online rooms. Load an XISO made from your own Xbox disc.', 'Decompilation, WebAssembly', true, false, true, true),
  ('simpsons-hit-and-run-wasm', 'Hit & Run WASM', 'The Simpsons: Hit & Run', 'pc', 'https://shar-wasm.cjoseph.workers.dev/', null, 'calebj0seph', 'The PC version running on WebAssembly and WebGL with streamed game data. Desktop Chrome or Edge recommended.', 'WebAssembly, WebGL', false, false, false, true),
  ('gta-vice-city-web', 'Vice City Web Edition', 'Grand Theft Auto: Vice City', 'pc', 'https://quenq.com/apps/vice-city/', null, 'quenq', 'reVC-based WebAssembly build with streamed data, touch controls on phones and gamepad support.', 'Reverse-engineered engine (reVC), WebAssembly', false, true, true, true),
  ('gta-iii-web', 'GTA III Web Edition', 'Grand Theft Auto III', 'pc', 'https://quenq.com/apps/iii-online/', null, 'quenq', 're3-based browser build streaming about 116 MB of data. Touch controls, cheat keyboard and gamepad support.', 'Reverse-engineered engine (re3), WebAssembly', false, true, true, false),
  ('resident-evil-outbreak-web', 'Outbreak Web', 'Resident Evil Outbreak', 'playstation-2', 'https://outbreakweb.com/', null, null, 'PS2 static recompilation running on WebGPU with online rooms, local two-player and on-screen touch controls.', 'Static recompilation (ps2-web-recomp), WebAssembly, WebGPU', false, true, true, true),
  ('red-alert-2-chrono-divide', 'Chrono Divide', 'Command & Conquer: Red Alert 2', 'pc', 'https://chronodivide.com/', null, 'Chrono Divide team', 'A from-scratch JavaScript and WebGL engine for Red Alert 2 with online multiplayer. Imports RA2 data files on first launch.', 'Engine rewrite, WebGL', true, true, false, false),
  ('diablo-web', 'Diablo Web', 'Diablo', 'pc', 'https://johnimril.github.io/diablo_web/', 'https://github.com/JohnImril/diablo_web', 'Nikita Maksimov', 'Devilution-based WebAssembly build. The shareware demo loads automatically; add DIABDAT.MPQ from your copy for the full game.', 'Decompilation (devilution), WebAssembly', false, true, false, false),
  ('quake-iii-arena-q3-pieter', 'q3.pieter.com', 'Quake III Arena', 'pc', 'https://q3.pieter.com/', 'https://github.com/lklacar/q3js', 'Pieter Levels, Luka Klacar', 'ioquake3 compiled to WebAssembly with a live multiplayer server. Demo data loads automatically; touch and gamepad supported.', 'Source port (ioquake3), WebAssembly', false, true, true, false),
  ('lego-island-isle-pizza', 'isle.pizza', 'LEGO Island', 'pc', 'https://isle.pizza/', 'https://github.com/isledecomp/isle.pizza', 'isledecomp community', 'The 1997 classic rebuilt from the isledecomp decompilation. Streams in the browser and can be installed for offline play.', 'Decompilation (isle-portable), WebAssembly', false, true, true, false),
  ('crash-bash-online', 'Crash Bash Online', 'Crash Bash', 'playstation', 'https://crashbash.app/', null, 'Paolo Furlan', 'Online multiplayer Crash Bash in the browser. No ROM needed; on-screen controls on phones and any gamepad on desktop.', 'Browser port', false, true, true, false),
  ('pes-6-web-online', 'PES 6 Web Online', 'Pro Evolution Soccer 6', 'psp', 'https://pes6.optijuegos.net/', null, 'OptiJuegos', 'PSP version statically recompiled to WebAssembly. Remappable controls for multiple players and an experimental 60 FPS mode.', 'Static recompilation, WebAssembly, WebGPU/WebGL2', false, true, true, false),
  ('the-browsing-of-isaac', 'The Browsing of Isaac', 'The Binding of Isaac: Repentance+', 'pc', 'https://tboi.online/', 'https://github.com/chiikabu/the-browsing-of-isaac', 'chiikabu', 'Repentance+ recompiled to WebAssembly with gamepad rumble and touch controls on Android.', 'Recompilation, WebAssembly', false, true, true, false),
  ('tomb-raider-openlara', 'OpenLara', 'Tomb Raider', 'playstation', 'http://xproger.info/projects/OpenLara/', 'https://github.com/XProger/OpenLara', 'Timur Gagiev (XProger)', 'Open-source Tomb Raider engine. The web build streams levels from the author''s server and supports gamepads.', 'Engine rewrite, WebGL', false, false, true, false),
  ('half-life-xash3d-web', 'Pixelsuft HL', 'Half-Life', 'pc', 'https://pixelsuft.github.io/hl/', 'https://github.com/Pixelsuft/hl', 'Pixelsuft', 'Xash3D FWGS compiled with Emscripten. Loads its own data or a local ZIP of your game folder.', 'Source port (Xash3D), WebAssembly', false, false, false, false),
  ('doom-wasm', 'Wasm Doom', 'Doom', 'dos', 'https://silentspacemarine.com/', 'https://github.com/cloudflare/doom-wasm', 'Cloudflare', 'Chocolate Doom on WebAssembly with multiplayer over WebSockets. Shareware Episode 1.', 'Source port (Chocolate Doom), WebAssembly', false, true, false, false),
  ('openttd-online', 'OpenTTD Online', 'Transport Tycoon Deluxe', 'pc', 'https://openttdonline.com/play/', null, 'Owen Gerke', 'Unofficial browser build of OpenTTD 15.3. Downloads free OpenGFX graphics on first start, no game files needed.', 'Source port (OpenTTD), WebAssembly', false, false, false, false)
) as v (slug, title, original_title, platform, play_url, source_url, developer, summary, tech, requires_own_files, mobile_support, gamepad_support, featured)
join public.platforms p on p.slug = v.platform
on conflict (slug) do nothing;

insert into public.game_genres (game_id, genre_id)
select g.id, ge.id
from (values
  ('need-for-speed-underground-2-revived', 'racing'),
  ('need-for-speed-most-wanted-online', 'racing'),
  ('half-life-2-web', 'shooter'),
  ('halo-combat-evolved-combat-lab', 'shooter'),
  ('simpsons-hit-and-run-wasm', 'action'),
  ('simpsons-hit-and-run-wasm', 'racing'),
  ('gta-vice-city-web', 'action'),
  ('gta-iii-web', 'action'),
  ('resident-evil-outbreak-web', 'action'),
  ('resident-evil-outbreak-web', 'adventure'),
  ('red-alert-2-chrono-divide', 'strategy'),
  ('diablo-web', 'rpg'),
  ('diablo-web', 'action'),
  ('quake-iii-arena-q3-pieter', 'shooter'),
  ('lego-island-isle-pizza', 'adventure'),
  ('crash-bash-online', 'action'),
  ('pes-6-web-online', 'sports'),
  ('the-browsing-of-isaac', 'action'),
  ('the-browsing-of-isaac', 'rpg'),
  ('tomb-raider-openlara', 'adventure'),
  ('tomb-raider-openlara', 'action'),
  ('half-life-xash3d-web', 'shooter'),
  ('doom-wasm', 'shooter'),
  ('openttd-online', 'strategy')
) as v (game_slug, genre_slug)
join public.games g on g.slug = v.game_slug
join public.genres ge on ge.slug = v.genre_slug
on conflict do nothing;
