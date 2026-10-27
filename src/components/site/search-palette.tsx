"use client";

import { Loader2Icon, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SearchEntry } from "@/lib/data/games";

const POPULAR_COUNT = 8;

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);

  // Fetched on first hover/focus/open, so pages don't carry the whole catalog.
  const load = useCallback(() => {
    if (entries || loading.current) return;
    loading.current = true;
    setFailed(false);
    fetch("/api/search-index")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => setFailed(true))
      .finally(() => {
        loading.current = false;
      });
  }, [entries]);

  const toggle = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) load();
      else setQuery("");
    },
    [load],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, toggle]);

  function go(href: string) {
    toggle(false);
    router.push(href);
  }

  const term = query.trim();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search games"
        aria-keyshortcuts="Control+K Meta+K"
        title="Search games (Ctrl+K / ⌘K)"
        onClick={() => toggle(true)}
        onPointerEnter={load}
        onFocus={load}
      >
        <SearchIcon />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={toggle}
        title="Search games"
        description="Find a game by port name, original game or platform."
        className="sm:max-w-xl"
      >
        <Command loop>
          <CommandInput placeholder="Search games" value={query} onValueChange={setQuery} />
          <CommandList className="max-h-[min(60dvh,26rem)]">
            {entries === null ? (
              <div className="flex justify-center py-10 text-sm text-muted-foreground">
                {failed ? (
                  "Search couldn't load. Close and try again."
                ) : (
                  <Loader2Icon aria-label="Loading" className="size-5 animate-spin" />
                )}
              </div>
            ) : (
              <>
                <CommandEmpty>No games found.</CommandEmpty>
                <CommandGroup heading={term ? "Games" : "Popular"}>
                  {(term ? entries : entries.slice(0, POPULAR_COUNT)).map((entry) => (
                    <CommandItem
                      key={entry.slug}
                      value={entry.slug}
                      keywords={[entry.title, entry.original_title, entry.platform ?? ""]}
                      onSelect={() => go(`/games/${entry.slug}`)}
                      className="gap-3 py-2"
                    >
                      <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded-sm bg-surface-hover">
                        {entry.cover_url && (
                          <Image
                            src={entry.cover_url}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{entry.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.original_title}
                          {entry.platform && ` · ${entry.platform}`}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {term && (
                  <CommandGroup forceMount>
                    <CommandItem
                      forceMount
                      value={`all-results ${term}`}
                      onSelect={() => go(`/games?q=${encodeURIComponent(term)}`)}
                    >
                      <SearchIcon />
                      Search all games for “{term}”
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
