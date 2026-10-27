# Proje kapsamı

RetroInBrowser: tarayıcıya portlanmış klasik oyunları tek yerde toplayan, filtrelenebilir bir dizin. Oyun barındırmaz, sadece portun kendi sitesine yönlendirir.

Site arayüzü İngilizce (kitle global). Kod, commit ve dokümanlar serbest.

## Faz 1 — MVP (canlıya çıkış)

### Herkese açık sayfalar

| Route                                 | İçerik                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Hero (öne çıkan oyunlar, thumbnail ile geçiş), tür ızgarası, yatay satırlar: Popular, New, her tür; "Browse by platform" chip'leri; kısa "No game files here" kutusu |
| `/games`                              | Arama + filtreler (tür, orijinal platform, mobil, gamepad, kendi dosyanı gerektirir). Filtre durumu URL'de (nuqs). Grid + sayfalama                                  |
| `/games/[slug]`                       | Kapak, hero görsel, port adı, orijinal oyun, platform, rozetler, kısa açıklama, **Play** butonu (`/go/[slug]`), kaynak/GitHub linki, benzer oyunlar                  |
| `/go/[slug]`                          | Route handler: tıklamayı sayar (`increment_click`), port sitesine 302 yönlendirir                                                                                    |
| `/popular`, `/new`                    | Sıralı grid (popülerde sıra numarası rozetli)                                                                                                                        |
| `/platforms/[slug]`, `/genres/[slug]` | Filtrelenmiş grid                                                                                                                                                    |
| `/submit`                             | Oyun öner formu: URL + not. Turnstile doğrulaması, sonuç `candidates` tablosuna `source=user`                                                                        |
| `/about`, `/dmca`                     | Kısa metin, kaldırma talebi iletişimi                                                                                                                                |
| `/login`                              | E-posta ile giriş. GitHub ve Discord sonra eklenecek                                                                                                                 |
| Arama                                 | Üst menüde ⌘K / Ctrl+K komut paleti                                                                                                                                  |
| SEO                                   | `sitemap.ts`, `robots.ts`, oyun sayfaları için dinamik OG görseli ve metadata                                                                                        |

### Admin paneli (`/admin`, sadece `role = admin`)

| Route               | İçerik                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/admin`            | Özet: yayındaki oyun, bekleyen aday, kırık link sayıları                                                    |
| `/admin/candidates` | Onay kuyruğu. Onayla → bilgileri dolu oyun formu açılır; Reddet; Kopya işaretle                             |
| `/admin/games`      | Tablo (arama, durum filtresi, sıralama). Oluştur/düzenle formu: türler, platform, rozetler, featured, durum |
| Kapak seçimi        | Formda SteamGridDB araması → seçilen görsel WebP'ye çevrilip Supabase Storage'a yüklenir                    |
| `/admin/taxonomy`   | Platform ve tür ekle/düzenle/sırala                                                                         |

## Faz 2 — Otomasyon

- `scripts/collect.ts`: Hacker News (Algolia API), Reddit, GitHub Search'ten aday toplar. URL normalize edilir, `candidates.url` unique olduğu için tekrarlar düşer, yayındaki oyunlarla eşleşenler `duplicate` olur.
- `scripts/check-links.ts`: yayındaki oyunların linklerini kontrol eder, `link_status` ve `last_checked_at` günceller.
- İkisi de GitHub Actions cron ile günde bir çalışır, secret key ile yazar. Yan etki: Supabase free projesi her gün aktif kaldığı için uykuya düşmez.
- Opsiyonel: adaylara LLM ile "gerçekten tarayıcıda oynanan port mu" skoru (`candidates.score`).

## Faz 3 — Topluluk

- Oyun başına yorumlar ve 1-5 puan (tablolar şemada hazır)
- "Mobilde çalışıyor mu" kullanıcı raporları
- Profil sayfası

## Kapsam dışı

- Oyun dosyası barındırmak, iframe ile gömmek
- Tam forum, özel mesaj
- Reklam ve ödeme (Vercel Hobby ticari kullanıma izin vermiyor)
- Çoklu dil (ileride `next-intl` ile eklenebilir)
