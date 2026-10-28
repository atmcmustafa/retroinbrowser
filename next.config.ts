import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Next loads .env files before this file, but src/lib/env.ts isn't imported here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
const supabase = new URL(supabaseUrl);

// Static shells (cacheComponents) can't carry per-request nonces, so inline scripts stay allowed;
// the policy still pins script and frame sources and blocks framing, plugins and <base>.
// No form-action: Chrome applies it to every redirect after a form post, and the OAuth sign-in
// form redirects through Supabase to Google or Discord.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Admin previews load stored covers and SteamGridDB thumbnails directly.
  `img-src 'self' data: blob: ${supabase.origin} https://cdn2.steamgriddb.com`,
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
  // OG images read these with fs at runtime; make sure Vercel ships them with those routes.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/*.ttf"],
    "/games/*/opengraph-image": ["./assets/fonts/*.ttf"],
  },
  images: {
    // Every optimized image counts against Vercel's monthly quota, so only our own bucket is
    // allowed; a wildcard would let anyone run other images through /_next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabase.hostname,
        port: "",
        pathname: "/storage/v1/object/public/covers/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
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
