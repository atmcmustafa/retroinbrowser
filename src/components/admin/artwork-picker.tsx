"use client";

import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listArtwork, searchArtworkGames } from "@/lib/actions/artwork";
import type { Artwork, ArtworkGame, ArtworkKind } from "@/lib/images";
import { cn } from "@/lib/utils";

const copy = {
  cover: { trigger: "Choose cover", title: "Choose a cover", empty: "No covers for this game." },
  hero: { trigger: "Choose hero", title: "Choose a hero image", empty: "No heroes for this game." },
} satisfies Record<ArtworkKind, Record<string, string>>;

export function ArtworkPicker({
  kind,
  query,
  steamGridId,
  onPick,
}: {
  kind: ArtworkKind;
  query: string;
  steamGridId: number | null;
  onPick: (artwork: Artwork, steamGridId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [games, setGames] = useState<ArtworkGame[] | null>(null);
  const [artwork, setArtwork] = useState<{ gameId: number; items: Artwork[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await searchArtworkGames(value);
      if (!result.ok) return setError(result.message);
      setGames(result.data);
      setArtwork(null);
    });
  }

  function load(gameId: number) {
    setError(null);
    startTransition(async () => {
      const result = await listArtwork(gameId, kind);
      if (!result.ok) return setError(result.message);
      setArtwork({ gameId, items: result.data });
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setTerm(query);
    setGames(null);
    setArtwork(null);
    if (steamGridId) load(steamGridId);
    else if (query.trim()) search(query);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {copy[kind].trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{copy[kind].title}</DialogTitle>
          <DialogDescription>
            From SteamGridDB. Saved as WebP when you save the game.
          </DialogDescription>
        </DialogHeader>

        {artwork ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {artwork.items.length} {artwork.items.length === 1 ? "image" : "images"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setArtwork(null);
                if (!games && term.trim()) search(term);
              }}
            >
              Change game
            </Button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              // The dialog is portaled, but React still bubbles submit to the game form.
              event.preventDefault();
              event.stopPropagation();
              search(term);
            }}
          >
            <Input
              aria-label="Game name"
              placeholder="Game name"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={pending || !term.trim()}>
              Search
            </Button>
          </form>
        )}

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {pending ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2Icon aria-label="Loading" className="size-5 animate-spin" />
            </div>
          ) : artwork ? (
            artwork.items.length ? (
              <ul
                className={cn(
                  "grid gap-3",
                  kind === "cover" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-1 sm:grid-cols-2",
                )}
              >
                {artwork.items.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(item, artwork.gameId);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative block w-full overflow-hidden rounded-md border bg-surface transition-colors duration-150 outline-none hover:border-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        kind === "cover" ? "aspect-[2/3]" : "aspect-[1920/620]",
                      )}
                    >
                      <Image
                        src={item.thumb}
                        alt={`Option ${index + 1}${item.author ? ` by ${item.author}` : ""}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-muted-foreground">{copy[kind].empty}</p>
            )
          ) : games ? (
            games.length ? (
              <ul className="flex flex-col">
                {games.map((game) => (
                  <li key={game.id}>
                    <button
                      type="button"
                      onClick={() => load(game.id)}
                      className="flex w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left transition-colors duration-150 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span>{game.name}</span>
                      {game.year && (
                        <span className="text-muted-foreground tabular-nums">{game.year}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-muted-foreground">No games found.</p>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
