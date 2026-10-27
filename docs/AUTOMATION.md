# Otomasyon: keşif, doğrulama, güncellik

Faz 2'nin tasarımı. Amaç: viral bir portu aynı gün listeye almak ve kapanan/bozulan portu bir gün içinde fark etmek.

> **İnceleme notu (27 Ekim):** Aşağıdaki planın iki yeri bu hedeflerle çelişiyor: günde tek keşif (bkz. 1. bölüm) ve günde tek kontrol + `fail_streak ≥ 2` (bkz. 4. bölüm). Notlar ilgili bölümlerde.

## Rakip analizi (Ekim 2026)

|           | portedgames.com                                 | recompiledgames.com                              |
| --------- | ----------------------------------------------- | ------------------------------------------------ |
| Kapsam    | 156 port (64 tarayıcı)                          | 44 proje                                         |
| Güncellik | Günlük script her linke istek atar              | "Son link kontrolü" tarihi, sıklık belirtilmemiş |
| Durumlar  | Working / Slow / Unreleased / Down / Taken down | Up / down                                        |
| Ekleme    | Toplu, günde 4-42 kayıt, şablonlu sayfalar      | Öneri formu                                      |
| Gecikme   | Viral olduktan 1-7 gün sonra                    | Bilinmiyor                                       |
| Topluluk  | Yok                                             | Yeni oyun e-posta bildirimi                      |

Çıkarımlar:

- Link kontrolü büyük ihtimalle sadece HTTP yanıtına bakıyor. İçeriği değiştirilmiş (GTA V portu) veya sadece Play butonu olan sayfalar "çalışıyor" görünür.
- "Taken down" ve "Played by us" elle giriliyor; bir DMCA 7 gün geç işaretlenmiş.
- Sayfa hacmi ve şablon birliği, yapay zeka ile taslak + insan onayı akışına işaret ediyor.
- İkisinde de hesap, yorum, "bende çalışıyor mu" bildirimi ve popülerlik sıralaması yok. **Farkımız bu.**

Kural: rakip sitelerin listelerini kazıma veya kopyalama. Keşif birincil kaynaklardan yapılır.

## Akış

```
[kaynaklar] → collect → candidates + candidate_mentions
                            ↓
                         extract (LLM) → candidates.extracted
                            ↓
                  skor ≥ eşik → Discord bildirimi
                            ↓
              /admin/candidates → tek tık onay → games (draft/published)

games (published) → check-links (günlük) → link_checks + games.link_status
                  → smoke (haftalık, Playwright) → ekran görüntüsü
```

## 1. Keşif (`scripts/collect.ts`)

Her kaynak `scripts/sources/<ad>.ts` içinde, aynı arayüzü döner:

```ts
type Mention = {
  url: string;
  title: string;
  source: "hackernews" | "googlenews" | "reddit" | "github";
  sourceRef: string;
  points?: number;
  seenAt: string;
};
```

| Kaynak      | Uç nokta                                                                                | Sorgular / filtre                                                                        | Anahtar                            |
| ----------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- |
| Hacker News | `hn.algolia.com/api/v1/search_by_date?tags=story&query=…&numericFilters=created_at_i>…` | "in the browser", "WebAssembly port", "recompiled", "decompilation", "runs in browser"   | Yok                                |
| Google News | `news.google.com/rss/search?q=…&hl=en-US&gl=US&ceid=US:en`                              | `"playable in browser"`, `"browser port"`, `"in your browser" game`                      | Yok                                |
| Reddit      | `oauth.reddit.com/r/<sub>/search?restrict_sr=1&sort=new&t=week&q=…`                     | r/emulation, r/WebGames, r/pcgaming, r/retrogaming, r/gamedev, r/programming             | Reddit app (script tipi, ücretsiz) |
| GitHub      | `api.github.com/search/repositories?q=…+created:>…&sort=stars`                          | `webassembly game port`, `recomp wasm`, `decomp browser`, `topic:webassembly topic:game` | Actions'taki `GITHUB_TOKEN`        |

Kurallar:

- Haberden gelen linkte port adresi yoksa haber sayfası `source_ref` olur, `url` boş bırakılmaz: haber URL'si aday olur, extract adımı asıl port linkini bulmaya çalışır.
- URL normalize (`scripts/lib/normalize-url.ts`): küçük harf host, `www.` ve sondaki `/` kaldır, `utm_*`/`ref`/`fbclid` parametrelerini sil, `http` → `https` (sadece https çalışıyorsa).
- Aynı normalize URL tekrar gelirse yeni aday açılmaz, `candidate_mentions`'a satır eklenir.
- Yayındaki bir oyunun `play_url`'iyle eşleşen veya `title` benzerliği (`pg_trgm similarity > 0.6`) yüksek aday `duplicate` olur.
- X/Twitter API ücretli, kullanılmıyor. Viral olan içerik 1-2 gün içinde HN'e veya haberlere düşüyor.

