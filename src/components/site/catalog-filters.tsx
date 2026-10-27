"use client";

import {
  FolderXIcon,
  Gamepad2Icon,
  Loader2Icon,
  SearchIcon,
  SmartphoneIcon,
  XIcon,
} from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogParams, type CatalogSort } from "@/lib/search-params";
import { cn } from "@/lib/utils";

type Option = { slug: string; name: string; color?: string };

const ALL = "all";

const sortLabels: Record<CatalogSort, string> = {
  popular: "Popular",
  new: "Newest",
  title: "A–Z",
};

const toggles = [
  { key: "mobile", label: "Works on mobile", Icon: SmartphoneIcon },
  { key: "gamepad", label: "Gamepad", Icon: Gamepad2Icon },
  { key: "nofiles", label: "No game files needed", Icon: FolderXIcon },
] as const;

export function CatalogFilters({ genres, platforms }: { genres: Option[]; platforms: Option[] }) {
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(catalogParams, { shallow: false, startTransition });

  // Any filter change starts over at page 1.
  const update = (values: Partial<Omit<typeof filters, "page">>) =>
    setFilters({ ...values, page: null });

  const active =
    filters.q !== "" ||
    filters.genre !== null ||
    filters.platform !== null ||
    filters.mobile ||
    filters.gamepad ||
    filters.nofiles;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            {pending ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search games"
            placeholder="Search games"
            value={filters.q}
            onChange={(event) =>
              setFilters(
                { q: event.target.value, page: null },
                { limitUrlUpdates: event.target.value ? debounce(300) : undefined },
              )
            }
          />
        </InputGroup>
        <Select
          value={filters.sort}
          onValueChange={(value) => update({ sort: value as CatalogSort })}
        >
          <SelectTrigger aria-label="Sort" className="w-32 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(sortLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.genre ?? ALL}
          onValueChange={(value) => update({ genre: value === ALL ? null : value })}
        >
          <SelectTrigger aria-label="Genre" className="w-[calc(50%-0.25rem)] sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All genres</SelectItem>
            {genres.map((genre) => (
              <SelectItem key={genre.slug} value={genre.slug}>
                {genre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.platform ?? ALL}
          onValueChange={(value) => update({ platform: value === ALL ? null : value })}
        >
          <SelectTrigger aria-label="Platform" className="w-[calc(50%-0.25rem)] sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All platforms</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform.slug} value={platform.slug}>
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: platform.color }}
                />
                {platform.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {toggles.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={filters[key]}
            onClick={() => update({ [key]: !filters[key] })}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              filters[key]
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-3.5" />
            {label}
          </button>
        ))}

        {active && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(null)}>
            <XIcon data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
