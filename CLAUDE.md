# RetroInBrowser

Tarayıcıya portlanmış klasik oyunların dizini. Oyun barındırmaz, port sitelerine yönlendirir. Canlı: https://retroinbrowser.com

@AGENTS.md

## Önce oku

- `docs/SCOPE.md` — ne yapıyoruz, ne yapmıyoruz
- `docs/ROADMAP.md` — sıradaki iş; bitirdiğin maddeyi `[x]` yap
- `docs/DESIGN.md` — UI kuralları (UI işi öncesi zorunlu)
- `docs/ARCHITECTURE.md` — servisler, veri modeli, güvenlik
- [`docs/AUTOMATION.md`](docs/AUTOMATION.md) — keşif, link kontrolü, viral skor, rakip analizi (Faz 2 işi öncesi zorunlu)

## Stack

Next.js 16 (App Router, `cacheComponents`, `proxy.ts`), React 19, TypeScript, Tailwind 4, shadcn/ui (radix), Supabase (`@supabase/ssr`), zod 4, react-hook-form, nuqs, lucide-react. Deploy: Vercel Hobby. DNS/Turnstile: Cloudflare.

## Komutlar

```bash
npm run dev          # localhost:3000
npm run typecheck
npm run lint
npm run format
npm run db:new <ad>  # yeni migration dosyası
npm run db:push      # migration'ları Supabase'e uygula
npm run db:types     # src/types/database.ts'i yeniden üret
```

Bir işi bitirmeden önce `typecheck` ve `lint` temiz olmalı.

## Kod kuralları

- Yorumları minimumda tut. Hikâye anlatan, adım adım açıklayan yorum yazma; sadece koddan anlaşılmayan "neden"i yaz.
- Varsayılan Server Component. `"use client"` sadece etkileşim gereken yaprak bileşenlerde.
- Okuma: `src/lib/data/*`. Yazma: `src/lib/actions/*` server action'ları. Her action girdiyi zod ile doğrular.
- Admin action ve sayfaları `requireAdmin()` ile başlar; `proxy.ts` tek başına yeterli sayılmaz.
- `createAdminClient()` RLS'i aşar: sadece `/submit` (Turnstile sonrası), `/go` (`increment_click` anon'a kapalı) ve `scripts/` içinde.
- Auth cookie'leri HttpOnly: tarayıcıda Supabase client yok, oturumlu her çağrı server'da.
- Yeni fonksiyonlar varsayılan olarak kapalı (sadece owner ve service_role). RLS'te kullanılacak ya da herkese açık RPC olacaksa migration'da `grant execute ... to anon, authenticated`. Anon'un tablolara yazma yetkisi yok (yeni tablolar dahil).
- Yeni bir dış script, iframe ya da görsel kaynağı ekleyince `next.config.ts`'teki CSP'yi güncelle.
- Supabase Auth ayarları `supabase/config.toml`'da: değiştirince `npm run db:config -- diff`, sonra `-- push --yes`. Panelden değiştirme, dosya ile kayar.
- Herkese açık veri `"use cache"` + `cacheTag`; admin değişikliğinden sonra server action'da `updateTag`. Script/SQL ile veri değiştiren her iş sonunda `/api/revalidate`'i çağırır (`scripts/lib/revalidate.ts`), yoksa site 1 saate kadar eski veriyi gösterir.
- Filtre/arama durumu URL'de (nuqs), local state'te değil.
- Şema değişikliği sadece yeni migration dosyasıyla; eski migration'ı düzenleme. Sonra `npm run db:types`.
- Supabase tipleri `src/types/database.ts`'ten; elle tip kopyalama.
- Env değişkenlerine `src/lib/env.ts` / `env.server.ts` üzerinden eriş.

## Subagent kullanımı

Gerektiğinde subagent kullan: bağımsız paralel işler, web araştırması, geniş kod araması ve migration/RLS gibi kritik değişikliklerin kodu yazmamış bir agent tarafından incelenmesi. Tek dosyalık işlerde kullanma. Ayrıntı: `docs/AUTOMATION.md` son bölüm.

## UI kuralları (özet, detay DESIGN.md)

- Site metinleri İngilizce, kısa. Sayfa açıklaması tek cümle.
- Gradient, mor, glow, emoji, giriş animasyonu yok.
- Accent rengi sadece ana CTA, aktif durum ve küçük ikonlarda.
- Her sayfa 375px'te düzgün, klavyeyle gezilebilir.

## Yapma

- Oyun dosyası barındırma, iframe ile oyun gömme
- Yeni bağımlılık eklemeden önce mevcut stack'le çözülebiliyor mu bak
- `.env*` dosyalarını commit etme (`.env.example` hariç)