> **İnceleme notu — keşif sıklığı:** `collect` günde bir (06:15 UTC) çalışırsa öğlen viral olan port ertesi sabah bulunur; "aynı gün" hedefi tutmaz. `collect` + `extract` 4-6 saatte bir ayrı bir workflow'da çalışsın (public repoda Actions dakikası sorun değil), `check-links` günlük kalabilir.
>
> **İnceleme notu — Google News:** RSS'teki `<link>` haberin kendisi değil, `news.google.com/rss/articles/…` yönlendirme sarmalayıcısı. Haber URL'sine ulaşmak için ayrı bir çözme adımı gerekir (yönlendirmeyi takip etmek her zaman yetmiyor). Çözülemezse `source_ref` olarak sarmalayıcı saklanır, `extract` haber sayfasını açamaz; bu kaynak en son eklenmeli.

## 2. Bilgi çıkarma (`scripts/extract.ts`)

- `pending` ve `extracted is null` adaylar için sayfa HTML'i (+ varsa GitHub README) alınır, metne çevrilir, 20k karakterle kırpılır.
- LLM'e zod şemasıyla yapılandırılmış çıktı istenir:
  `is_playable_browser_port, title, original_title, platform_slug, genre_slugs[], developer, summary (≤280), tech, requires_own_files, mobile_support, gamepad_support, source_url, confidence (0-1)`
- Model: ucuz/hızlı bir model (Claude Haiku veya Gemini Flash). Key `LLM_API_KEY`, sağlayıcı `LLM_PROVIDER`.
- `is_playable_browser_port = false` ve `confidence > 0.8` ise aday otomatik `rejected` olur, sebep `note`'a yazılır.
- Admin formu `extracted` ile dolu açılır. LLM çıktısı asla doğrudan yayına girmez.

## 3. Viral skoru

Son 7 gün içindeki mention'lardan:

```
score = 3·(HN story sayısı) + log10(1 + HN puanı)
      + 2·(farklı haber domaini sayısı)
      + log10(1 + Reddit upvote toplamı)
      + log10(1 + GitHub yıldızı)
```

- `score ≥ 5` → `DISCORD_WEBHOOK_URL`'e bildirim (başlık, skor, kaynaklar, admin linki).
- Yayındaki oyunlar için aynı skor `games.trend_score` olarak güncellenir; ana sayfadaki **Trending** satırı `trend_score` + son 7 gün tıklama ile sıralanır.

## 4. Link kontrolü (`scripts/check-links.ts`, günlük)

Her `published` oyun için tek GET (timeout 15 sn, eşzamanlılık 4, User-Agent `RetroInBrowserBot/1.0 (+https://retroinbrowser.com/about)`). Sonuç `link_checks`'e yazılır, karar `games`'e işlenir:

| Sinyal                                                                                      | Karar                                                |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 2xx, sayfa başlığı ve parmak izi aynı                                                       | `ok`                                                 |
| 2xx ama yanıt > 8 sn                                                                        | `slow`                                               |
| 451, veya gövdede `DMCA`, `unavailable for legal reasons`, `taken down`, `cease and desist` | `taken_down` adayı → admin onayı + Discord bildirimi |
| Farklı domaine yönlendirme, park sayfası, başlık tamamen değişti                            | `changed` → admin incelemesi, otomatik karar yok     |
| 4xx/5xx, DNS/TLS hatası, timeout                                                            | `fail_streak += 1`; `fail_streak ≥ 2` → `broken`     |
| Tekrar 2xx                                                                                  | `fail_streak = 0`, `last_ok_at = now()`              |

Parmak izi: `<title>` + ilk 2 KB görünür metnin normalize edilmiş SHA-256'sı. İlk başarılı kontrolde kaydedilir.

`broken` ve `taken_down` oyunlar listeden kalkmaz; kartta durum rozetiyle gösterilir, sıralamada en sona düşer. Değişiklik olduğunda `revalidateTag("games", "max")` çağrılır (script, Vercel'de bir revalidate route'una secret ile istek atar).

