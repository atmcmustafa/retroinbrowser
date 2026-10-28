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
- [x] Google ve Discord OAuth (`docs/SETUP.md` adım 3): Supabase'de açık, Google girişi admin hesabına bağlı

## Faz 1 — MVP

- [x] Site layout: header, footer, mobil menü
- [x] `GameCard`, `GameRow`, `GenreGrid`, `PlatformChips` bileşenleri
- [x] `lib/data/games.ts`: listeleme, filtre, arama, detay, benzerler (`"use cache"`)
- [x] `/login` + `auth/callback` (e-posta, Google, Discord)
- [x] Admin layout + `/admin/games` tablo ve form
- [x] SteamGridDB kapak arama + Storage'a yükleme
- [x] `/admin/taxonomy`
- [x] 15-20 oyunu elle gir: 16 oyun yayında. Taslakta bekleyenler: `half-life-2-web` (site 404), `need-for-speed-most-wanted-online` (erişilemiyor, giriş zorunlu, domain güvenlik taramalarında işaretli), `the-browsing-of-isaac` (site kapalı); açılınca tekrar kontrol et
- [x] Ana sayfa
- [x] `/games` arama ve filtreler
- [x] `/games/[slug]` + `/go/[slug]`
- [x] `/popular`, `/new`, `/platforms/[slug]`, `/genres/[slug]`
- [x] ⌘K arama paleti
- [x] `/submit` + Turnstile + `/admin/candidates` kuyruğu
- [x] `/about`, `/dmca`, 404
- [x] `sitemap.ts`, `robots.ts`, OG görselleri, metadata
- [x] İletişim adresi: `retroinbrowser@gmail.com` (`src/lib/site.ts` → /about, /dmca, footer)
- [x] Güvenlik taraması ve sıkılaştırma (28 Ekim): migration `security_hardening`, HTTP header'ları/CSP, HttpOnly auth cookie'leri, tıklama tekilleştirme, `next/image` kısıtı
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

- [ ] Herkese açık e-posta girişi: Supabase'e custom SMTP (CAPTCHA zaten açık)
- [ ] Yorumlar (yazma yetkisi `security_hardening` ile kapalı; açarken rate limit trigger'ı ekle)
- [ ] Puanlama (yazma yetkisi kapalı, yorumlarla aynı not)
- [ ] "Works for me" raporları (`game_reports`) ve kartta cihaz bazlı özet
- [ ] `/takedowns` sayfası (`link_checks` geçmişinden)
