# Mimari

## Servisler (hepsi ücretsiz katman)

| Servis         | Rol                             | Limitler / dikkat                                                                                              |
| -------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby   | Next.js hosting                 | Sadece ticari olmayan kullanım. 5.000 image transformation/ay, 1M function çağrısı. Cron için kullanmıyoruz    |
| Supabase Free  | Postgres, Auth, Storage         | 500 MB DB, 1 GB storage, 5 GB egress/ay, 2 proje. **1 hafta aktivite yoksa uyur** (Faz 2 cron'u bunu engeller) |
| Cloudflare     | DNS, Turnstile                  | DNS kayıtları Vercel'e **DNS only** (gri bulut). İletişim adresi `retroinbrowser@gmail.com`                    |
| GitHub Actions | Günlük toplama ve link kontrolü | Public repoda sınırsız, private'ta 2.000 dk/ay                                                                 |
| SteamGridDB    | Kapak ve hero görselleri        | Ücretsiz API key. Footer'da kaynak belirtilir                                                                  |

## Veri modeli (`supabase/migrations`)

- `platforms`, `genres`: sabit sözlükler, seed ile gelir
- `games`: yayınlanan portlar. `status` (draft/published/hidden), `link_status`, `click_count`, rozet boolean'ları, `search` (tsvector) ve `title` trigram indeksi
- `game_genres`: çoka çok
- `candidates`: bot ve kullanıcı önerileri, onay kuyruğu. `url` unique
- `profiles`: `auth.users` ile 1-1, kayıtta trigger ile oluşur. `role` kullanıcı tarafından değiştirilemez (kolon yetkisi)
- `game_click_visitors`: `/go` tıklamalarının günlük tekilleştirmesi (gün, oyun, ziyaretçi hash'i), sadece service_role
- `favorites`, `play_history`: kullanıcının kütüphanesi, kullanıcı ve oyun başına bir satır. Sadece sahibi okur/yazar, sadece yayındaki oyunlar eklenir; zaman damgalarını veritabanı koyar (kolon yetkileri). `play_history`'yi `/go` `record_play(game_id)` ile yazar (invoker, kullanıcı JWT'den)
- `comments`, `ratings`, `game_ratings` view: Faz 3

## Güvenlik

- Güvenlik sınırı RLS. Anonim kullanıcı sadece `published` oyunları görür, `candidates`'ı hiç göremez
- Admin kontrolü üç katmanda: `proxy.ts` (yönlendirme), `requireAdmin()` (her admin sayfası ve server action), RLS `is_admin()`
- `createAdminClient()` (secret key, RLS'i aşar) sadece: `/submit` server action'ı (Turnstile doğrulandıktan sonra), `/go` (tıklama sayacı) ve `scripts/`
- Oyun linkleri her zaman dışarı açılır (`/go/[slug]`), iframe yok
- Tablo yetkileri (migration `security_hardening`): anon hiçbir tabloya yazamaz; TRUNCATE, TRIGGER, REFERENCES, MAINTAIN kimsede yok, çünkü RLS bunları denetlemez. Yeni tablolar da böyle oluşur (default privileges). Yeni fonksiyonları sadece owner ve service_role çalıştırabilir; RLS'te kullanılan ya da herkese açık RPC olan fonksiyona `grant execute ... to anon, authenticated` gerekir (`is_admin` eski yetkisini korur). `supabase_admin`'in oluşturduğu nesnelerde Supabase varsayılanları geçerli, `postgres` bunu değiştiremez
- `profiles` sadece sahibine ve admin'e görünür (Google'dan gelen gerçek ad burada). `username` 1-32 karakter, görünmez ve yön değiştiren karakterler (RLO, sıfır genişlik) ile baş/son boşluk yok; `avatar_url` sadece Discord, Google ve GitHub'ın avatar yolları. `handle_new_user` metadata'yı aynı kurallarla temizler, alınmış bir adı `null`'a çevirir, kaydı düşürmez
- `comments` ve `ratings`'e yazma kapalı. Faz 3'te açarken rate limit trigger'ı da ekle: yoksa herhangi bir hesap REST API'den sınırsız satır yazar ve 500 MB'lık free DB dolar
- Tıklama sayacı: `increment_click(slug, visitor)` sadece service_role. `/go` ziyaretçi IP'sinin (IPv6'da /64 öneki) güne bağlı HMAC'ini gönderir; `game_click_visitors` aynı ziyaretçinin aynı gün tekrar sayılmasını engeller, 2 günden eski satırları siler. IP saklanmaz. Tıklama `updated_at`'i değiştirmez
- Auth cookie'leri HttpOnly, https'te Secure. Tarayıcı tarafında Supabase client yok
- Giriş: e-posta magic link, Google, Discord (hepsi PKCE, `/auth/callback`). `/login` butonları Supabase'de açık sağlayıcılardan çıkarır (`/auth/v1/settings`, birkaç dakika önbellek). E-posta formu Turnstile token'ı gönderir, Supabase CAPTCHA açık (`config.toml` `[auth.captcha]`) ve token'sız `otp`/`signup` isteklerini reddeder; bu Auth API'ye doğrudan gelen istekleri de kapsar. Oturum yenileme, PKCE ve OAuth etkilenmez. Localde e-posta girişi çalışmaz (test widget'ı), Google/Discord ile girilir
- HTTP header'ları `next.config.ts`'te: CSP, HSTS, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy. CSP nonce kullanmaz (statik shell'ler nonce taşıyamaz), bu yüzden inline script serbest; kaynaklar ve `frame-ancestors 'none'` kısıtlı. `form-action` bilerek yok: OAuth formu Supabase üzerinden Google/Discord'a yönlendiriyor
- `next/image` sadece kendi `covers` bucket'ımızı optimize eder. Joker host, Vercel'in aylık görsel kotasının başkalarının görselleriyle tüketilmesine izin verirdi

## Görseller

Admin kapak seçtiğinde sunucu tarafında `sharp` ile WebP'ye çevrilir (kapak 600x900, hero 1920x620) ve Supabase Storage `covers` bucket'ına yüklenir. Sayfalarda `next/image`; Vercel önbelleklediği için Supabase egress düşük kalır.

## Önbellek

`cacheComponents` açık. Herkese açık veriler `"use cache"` + `cacheTag("games" | "taxonomy")` ile önbelleklenir. Cache içinde `cookies()` okunamadığı için bu okumalar `createPublicClient()` (anon, cookie'siz) kullanır. Admin server action'ları değişiklikten sonra `updateTag` çağırır.

**Admin dışı değişiklikler önbelleği temizlemez.** SQL Editor, Supabase paneli veya `scripts/` ile yapılan bir değişiklik, önbellek süresi (1 saat) dolana kadar sitede görünmez. Belirtisi: "admin'de var, sitede yok". Çözüm:

- Script'ler bitince `scripts/lib/revalidate.ts` → `POST /api/revalidate` (`Authorization: Bearer $REVALIDATE_SECRET`) çağırır; route `games` ve `taxonomy` etiketlerini `{ expire: 0 }` ile düşürür.
- Elle SQL/panel düzenlemesinden sonra: admin özetinde **Refresh site** düğmesi.
- Sadece `published` oyunlar herkese açık. Admin özeti taslak sayısını uyarır; `/admin/games`'te toplu Publish/Draft/Hide var.

Oturum okuyan her şey `<Suspense>` içinde olmalı. Kullanıcıya özel parçalar (header'daki Sign in/hesap menüsü, ana sayfadaki kütüphane kutusu, oyun sayfasındaki Save) küçük dinamik delikler; sayfanın geri kalanı önbellekli shell'de kalır. `getCurrentUser()` React `cache` ile istek başına bir kez çalışır, `getClaims()` ES256 JWT'yi yerelde doğrular (ağ çağrısı yok). Kütüphane verisi asla `"use cache"` içinde okunmaz. `partialPrefetching` açık olduğu için cookie'ler prerender sırasında okunabiliyor; supabase-js ise her çağrıda `Date.now()` ile token süresine bakıyor. Bu yüzden `createClient()` önce `await connection()` çağırır. Sayfalar arası geçişte layout'taki Suspense devreye girmez. İstek anında veri okuyan her sayfanın **kendi klasöründe** `loading.tsx` olmalı (ya da sayfa içinde `<Suspense>`); üst klasördeki `loading.tsx` alt sayfaları kapsamaz. `usePathname` kullanan admin menüsü ayrıca Suspense'e sarılı, çünkü `/admin/games/[id]` dinamik parametreli.

## Klasör yapısı

```
src/
  app/
    (site)/          herkese açık sayfalar, ortak header/footer layout
    admin/           admin paneli, kendi layout'u
    go/[slug]/       tıklama sayacı + yönlendirme
    login/, auth/callback/
  components/
    ui/              shadcn bileşenleri
    site/            header, footer, game-card, game-row, search-palette ...
    admin/
  lib/
    supabase/        server.ts, proxy.ts, cookie-options.ts (tarayıcı client'ı yok)
    data/            okuma fonksiyonları (games.ts, taxonomy.ts, admin.ts, auth.ts, library.ts)
    actions/         server action'lar
    schemas/         client form ve server action'ın paylaştığı zod şemaları
    search-params.ts nuqs parser'ları (URL durumu, server ve client ortak)
    images.ts        görsel URL kuralları (paylaşılan); storage.ts, steamgriddb.ts sadece server
    auth.ts, auth-providers.ts, request-ip.ts, env.ts, env.server.ts
  types/database.ts  supabase gen types çıktısı
scripts/             collect.ts, check-links.ts (Faz 2)
supabase/            migrations/, seed.sql, config.toml
```

## SEO

- `src/app/sitemap.ts` (yayındaki oyunlar + içi dolu tür/platform sayfaları), `robots.ts` (`/admin`, `/api/`, `/go/`, `/auth/`, `/profile` kapalı). İkisi de önbellekli veriden üretilir, `games` etiketiyle yenilenir. `/login` bilerek açık: her sayfa ona link veriyor, robots'ta kapalı olsaydı Google `noindex`'i okuyamaz, "Indexed, though blocked by robots.txt" uyarısı çıkardı.
- Başlıklar arama kalıbına göre: oyun sayfası `Play {orijinal oyun} in your browser: {port}`, ana sayfa `Play classic games in your browser`.
- Bulunmayan oyun 200 + `noindex` döner (PPR kabuğu `notFound()`'dan önce akıyor); Search Console'da "Excluded by noindex" olarak görünür, hata değil.
- Sayfalı listelerde (`?page=N`) canonical sayfa 1'i gösteriyor. Sayfa boyu 36, katalog bunu geçince `?page=N` kendi canonical'ını almalı; `generateMetadata` `searchParams` okursa metadata akışa düşer, önce dokümana bak.
- OG görselleri: kök `opengraph-image.tsx` (marka kartı) ve `games/[slug]/opengraph-image.tsx` (hero + kapak + başlık). Satori statik TTF ister: `assets/fonts/` (Latin alt küme), `next.config.ts` `outputFileTracingIncludes` ile pakete girer. WebP kapaklar `sharp` ile JPEG'e çevrilip verilir.
- Sayfa `openGraph` tanımlarsa kökteki obje birleşmez, yerine geçer: `baseOpenGraph`'ı (`src/lib/site.ts`) yay. Tanımlamayan sayfalar başlık/açıklamayı Next'ten otomatik alır.
- JSON-LD: ana sayfada `WebSite` (Google'ın sonuçlarda gösterdiği site adı için `alternateName`, `publisher` logosu; sitelinks arama kutusu 2024'te kalktı, `SearchAction` yok), oyun sayfasında `BreadcrumbList` (Games › platform › port) ve `VideoGame` (`isBasedOn` orijinal oyun). Puanlama gelince `aggregateRating` eklenirse yıldızlı sonuç çıkabilir. `<JsonLd>` `<` karakterini kaçışlar.
- Search Console ve Bing Webmaster Tools: Domain property, Cloudflare DNS ile doğrulanır; sitemap `https://retroinbrowser.com/sitemap.xml`.
- İkonlar `scripts/generate-icons.ts` ile logodan üretilir (`icon.svg`, `favicon.ico`, `apple-icon.png`); logo değişirse tekrar çalıştır.
