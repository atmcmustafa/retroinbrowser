"use client";

import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FeaturedGame } from "@/lib/data/games";
import { cn } from "@/lib/utils";

export function FeaturedHero({ games }: { games: FeaturedGame[] }) {
  const [active, setActive] = useState(0);
  const game = games[active];

  return (
    <section aria-label="Featured games" className="relative flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-surface sm:aspect-[1920/620]">
        <Image
          key={game.id}
          src={game.hero_url}
          alt=""
          fill
          sizes="(min-width: 1152px) 1120px, 100vw"
          loading={active === 0 ? "eager" : undefined}
          fetchPriority={active === 0 ? "high" : undefined}
          className="object-cover"
        />
        {/* The one allowed gradient: keeps the overlaid text readable on any artwork. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent sm:bg-linear-to-r sm:from-background/95 sm:via-background/50"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:max-w-xl sm:p-8">
          {game.platform && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ backgroundColor: game.platform.color }}
              />
              {game.platform.name} · {game.original_title}
            </p>
          )}
          <h2 className="mt-2 font-display text-3xl leading-none font-extrabold tracking-tight text-balance [font-stretch:125%] sm:text-5xl">
            <Link href={`/games/${game.slug}`} className="rounded-sm hover:underline">
              {game.title}
            </Link>
          </h2>
          {game.summary && (
            <p className="mt-3 hidden text-sm text-foreground/80 sm:line-clamp-2">{game.summary}</p>
          )}
          <div className="mt-5 flex gap-2">
            <Button asChild size="lg">
              <a href={`/go/${game.slug}`} target="_blank" rel="noopener">
                Play
                <ExternalLinkIcon data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/games/${game.slug}`}>Details</Link>
            </Button>
          </div>
        </div>
      </div>
      {games.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto sm:absolute sm:top-1/2 sm:right-4 sm:-translate-y-1/2 sm:flex-col sm:overflow-visible">
          {games.map((item, index) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Show ${item.title}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
                className={cn(
                  "relative block h-12 w-20 overflow-hidden rounded-md border-2 transition-[border-color,opacity] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  index === active
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={item.hero_url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
