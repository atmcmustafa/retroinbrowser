import { serverEnv } from "@/lib/env.server";
import { fetchJson } from "../lib/http";
import type { Mention, Source } from "./types";

const queries = [
  "browser port game",
  "webassembly game port",
  "wasm port game",
  "emscripten port game",
  "decompilation webassembly",
  "recompilation webassembly",
  "topic:webassembly topic:game",
];

// New repos below this have rarely been shared anywhere yet; they come back once they pick up stars.
const MIN_STARS = 10;

type Repo = {
  html_url: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  created_at: string;
  fork: boolean;
  archived: boolean;
};

export const github: Source = async (since) => {
  const headers: Record<string, string> = { "X-GitHub-Api-Version": "2022-11-28" };
  if (serverEnv.GITHUB_TOKEN) headers.Authorization = `Bearer ${serverEnv.GITHUB_TOKEN}`;
  const created = since.toISOString().slice(0, 10);

  const mentions: Mention[] = [];
  for (const query of queries) {
    const params = new URLSearchParams({
      q: `${query} created:>=${created} stars:>=${MIN_STARS}`,
      sort: "stars",
      order: "desc",
      per_page: "30",
    });
    const { items } = await fetchJson<{ items: Repo[] }>(
      `https://api.github.com/search/repositories?${params}`,
      headers,
    );
    for (const repo of items) {
      if (repo.fork || repo.archived) continue;
      // The homepage is often the playable build (GitHub Pages); the extractor checks either way.
      const homepage = repo.homepage && /^https?:\/\//i.test(repo.homepage) ? repo.homepage : null;
      mentions.push({
        url: homepage ?? repo.html_url,
        title: repo.description ? `${repo.full_name}: ${repo.description}` : repo.full_name,
        source: "github",
        sourceRef: repo.html_url,
        points: repo.stargazers_count,
        seenAt: repo.created_at,
      });
    }
  }
  return mentions;
};
