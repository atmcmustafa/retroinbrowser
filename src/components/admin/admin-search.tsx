"use client";

import { SearchIcon } from "lucide-react";
import { debounce, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

const searchParams = {
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

// A new search starts over on the first page.
export function AdminSearch({ label, placeholder }: { label: string; placeholder: string }) {
  const [{ q }, setParams] = useQueryStates(searchParams, { shallow: false });

  return (
    <InputGroup className="sm:max-w-xs">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={q}
        onChange={(event) =>
          setParams(
            { q: event.target.value, page: null },
            { limitUrlUpdates: event.target.value ? debounce(300) : undefined },
          )
        }
      />
    </InputGroup>
  );
}
