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
- [x] Vercel + Cloudflare ile canlıya alma: https://retroinbrowser.com (DNS only, `fra1`)
- [x] Header'da Sign in / hesap menüsü, ana sayfada kütüphane kutusu
- [x] `/profile`: bilgiler, son oynananlar (`/go`), favoriler (oyun sayfasında Save); migration `library` (bağımsız agent incelemesi)
- [x] Vercel Firewall: POST, `/go/`, `/api/`, `/auth/` için IP başına 100 istek/dk kuralı, `log` modunda
- [ ] Firewall kuralını trafiğe bakıp 429'a çevir (bir hafta sonra; `docs/HANDOFF.md`)

## SEO

- [x] Teknik tur (28 Ekim): "Play X in your browser" başlıkları, site adı için `WebSite` JSON-LD, `BreadcrumbList`, `/login` robots'tan çıktı (noindex). Lighthouse SEO 100.
- [ ] Search Console: Domain property (Cloudflare ile doğrulama), sitemap gönder, ana sayfa ve birkaç oyun için "Request indexing" (kullanıcı, panel işi)
- [ ] Bing Webmaster Tools: Search Console'dan içe aktar (kullanıcı; Bing, DuckDuckGo ve ChatGPT aramasını besler)
- [x] Oyun sayfasına uzun içerik: `games.description` (Markdown alt kümesi, `RichText`), admin formunda alan, 16 oyunun metni (araştırma agent'larıyla, kaynaklı)
- [x] IndexNow (Bing, Yandex): admin kaydında otomatik ping, `npm run indexnow` ile toplu gönderim; `/feed.xml` RSS (robots'ta ikinci sitemap)
- [ ] Koleksiyon sayfaları: telefonda oynanabilenler, dosya gerektirmeyenler, çok oyunculu (mevcut filtrelerden, giriş paragrafıyla)
- [ ] Aynı oyunun birden çok portu olunca orijinal oyun sayfası (portları karşılaştırır)
- [ ] Katalog 36'yı geçince sayfalı listelerde `?page=N` canonical (`docs/ARCHITECTURE.md` → SEO)
- [ ] Puanlama (Faz 3) gelince `VideoGame` JSON-LD'ye `aggregateRating`

## Faz 2 — Otomasyon (detay: `docs/AUTOMATION.md`)

- [x] Migration `discovery`: `link_status` yeni değerleri, `games` kontrol alanları, `link_checks`, `candidate_mentions`, `candidates.extracted`, `candidate_source += googlenews` + RLS (bağımsız agent incelemesi, önerileri işlendi)
- [x] `scripts/lib`: `http`, `classify` (+ parmak izi), `score`, `notify`, `db` + birim testleri (`normalize-url` dahil, 19 test)
- [x] Kaynaklar: `hackernews`, `googlenews` (sarmalayıcı link çözülüyor), `reddit` (RSS, 429'da atlar), `github`
- [x] `scripts/collect.ts`: mention yazma, kopya/duplicate tespiti, skor
- [x] `scripts/extract.ts`: Gemini ücretsiz katmanı (3.8 Flash, meşgulse Flash-Lite) ile alan çıkarma + açıklama taslağı + SteamGridDB kapak/hero, emin olunan "port değil"leri otomatik reddetme, haberden gelen adayı port URL'sine taşıma
- [x] Viral skor + Discord webhook bildirimi (webhook opsiyonel, henüz yok)
- [x] `scripts/check-links.ts`: karar tablosu, aynı çalıştırmada tekrar deneme, `fail_streak`, revalidate. Herkese açık satıra sadece ok/broken yazılır
- [x] `/admin/candidates` formunun `extracted` ile dolu açılması (Save doğrudan yayınlar)
- [x] Admin oyun tablosunda son kontrolün rozeti (kırık, sayfa değişti, takedown?, yavaş)
- [ ] Admin: `taken_down` onayı (oyunu gizle + `taken_down_at`), `changed` için "tamam" butonu
- [x] `.github/workflows/discover.yml` (6 saatte bir) + `check-links.yml` (günlük) + secret'lar
- [ ] `scripts/smoke.ts` + `weekly-smoke.yml`, admin'de son ekran görüntüsü
- [ ] Ana sayfada Trending satırı (`trend_score` + 7 günlük tıklama)

## Faz 3 — Topluluk

- [ ] Herkese açık e-posta girişi: Supabase'e custom SMTP (CAPTCHA zaten açık)
- [ ] Yorumlar (yazma yetkisi `security_hardening` ile kapalı; açarken rate limit trigger'ı ekle)
- [ ] Puanlama (yazma yetkisi kapalı, yorumlarla aynı not)
- [ ] "Works for me" raporları (`game_reports`) ve kartta cihaz bazlı özet
- [ ] `/takedowns` sayfası (`link_checks` geçmişinden)