> **İnceleme notu — "bir gün içinde" hedefi:** Günde tek kontrol ve `fail_streak ≥ 2` ile kırık link en erken 2 günde `broken` olur. Öneri: başarısız linkler aynı çalıştırmanın sonunda ~10 dk sonra bir kez daha denensin; ikisi de başarısızsa `fail_streak` 2 sayılır. Tek seferlik ağ hatası yine `broken` yapmaz (kabul kriteri korunur).
>
> **İnceleme notu — parmak izi:** WebAssembly/canvas portlarında görünür metin çoğu zaman boş ya da "Loading…" olur; parmak izi ya anlamsız kalır ya da her sürümde değişir ve sahte `changed` üretir. `changed` kararı son domain + `<title>` değişimine dayansın, parmak izi sadece yardımcı sinyal olsun.
>
> **İnceleme notu — DMCA araması:** `DMCA` kelimesi birçok sitenin footer linkinde geçer. Aramayı `<title>`, `<h1>` ve ana metinle sınırla (nav/footer hariç) ya da 451'e öncelik ver. Admin onayı olduğu için zarar vermez ama yanlış alarm üretir.
>
> **İnceleme notu — kaldırmalarda önbellek:** `"max"` stale-while-revalidate demek; değişiklikten sonraki ilk ziyaretçi eski sayfayı görür. `broken`/`slow` için sorun değil, ama admin onaylı `taken_down` için route `revalidateTag("games", { expire: 0 })` kullansın (hukuki bildirimler gecikmemeli).

## 5. Haftalık smoke test (`scripts/smoke.ts`)

GitHub Actions'ta Playwright (Chromium) ile her oyunun sayfası açılır, 10 sn beklenir:

- Ekran görüntüsü (1280x720, WebP) Storage'a `smoke/<slug>.webp` olarak yüklenir, `games.screenshot_url/at` güncellenir.
- Konsol hataları ve `canvas` elementi olup olmadığı `link_checks.details`'e yazılır.
- Admin panelinde oyun başına son ekran görüntüsü gösterilir: rakiplerin elle yaptığı "played by us" kontrolünün yarı otomatik hali.
- WebGPU isteyen sayfalar headless'ta açılmayabilir; bu durumda karar verilmez, sadece görüntü saklanır.

## 6. Topluluk doğrulaması (Faz 3)

Oyun sayfasında "Works for me / Doesn't work" + otomatik doldurulan cihaz (desktop/phone/tablet), tarayıcı, işletim sistemi. Son 30 günün raporları kartta "Works on phone: 12/14" gibi gösterilir. Giriş gerekir, kullanıcı başına oyun+cihaz için günde bir rapor.

## 7. Kaldırılanlar sayfası (`/takedowns`)

`link_checks` geçmişinden otomatik: oyun, ne zaman eklendi, ne zaman kaldırıldı, kaç gün açık kaldı, varsa telif sahibi ve kaynak. SEO ve haber değeri yüksek.

## Şema değişiklikleri (yeni migration)

```sql
alter type public.link_status add value 'slow';
alter type public.link_status add value 'changed';
alter type public.link_status add value 'taken_down';

alter table public.games
  add column fail_streak smallint not null default 0,
  add column last_ok_at timestamptz,
  add column page_title text,
  add column page_fingerprint text,
  add column screenshot_url text,
  add column screenshot_at timestamptz,
  add column trend_score real not null default 0,
  add column taken_down_at timestamptz;

create table public.link_checks (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games (id) on delete cascade,
  checked_at timestamptz not null default now(),
  kind text not null check (kind in ('http', 'smoke')),
  http_status smallint,
  final_url text,
  response_ms integer,
  page_title text,
  fingerprint text,
  verdict public.link_status not null,
  error text,
  details jsonb
);
create index link_checks_game_idx on public.link_checks (game_id, checked_at desc);

alter table public.candidates
  add column extracted jsonb,
  add column extracted_at timestamptz,
  add column first_seen_at timestamptz not null default now(),
  add column last_seen_at timestamptz not null default now();

create table public.candidate_mentions (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  source public.candidate_source not null,
  url text not null,
  title text,
  points integer,
  seen_at timestamptz not null default now(),
  unique (candidate_id, url)
);

-- Faz 3
create type public.device_kind as enum ('desktop', 'phone', 'tablet');
create table public.game_reports (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  works boolean not null,
  device public.device_kind not null,
  browser text,
  os text,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);
```

RLS: `link_checks` ve `candidate_mentions` sadece admin okur (scriptler secret key ile yazar). `game_reports` herkes okur, kullanıcı sadece kendi adına ekler. `candidate_source` enum'una `googlenews` eklenmeli.

