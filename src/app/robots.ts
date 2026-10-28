import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /go/ counts Play clicks; crawlers following it would inflate the Popular ranking.
      disallow: ["/admin", "/api/", "/go/", "/login", "/auth/", "/profile"],
    },
    sitemap: new URL("/sitemap.xml", env.NEXT_PUBLIC_SITE_URL).href,
  };
}
