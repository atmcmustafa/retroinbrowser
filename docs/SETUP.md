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
6. Authentication → Sign In / Providers: Email varsayılan açık. GitHub ve Discord sonra (aşağıda)
   - Varsayılan e-posta servisi sadece organizasyon ekibindeki adreslere ve düşük saatlik limitle gönderir. Admin girişi için yeterli; herkese açık girişten önce Authentication → Emails → SMTP ile kendi servisini bağla
7. Authentication → URL Configuration: Site URL `https://retroinbrowser.com`, Redirect URLs'e `http://localhost:3000/**` ve `https://retroinbrowser.com/**`

## 3. OAuth uygulamaları

- **GitHub:** Settings → Developer settings → OAuth Apps. Callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
- **Discord:** discord.com/developers → New Application → OAuth2. Aynı callback URL
- Client ID / Secret'ları Supabase provider ayarlarına gir

## 4. Kendini admin yap

Siteye bir kez giriş yaptıktan sonra SQL Editor'da:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '<senin-epostan>');
```

## 5. Cloudflare

1. Add a site → retroinbrowser.com, Free plan
2. Domaini aldığın yerde nameserver'ları Cloudflare'in verdikleriyle değiştir
3. Turnstile → Add widget (hostname: retroinbrowser.com, localhost). Site key ve secret key'i env'e yaz
   - Widget görünmüyor ve konsolda `[Cloudflare Turnstile] Error: 110200` varsa o hostname widget'ın listesinde yok: Turnstile → widget → Hostname Management'e ekle
   - Otomatik testlerde Cloudflare'in test anahtarları: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA` (her zaman geçer)
4. İletişim adresi `retroinbrowser@gmail.com` (`src/lib/site.ts`). Domain adresi istenirse Email Routing ile `contact@retroinbrowser.com` → bu adres yönlendirilip `contactEmail` değiştirilebilir

## 6. Vercel

1. GitHub'a push et, Vercel → Import project
2. Environment Variables: `.env.local`'daki her şey, `NEXT_PUBLIC_SITE_URL=https://retroinbrowser.com`. `REVALIDATE_SECRET` için canlıda yeni bir değer üret (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`); script'ler canlıyı yenilerken bunu kullanır
3. Domains → retroinbrowser.com ekle. Vercel'in verdiği A/CNAME kayıtlarını Cloudflare DNS'e **DNS only** (gri bulut) olarak gir

## 7. SteamGridDB

steamgriddb.com → giriş → Preferences → API → key'i `STEAMGRIDDB_API_KEY` olarak ekle
