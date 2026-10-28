import Image from "next/image";
import Link from "next/link";
import { badgesFor } from "@/components/site/game-badges";
import type { GameCardData } from "@/lib/data/games";

// Default sizes fit the 7-up rows; grids pass their own.
export function GameCard({
  game,
  rank,
  note,
  sizes = "(min-width: 1152px) 152px, (min-width: 768px) 14vw, 144px",
}: {
  game: GameCardData;
  rank?: number;
  note?: string;
  sizes?: string;
}) {
  const shown = badgesFor(game);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-card border bg-surface transition-[translate,border-color] duration-150 group-hover:-translate-y-0.5 group-hover:border-foreground/25 motion-reduce:group-hover:translate-y-0">
        {game.cover_url ? (
          <Image src={game.cover_url} alt="" fill sizes={sizes} className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-display text-sm font-extrabold text-muted-foreground [font-stretch:125%]">
            {game.title}
          </div>
        )}
        {rank !== undefined && (
          <span
            aria-hidden
            className="absolute top-2 left-2 grid size-6 place-items-center rounded-md bg-foreground text-xs font-bold text-background tabular-nums"
          >
            {rank}
          </span>
        )}
        {shown.length > 0 && (
          <span
            aria-hidden
            className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-1"
          >
            {shown.map(({ key, Icon }) => (
              <Icon key={key} className="size-3.5" />
            ))}
          </span>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="truncate text-sm font-semibold">
          {rank !== undefined && <span className="sr-only">{rank}. </span>}
          {game.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{game.original_title}</p>
        {game.platform && (
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: game.platform.color }}
            />
            {game.platform.name}
          </p>
        )}
        {note && <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>}
        {shown.length > 0 && (
          <span className="sr-only">{shown.map(({ label }) => label).join(", ")}</span>
        )}
      </div>
    </Link>
  );
}
