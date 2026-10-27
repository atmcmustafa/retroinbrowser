# Mimari

## Servisler (hepsi ücretsiz katman)

| Servis         | Rol                                 | Limitler / dikkat                                                                                              |
| -------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby   | Next.js hosting                     | Sadece ticari olmayan kullanım. 5.000 image transformation/ay, 1M function çağrısı. Cron için kullanmıyoruz    |
| Supabase Free  | Postgres, Auth, Storage             | 500 MB DB, 1 GB storage, 5 GB egress/ay, 2 proje. **1 hafta aktivite yoksa uyur** (Faz 2 cron'u bunu engeller) |
| Cloudflare     | DNS, Turnstile, e-posta yönlendirme | DNS kayıtları Vercel'e **DNS only** (gri bulut). `contact@retroinbrowser.com` → kişisel posta                  |
| GitHub Actions | Günlük toplama ve link kontrolü     | Public repoda sınırsız, private'ta 2.000 dk/ay                                                                 |
| SteamGridDB    | Kapak ve hero görselleri            | Ücretsiz API key. Footer'da kaynak belirtilir                                                                  |

## Veri modeli (`supabase/migrations`)

- `platforms`, `genres`: sabit sözlükler, seed ile gelir
- `games`: yayınlanan portlar. `status` (draft/published/hidden), `link_status`, `click_count`, rozet boolean'ları, `search` (tsvector) ve `title` trigram indeksi
- `game_genres`: çoka çok
- `candidates`: bot ve kullanıcı önerileri, onay kuyruğu. `url` unique
- `profiles`: `auth.users` ile 1-1, kayıtta trigger ile oluşur. `role` kullanıcı tarafından değiştirilemez (kolon yetkisi)
- `comments`, `ratings`, `game_ratings` view: Faz 3

## Güvenlik

- Güvenlik sınırı RLS. Anonim kullanıcı sadece `published` oyunları görür, `candidates`'ı hiç göremez
- Admin kontrolü üç katmanda: `proxy.ts` (yönlendirme), `requireAdmin()` (her admin sayfası ve server action), RLS `is_admin()`
- `createAdminClient()` (secret key, RLS'i aşar) sadece: `/submit` server action'ı (Turnstile doğrulandıktan sonra) ve `scripts/`
- Oyun linkleri her zaman dışarı açılır (`/go/[slug]`), iframe yok

## Görseller

Admin kapak seçtiğinde sunucu tarafında `sharp` ile WebP'ye çevrilir (kapak 600x900, hero 1920x620) ve Supabase Storage `covers` bucket'ına yüklenir. Sayfalarda `next/image`; Vercel önbelleklediği için Supabase egress düşük kalır.

## Önbellek

`cacheComponents` açık. Herkese açık veriler `"use cache"` + `cacheTag("games")` ile önbelleklenir; admin değişikliklerinden sonra `revalidateTag` çağrılır.

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
    supabase/        client.ts, server.ts, proxy.ts
    data/            okuma fonksiyonları (games.ts, taxonomy.ts)
    actions/         server action'lar
    auth.ts, env.ts, env.server.ts
  types/database.ts  supabase gen types çıktısı
scripts/             collect.ts, check-links.ts (Faz 2)
supabase/            migrations/, seed.sql, config.toml
```
