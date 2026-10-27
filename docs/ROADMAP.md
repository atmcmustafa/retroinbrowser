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

- [x] Site layout: header, footer, mobil menü
- [x] `GameCard`, `GameRow`, `GenreGrid`, `PlatformChips` bileşenleri
- [x] `lib/data/games.ts`: listeleme, filtre, arama, detay, benzerler (`"use cache"`)
- [x] `/login` + `auth/callback` (e-posta; GitHub/Discord sonra)
- [x] Admin layout + `/admin/games` tablo ve form
- [x] SteamGridDB kapak arama + Storage'a yükleme
- [x] `/admin/taxonomy`
- [ ] 15-20 oyunu elle gir (19 başlangıç oyunu taslak olarak yüklendi: `supabase/starter-games.sql`; görseller `npm run artwork` ile eklendi; kontrol edip yayına al)
- [x] Ana sayfa
- [x] `/games` arama ve filtreler
- [x] `/games/[slug]` + `/go/[slug]`
- [x] `/popular`, `/new`, `/platforms/[slug]`, `/genres/[slug]`
- [x] ⌘K arama paleti
- [ ] `/submit` + Turnstile + `/admin/candidates` kuyruğu
- [ ] `/about`, `/dmca`, 404
- [ ] `sitemap.ts`, `robots.ts`, OG görselleri, metadata
- [ ] Vercel + Cloudflare ile canlıya alma (`docs/SETUP.md` 5-6), sonra Cloudflare kurallarını gözden geçir

## Faz 2 — Otomasyon (detay: `docs/AUTOMATION.md`)

- [ ] Migration: `link_status` yeni değerleri, `games` kontrol alanları, `link_checks`, `candidate_mentions`, `candidates.extracted`, `candidate_source += googlenews` + RLS (bağımsız agent incelemesi)
- [ ] `scripts/lib`: `normalize-url`, `fingerprint`, `classify`, `score`, `notify`, `db` + birim testleri
- [ ] Kaynaklar: `hackernews`, `googlenews`, `reddit`, `github` (paralel subagent'larla yapılabilir)
- [ ] `scripts/collect.ts`: mention yazma, kopya/duplicate tespiti
- [ ] `scripts/extract.ts`: LLM ile alan çıkarma, düşük güvenli olmayanları otomatik reddetme
- [ ] Viral skor + Discord webhook bildirimi
- [ ] `scripts/check-links.ts`: karar tablosu, `fail_streak`, revalidate route
- [ ] `/admin/candidates` formunun `extracted` ile dolu açılması
- [ ] Admin özeti: kırık, `changed` ve `taken_down` onayı bekleyenler
- [ ] `.github/workflows/daily.yml` + secret'lar
- [ ] `scripts/smoke.ts` + `weekly-smoke.yml`, admin'de son ekran görüntüsü
- [ ] Ana sayfada Trending satırı (`trend_score` + 7 günlük tıklama)

## Faz 3 — Topluluk

- [ ] Herkese açık giriş: Supabase'e custom SMTP, Attack Protection'da CAPTCHA (Turnstile) ve `/login` formuna token
- [ ] Yorumlar
- [ ] Puanlama
- [ ] "Works for me" raporları (`game_reports`) ve kartta cihaz bazlı özet
- [ ] `/takedowns` sayfası (`link_checks` geçmişinden)
