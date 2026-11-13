import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Next loads .env files before this file, but src/lib/env.ts isn't imported here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
const supabase = new URL(supabaseUrl);

// Local values (localhost, Cloudflare's Turnstile test keys) build fine but send sign-ins back to
// localhost and let every bot through /submit, so a production deploy with them must not build.
// The deploy workflow sets SITE_DEPLOY.
if (process.env.SITE_DEPLOY === "production") {
  const testKey = /^[123]x0+[A-F]{2}$/;
  const problems = [
    !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") && "NEXT_PUBLIC_SITE_URL isn't https",
    testKey.test(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "") &&
      "Turnstile site key is a test key",
    testKey.test(process.env.TURNSTILE_SECRET_KEY ?? "") && "Turnstile secret is a test key",
  ].filter(Boolean);
  if (problems.length) throw new Error(`Production env looks local: ${problems.join(", ")}`);
}

// Static shells (cacheComponents) can't carry per-request nonces, so inline scripts stay allowed;
// the policy still pins script and frame sources and blocks framing, plugins and <base>.
// No form-action: Chrome applies it to every redirect after a form post, and the OAuth sign-in
// form redirects through Supabase to Google or Discord.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Admin previews load stored covers and SteamGridDB thumbnails directly; avatars come from
  // the sign-in providers' CDNs (same hosts as profiles_avatar_url_check).
  `img-src 'self' data: blob: ${supabase.origin} https://cdn2.steamgriddb.com https://*.googleusercontent.com https://cdn.discordapp.com https://avatars.githubusercontent.com`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // A matching user agent skips the static page and gets a full render on every request, more
  // CPU than a free Workers request allows. Every public page is built on deploy with its
  // metadata in <head>, so no crawler or link preview needs one; this pattern matches no one.
  htmlLimitedBots: /^RetroInBrowser-no-blocking-render$/,
  images: {
    // Each width is its own transformation, and every width lands in each card's srcset; the
    // defaults (15 widths) made the home page HTML 400 KB. These cover the sizes props in use
    // (32 px thumbnails to the 1120 px hero) at 1x to 3x.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    // Resized by Cloudflare at the edge (src/lib/image-loader.ts). Only the Supabase host is an
    // allowed source in the zone's settings, so nobody else's images go through our quota.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    // Paged lists moved from ?page=N to /page/N; the old links may already be indexed.
    const page = { type: "query" as const, key: "page", value: "(?<page>[2-9]|[1-9]\\d+)" };
    const pages = ["/popular", "/new", "/genres/:slug", "/platforms/:slug"].map((source) => ({
      source,
      has: [page],
      destination: `${source}/page/:page`,
      permanent: true,
    }));
    const www = {
      source: "/:path*",
      has: [{ type: "host" as const, value: "www.retroinbrowser.com" }],
      destination: "https://retroinbrowser.com/:path*",
      permanent: true,
    };
    return [www, ...pages];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
