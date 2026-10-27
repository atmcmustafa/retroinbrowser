"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { moveTaxonomyItem } from "@/lib/actions/taxonomy";
import type { TaxonomyKind } from "@/lib/schemas/taxonomy";

export function TaxonomyMoveButtons({
  kind,
  id,
  name,
  first,
  last,
}: {
  kind: TaxonomyKind;
  id: number;
  name: string;
  first: boolean;
  last: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveTaxonomyItem(kind, id, direction);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <div className="flex">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${name} up`}
        disabled={first || pending}
        onClick={() => move("up")}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Move ${name} down`}
        disabled={last || pending}
        onClick={() => move("down")}
      >
        <ArrowDownIcon />
      </Button>
    </div>
  );
}