> **İnceleme notu — enum ve mevcut kod:** `alter type … add value` ile eklenen değerler aynı transaction'da kullanılamaz; enum değerlerini ekleyen migration'da bu değerleri kullanan default/check/policy olmasın (gerekirse ikinci migration). Mevcut kod `link_status`'ün sadece `unknown/ok/broken` olduğunu varsayıyor: `getAdminStats` (kırık sayısı), admin oyun tablosundaki rozet ve ileride `GameCard`. Migration ile birlikte bunlar da güncellenmeli; `npm run db:types` sonrası typecheck eksikleri gösterir.
>
> **İnceleme notu — smoke görüntüleri:** `covers` bucket'ı artık sadece `image/webp` ve en fazla 2 MB kabul ediyor (migration `covers_storage`). 1280x720 WebP bu sınıra sığar; `smoke/` yolu admin'in görsel silme mantığına (`storedArtworkPath`: sadece `cover/`, `hero/`) takılmaz.

## Dosya yapısı

```
scripts/
  collect.ts          kaynakları çalıştırır, adayları yazar
  extract.ts          LLM ile alan çıkarır
  check-links.ts      günlük HTTP kontrolü
  smoke.ts            haftalık Playwright kontrolü
  sources/            hackernews.ts, googlenews.ts, reddit.ts, github.ts
  lib/                db.ts, normalize-url.ts, fingerprint.ts, classify.ts, notify.ts, score.ts
  *.test.ts           node:test + tsx (yeni test bağımlılığı yok)
.github/workflows/
  daily.yml           06:15 UTC: collect → extract → check-links
  weekly-smoke.yml    Pazar 03:30 UTC: smoke
```

`package.json`: `"collect": "tsx scripts/collect.ts"`, `"extract": …`, `"check-links": …`, `"smoke": …`, `"test:scripts": "tsx --test scripts/**/*.test.ts"`.

> **İnceleme notu — script'lerin çalıştırılması:** `src/lib`'deki server modülleri `import "server-only"` içeriyor ve düz Node'da hata veriyor. Mevcut örnek `npm run artwork` (`scripts/fill-artwork.ts`): `tsx --conditions=react-server --env-file=.env.local …` ile `server-only` boş modüle çözülür, `@/lib/steamgriddb`, `@/lib/storage` gibi modüller tekrar yazılmadan kullanılır. Supabase client'ı `scripts/lib/db.ts` (`createScriptClient`, secret key). Proje CommonJS olduğu için top-level `await` yok; `main()` kullan. Actions'ta `--env-file` yerine secret'lar env olarak verilir; `NEXT_PUBLIC_SITE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de gerekir (`env.ts` doğruluyor).

## Secret'lar (GitHub Actions + `.env.local`)

`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `LLM_PROVIDER`, `LLM_API_KEY`, `DISCORD_WEBHOOK_URL`, `REVALIDATE_SECRET`. `GITHUB_TOKEN` Actions'ta otomatik.

## Kabul kriterleri

- `normalize-url`, `classify`, `score` için birim testleri var ve geçiyor.
- Scriptler tekrar çalıştırıldığında kopya aday/mention oluşmuyor.
- Tek seferlik ağ hatası bir oyunu `broken` yapmıyor.
- `taken_down` ve `changed` kararları admin onayı olmadan herkese açık sayfada gösterilmiyor.
- Workflow'lar `workflow_dispatch` ile elle de tetiklenebiliyor.

## Claude Code için: subagent kullanımı

Gerektiğinde subagent kullan, gerekmediğinde kullanma:

- **Paralel ve bağımsız işler:** dört kaynak adaptörü (`scripts/sources/*`) ayrı dosyalar ve ortak arayüze sahip; arayüz yazıldıktan sonra paralel subagent'lara verilebilir.
- **Araştırma:** bir adayın bilgisi belirsizse (gerçek port linki, dosya gereksinimi, kaldırıldı mı) web araştırmasını subagent'a ver, sadece sonucu al.
- **Bağımsız inceleme:** yeni migration + RLS ve `classify.ts` kararları birleştirilmeden önce, kodu yazmamış bir subagent'a incelet (yetki açığı, yanlış "broken" kararı).
- **Geniş kod araması:** birçok dosyaya yayılan değişiklik öncesi etkilenen yerleri bulmak için Explore subagent'ı.
- Tek dosyalık düzenleme, küçük hata düzeltme veya zaten bilinen bir dosyaya bakmak için subagent açma.
