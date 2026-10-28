import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /go/ counts Play clicks; crawlers following it would inflate the Popular ranking.
      // /login stays crawlable: every page links to it, and Google only drops it if it can read its noindex.
      disallow: ["/admin", "/api/", "/go/", "/auth/", "/profile"],
    },
    sitemap: ["/sitemap.xml", "/feed.xml"].map(
      (path) => new URL(path, env.NEXT_PUBLIC_SITE_URL).href,
    ),
  };
}
