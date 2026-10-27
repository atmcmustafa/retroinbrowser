import type { MetadataRoute } from "next";
import { getCatalogCounts, getSitemapGames } from "@/lib/data/games";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import { env } from "@/lib/env";

const absolute = (path: string) => new URL(path, env.NEXT_PUBLIC_SITE_URL).href;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [games, counts, genres, platforms] = await Promise.all([
    getSitemapGames(),
    getCatalogCounts(),
    getGenres(),
    getPlatforms(),
  ]);
  // Dates come from the data: new Date() isn't allowed while prerendering.
  const latest = games[0]?.updated_at;

  return [
    { url: absolute("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: absolute("/games"), lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/new"), lastModified: latest, changeFrequency: "daily", priority: 0.7 },
    { url: absolute("/popular"), changeFrequency: "daily", priority: 0.7 },
    ...games.map(({ slug, updated_at }) => ({
      url: absolute(`/games/${slug}`),
      lastModified: updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...genres
      .filter(({ id }) => counts.genres[id])
      .map(({ slug }) => ({
        url: absolute(`/genres/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ...platforms
      .filter(({ id }) => counts.platforms[id])
      .map(({ slug }) => ({
        url: absolute(`/platforms/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    { url: absolute("/submit"), changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/about"), changeFrequency: "yearly", priority: 0.3 },
    { url: absolute("/dmca"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
