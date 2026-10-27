import Link from "next/link";
import { GameRow } from "@/components/site/game-row";
import { PageHeading } from "@/components/site/page-heading";
import { Button } from "@/components/ui/button";
import { getPopularGames } from "@/lib/data/games";

export async function NotFoundContent() {
  const popular = await getPopularGames(7);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">404</p>
      <PageHeading title="Page not found" description="This page doesn't exist or has moved." />
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/games">Browse all games</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Go to the home page</Link>
        </Button>
      </div>
      {popular.length > 0 && (
        <div className="mt-16">
          <GameRow id="row-not-found" title="Popular" href="/popular" games={popular} ranked />
        </div>
      )}
    </div>
  );
}
