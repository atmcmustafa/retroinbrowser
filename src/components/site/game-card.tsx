import { FolderOpenIcon, Gamepad2Icon, SmartphoneIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { GameCardData } from "@/lib/data/games";

const badges = [
  { key: "mobile_support", label: "Works on mobile", Icon: SmartphoneIcon },
  { key: "gamepad_support", label: "Gamepad support", Icon: Gamepad2Icon },
  { key: "requires_own_files", label: "Needs your own game files", Icon: FolderOpenIcon },
] as const;

export function GameCard({ game, rank }: { game: GameCardData; rank?: number }) {
  const shown = badges.filter(({ key }) => game[key]);

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block rounded-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-card border bg-surface transition-[translate,border-color] duration-150 group-hover:-translate-y-0.5 group-hover:border-foreground/25 motion-reduce:group-hover:translate-y-0">
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt=""
            fill
            sizes="(min-width: 1152px) 152px, (min-width: 768px) 14vw, 144px"
            className="object-cover"
          />
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
        {shown.length > 0 && (
          <span className="sr-only">{shown.map(({ label }) => label).join(", ")}</span>
        )}
      </div>
    </Link>
  );
}
