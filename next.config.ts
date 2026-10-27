import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // OG images read these with fs at runtime; make sure Vercel ships them with those routes.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/*.ttf"],
    "/games/*/opengraph-image": ["./assets/fonts/*.ttf"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "cdn2.steamgriddb.com" },
    ],
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
