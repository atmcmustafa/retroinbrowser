# Kurulum (bir kerelik, elle)

## 1. Yerel

```bash
npm install
cp .env.example .env.local
```

## 2. Supabase

1. supabase.com → New project (bölge: Frankfurt `eu-central-1`)
2. Project Settings → API Keys: URL, publishable key ve secret key'i `.env.local`'a yaz
3. Şemayı yükle:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```
4. Seed: `npx supabase db push --linked --include-seed` (ya da SQL Editor'da `supabase/seed.sql`)
5. Storage → New bucket: `covers`, **public**
6. Auth ayarları (sağlayıcılar, URL'ler, CAPTCHA) `supabase/config.toml`'da tutulur ve CLI ile uygulanır; panelden değiştirme, dosya ile kayar:
   ```bash
   npm run db:config -- diff         # canlı proje ile farklar
   npm run db:config -- push --yes   # config.toml'u uygular
   ```
   Komut `config.toml`'un `env(...)` ile okuduğu anahtarları `.env.local`'dan alır, başka bir şey geçirmez.
   - Varsayılan e-posta servisi sadece organizasyon ekibindeki adreslere ve düşük saatlik limitle gönderir. Admin girişi için yeterli; e-postayla herkese açık girişten önce Authentication → Emails → SMTP ile kendi servisini bağla
7. URL'ler (`config.toml` `[auth]`): Redirect URLs `http://localhost:3000/**`, `https://retroinbrowser.com/**` (uygulandı). Site URL şimdilik `http://localhost:3000`; canlıya alırken `https://retroinbrowser.com` yap ve push et

## 3. OAuth (Google, Discord)

İki uygulamada da callback URL: `https://wnumnhogqurumgeejnvb.supabase.co/auth/v1/callback`

**Google** ([console.cloud.google.com](https://console.cloud.google.com/auth/overview)):

1. Yeni proje → Google Auth Platform → Get started: uygulama adı `RetroInBrowser`, destek e-postası `retroinbrowser@gmail.com`, Audience **External**
2. Data Access: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. Başka scope ekleme, Google incelemesi ister
3. Clients → Create client → **Web application**
   - Authorized JavaScript origins: `https://retroinbrowser.com`, `http://localhost:3000`
   - Authorized redirect URIs: yukarıdaki callback URL
4. Audience → **Publish app**. "Testing" durumunda sadece eklenen test kullanıcıları girebilir
5. Client ID ve Client secret'ı al

**Discord** ([discord.com/developers/applications](https://discord.com/developers/applications)):

1. New Application → `RetroInBrowser`
2. OAuth2 → Redirects → callback URL → Save Changes
3. Client ID'yi kopyala; Reset Secret → Client Secret'ı kopyala

**Supabase'e işlemek:** dört değeri `.env.local`'a yaz (`SUPABASE_AUTH_EXTERNAL_*`, `.env.example`), `supabase/config.toml`'da `[auth.external.google]` / `[auth.external.discord]` altında `enabled = true` yap, sonra 2.6'daki `diff` ve `push`. `/login` butonları birkaç dakika içinde çıkar; Supabase'de açık olan sağlayıcılardan okunur. Bu anahtarlar Vercel'e girmez, uygulama kullanmıyor.

Aynı doğrulanmış e-postayla gelen Google/Discord hesabı mevcut kullanıcıya bağlanır (admin dahil).

**CAPTCHA (e-posta girişi):** `config.toml` `[auth.captcha]` → `enabled = true` ve push. Supabase token'ı `SUPABASE_AUTH_CAPTCHA_SECRET` (gerçek widget'ın secret'ı) ile doğrular. Açıkken token'sız ya da test widget'ından gelen `signInWithOtp`/`signUp` istekleri reddedilir: localde e-posta girişi çalışmaz, localde Google/Discord ile gir. Google/Discord girişi admin hesabına bağlanmadan açma.

## 4. Kendini admin yap

Siteye bir kez giriş yaptıktan sonra SQL Editor'da:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '<senin-epostan>');
```

## 5. Cloudflare

1. Add a site → retroinbrowser.com, Free plan
2. Domaini aldığın yerde nameserver'ları Cloudflare'in verdikleriyle değiştir
3. Turnstile → Add widget (hostname: retroinbrowser.com). Gerçek anahtarlar Vercel'e (`.env.vercel`), secret ayrıca `.env.local`'da `SUPABASE_AUTH_CAPTCHA_SECRET` olarak
   - Production widget'ı `localhost` kabul etmiyor. `.env.local`'da Cloudflare'in test anahtarları: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`. Test secret'ı sadece test widget'ının sahte token'ını kabul eder, `src/lib/turnstile.ts` de `example.com` hostname'ini sadece test secret'ıyla geçirir
   - Widget görünmüyor ve konsolda `[Cloudflare Turnstile] Error: 110200` varsa o hostname widget'ın listesinde yok: Turnstile → widget → Hostname Management'e ekle
4. İletişim adresi `retroinbrowser@gmail.com` (`src/lib/site.ts`). Domain adresi istenirse Email Routing ile `contact@retroinbrowser.com` → bu adres yönlendirilip `contactEmail` değiştirilebilir

## 6. Vercel

1. GitHub'a push et, Vercel → Import project
2. Environment Variables: `.env.vercel`'in içeriğini olduğu gibi yapıştır (Vercel .env metnini kendisi böler). Dosya gitignore'da; canlı değerler bunlar: `NEXT_PUBLIC_SITE_URL=https://retroinbrowser.com`, gerçek Turnstile anahtarları, localdekinden farklı bir `REVALIDATE_SECRET` (script'ler canlıyı yenilerken bunu kullanır). `SUPABASE_AUTH_*` Vercel'e girmez, onları sadece CLI okur
   - Bölge `vercel.json`'da (`fra1`, Supabase Frankfurt'ta), panelden ayarlamak gerekmez
3. Domains → retroinbrowser.com ekle. Vercel'in verdiği A/CNAME kayıtlarını Cloudflare DNS'e **DNS only** (gri bulut) olarak gir

## 7. SteamGridDB

steamgriddb.com → giriş → Preferences → API → key'i `STEAMGRIDDB_API_KEY` olarak ekle
