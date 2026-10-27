import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { GameCard } from "@/components/site/game-card";
import type { GameCardData } from "@/lib/data/games";

export function GameRow({
  id,
  title,
  href,
  games,
  ranked = false,
}: {
  id: string;
  title: string;
  href: string;
  games: GameCardData[];
  ranked?: boolean;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4">
        <Link
          href={href}
          className="group inline-flex items-center gap-1 rounded-sm font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]"
        >
          {title}
          <ChevronRightIcon
            aria-hidden
            className="size-5 text-muted-foreground transition-[translate,color] duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </Link>
      </h2>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-3 md:mx-0 md:grid md:grid-cols-7 md:overflow-visible md:px-0 md:pb-0">
        {games.map((game, index) => (
          <li key={game.id} className="w-36 shrink-0 snap-start md:w-auto">
            <GameCard game={game} rank={ranked ? index + 1 : undefined} />
          </li>
        ))}
      </ul>
    </section>
  );
}
