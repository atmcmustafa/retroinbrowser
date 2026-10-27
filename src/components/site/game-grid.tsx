import { GameCard } from "@/components/site/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GameCardData } from "@/lib/data/games";

const gridClass = "grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
const cardSizes =
  "(min-width: 1024px) 176px, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw";

export function GameGrid({ games, rankOffset }: { games: GameCardData[]; rankOffset?: number }) {
  return (
    <ul className={gridClass}>
      {games.map((game, index) => (
        <li key={game.id}>
          <GameCard
            game={game}
            sizes={cardSizes}
            rank={rankOffset === undefined ? undefined : rankOffset + index + 1}
          />
        </li>
      ))}
    </ul>
  );
}

export function GameGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul aria-hidden className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Skeleton className="aspect-[2/3] rounded-card" />
          <Skeleton className="mt-2.5 h-4 w-3/4" />
          <Skeleton className="mt-1.5 h-3 w-1/2" />
        </li>
      ))}
    </ul>
  );
}
