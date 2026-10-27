"use client";

import { SearchIcon } from "lucide-react";
import { debounce, useQueryState } from "nuqs";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { adminGamesParams } from "@/lib/search-params";

export function GamesSearch() {
  const [q, setQ] = useQueryState("q", adminGamesParams.q.withOptions({ shallow: false }));

  return (
    <InputGroup className="sm:max-w-xs">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label="Search games"
        placeholder="Search games"
        value={q}
        onChange={(event) =>
          setQ(event.target.value, {
            limitUrlUpdates: event.target.value ? debounce(300) : undefined,
          })
        }
      />
    </InputGroup>
  );
}
