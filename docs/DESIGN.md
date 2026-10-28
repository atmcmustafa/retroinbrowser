# Tasarım kuralları

Referans: `screenshots-example/` (RecompLauncher). Hedef: sade, hızlı taranan, kapak görsellerinin rengi taşıdığı bir arayüz.

## Yapma

- Gradient (tek istisna: hero görselinin üstünde metin okunurluğu için koyu overlay)
- Mor, neon, glow, blur/glassmorphism, büyük gölgeler
- Emoji, "🚀 Discover amazing games!" tarzı pazarlama dili
- Uzun paragraflar. Sayfa açıklaması tek cümle, bilgi kutuları en fazla iki cümle
- Giriş animasyonları, parallax. Sadece hover/focus geçişleri (150ms)

## Renkler (`src/app/globals.css`)

| Token         | Değer     | Tailwind                                    | Kullanım                                                             |
| ------------- | --------- | ------------------------------------------- | -------------------------------------------------------------------- |
| background    | `#0a101c` | `bg-background`                             | Sayfa                                                                |
| surface       | `#0f1726` | `bg-surface`, `bg-card`, `bg-popover`       | Kart, kutu, input                                                    |
| surface-hover | `#142036` | `bg-surface-hover`, `bg-muted`, `bg-accent` | Hover                                                                |
| border        | `#1e2a3e` | `border-border`, `border-input`             | 1px kenarlık                                                         |
| foreground    | `#e8edf5` | `text-foreground`                           | Metin                                                                |
| muted         | `#8b97ab` | `text-muted-foreground`                     | İkincil metin                                                        |
| accent        | `#2de2d0` | `bg-primary`, `text-primary`, `ring-ring`   | Sadece: ana CTA, aktif menü alt çizgisi, seçili kenar, küçük ikonlar |

shadcn adlandırması: vurgu rengi `primary`'dir. shadcn'in `accent` ve `muted` token'ları nötr hover/arka plan yüzeyidir; teal için kullanma. Site tek koyu tema, `<html>`'de `dark` sınıfı sabit.

Platform renkleri veritabanında (`platforms.color`), kartlarda küçük nokta olarak.

## Tipografi

- Başlık: Archivo, `font-display`, 800, geniş (`font-stretch: 125%`), sıkı tracking
- Gövde: Inter
- Ölçek: sayfa başlığı 48-56px, bölüm başlığı 24px, kart başlığı 14px semibold, alt bilgi 12px

## Bileşenler

- **Üst menü:** logo, linkler (Discover, All games, Popular, New), sağda arama ikonu, Discord, "Submit a game" (outline), tek dolu accent buton **Sign in**; giriş yapınca yerine avatar menüsü (Profile, Admin, Sign out). Aktif link: yuvarlak surface arka plan + accent alt çizgi
- **Oyun kartı:** 2:3 dikey kapak, radius 12px (`rounded-card`), 1px border. Sol üst: sıra numarası (sadece popular). Sağ üst: küçük rozet grubu (mobil, gamepad, kendi dosya). Altında: port adı (14px semibold), orijinal oyun (12px muted), platform noktası + adı. Hover: hafif yukarı kayma + border açılır
- **Yatay satır:** başlık + `>` ile tümünü gör; masaüstünde 7 kart, mobilde yatay kaydırma
- **Tür kartı:** ikon kutusu + ad + sağda sayı rozeti; 4 sütun ızgara
- **Filtre chip'leri:** yuvarlak, seçili olan dolu açık renk
- **Arama paleti:** ortada modal, boşken "Popular" listesi, sonuçlarda küçük kapak + ad + orijinal oyun · platform
- **Bilgi kutusu:** surface + border, üstte küçük accent büyük harf etiket ("NO GAME FILES HERE")

## Düzen

- İçerik genişliği `max-w-6xl`, yatay padding mobilde 16px
- Bölümler arası 48-64px boşluk
- Her sayfa 375px genişlikte yatay kaydırma olmadan çalışmalı
- Klavye ile tamamen gezilebilir, görünür focus halkası (accent)
