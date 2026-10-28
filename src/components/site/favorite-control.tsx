import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/site/favorite-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { isFavorite } from "@/lib/data/library";

// The only per-user part of a game page; it streams in after the cached page shell.
export async function FavoriteControl({ gameId, slug }: { gameId: string; slug: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Button asChild size="lg" variant="outline">
        <Link href={`/login?next=${encodeURIComponent(`/games/${slug}`)}`}>
          <HeartIcon data-icon="inline-start" />
          Save
        </Link>
      </Button>
    );
  }

  return <FavoriteButton gameId={gameId} initialSaved={await isFavorite(user.id, gameId)} />;
}

export function FavoriteControlSkeleton() {
  return <Skeleton aria-hidden className="h-9 w-[5.5rem] rounded-lg" />;
}
