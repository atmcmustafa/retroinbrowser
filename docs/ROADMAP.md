# Yol haritası

Her adım ayrı bir Claude Code oturumu/commit olabilir. Bitince `[x]`.

## Faz 0 — Temel

- [x] Next.js 16 + Tailwind 4 + TypeScript iskeleti
- [x] Supabase client'ları, `proxy.ts` oturum yenileme ve `/admin` koruması
- [x] Şema, RLS, seed, tipler
- [x] `npx shadcn@latest init` (base: radix) → sonra `globals.css`'teki token'ları `docs/DESIGN.md`'ye göre koru/yeniden uygula
- [x] shadcn bileşenleri: `button input textarea label badge dialog command dropdown-menu sheet select checkbox switch table tabs skeleton sonner carousel tooltip avatar separator field`
- [x] Paketler: `npm i @tanstack/react-table @marsidev/react-turnstile sharp`
- [x] `docs/SETUP.md` adım 1-2 (Supabase link, migration, seed, `covers` bucket)
- [x] Admin rolü (`docs/SETUP.md` adım 4)
- [ ] GitHub ve Discord OAuth (`docs/SETUP.md` adım 3): sonraya bırakıldı, şimdilik e-posta

## Faz 1 — MVP

- [ ] Site layout: header, footer, mobil menü
- [ ] `GameCard`, `GameRow`, `GenreGrid`, `PlatformChips` bileşenleri
- [ ] `lib/data/games.ts`: listeleme, filtre, arama, detay, benzerler (`"use cache"`)
- [x] `/login` + `auth/callback` (e-posta; GitHub/Discord sonra)
- [x] Admin layout + `/admin/games` tablo ve form
- [x] SteamGridDB kapak arama + Storage'a yükleme
- [ ] `/admin/taxonomy`
- [ ] 15-20 oyunu elle gir
- [ ] Ana sayfa
- [ ] `/games` arama ve filtreler
- [ ] `/games/[slug]` + `/go/[slug]`
- [ ] `/popular`, `/new`, `/platforms/[slug]`, `/genres/[slug]`
- [ ] ⌘K arama paleti
- [ ] `/submit` + Turnstile + `/admin/candidates` kuyruğu
- [ ] `/about`, `/dmca`, 404
- [ ] `sitemap.ts`, `robots.ts`, OG görselleri, metadata
- [ ] Vercel + Cloudflare ile canlıya alma (`docs/SETUP.md` 5-6), sonra Cloudflare kurallarını gözden geçir

## Faz 2 — Otomasyon

- [ ] `scripts/collect.ts` (HN Algolia, Reddit, GitHub)
- [ ] `scripts/check-links.ts`
- [ ] `.github/workflows/daily.yml` (cron, secret'lar)
- [ ] Admin özetinde kırık link listesi

## Faz 3 — Topluluk

- [ ] Herkese açık giriş: Supabase'e custom SMTP, Attack Protection'da CAPTCHA (Turnstile) ve `/login` formuna token
- [ ] Yorumlar
- [ ] Puanlama
- [ ] Mobil uyumluluk raporları
