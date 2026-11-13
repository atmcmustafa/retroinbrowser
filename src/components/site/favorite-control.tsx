"use client";

import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { FavoriteButton } from "@/components/site/favorite-button";
import { useSession } from "@/components/site/session-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// The only per-user part of a game page's header; the page itself is static.
export function FavoriteControl({ gameId, slug }: { gameId: string; slug: string }) {
  const session = useSession();
  if (session.status === "loading") return <FavoriteControlSkeleton />;

  if (!session.user) {
    return (
      <Button asChild size="lg" variant="outline">
        <Link href={`/login?next=${encodeURIComponent(`/games/${slug}`)}`}>
          <HeartIcon data-icon="inline-start" />
          Save
        </Link>
      </Button>
    );
  }

  return (
    <FavoriteButton
      gameId={gameId}
      saved={session.isFavorite(gameId)}
      onChange={(saved) => session.markFavorite(gameId, saved)}
    />
  );
}

export function FavoriteControlSkeleton() {
  return <Skeleton aria-hidden className="h-9 w-[5.5rem] rounded-lg" />;
}
