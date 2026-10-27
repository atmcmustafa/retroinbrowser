"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteTaxonomyItem } from "@/lib/actions/taxonomy";
import type { TaxonomyKind } from "@/lib/schemas/taxonomy";

export function TaxonomyDeleteButton({
  kind,
  id,
  name,
  gameCount,
}: {
  kind: TaxonomyKind;
  id: number;
  name: string;
  gameCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (gameCount > 0) {
    const reason = `Used by ${gameCount} ${gameCount === 1 ? "game" : "games"}`;
    // Disabled buttons don't fire pointer or focus events, so the wrapper carries the tooltip.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} aria-label={`Can't delete ${name}: ${reason}`} className="rounded-md">
            <Button type="button" variant="ghost" size="icon-sm" disabled aria-hidden tabIndex={-1}>
              <Trash2Icon />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{reason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${name}`}>
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>No games use this {kind}. It can&apos;t be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteTaxonomyItem(kind, id);
                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }
                toast.success(`${name} deleted.`);
                setOpen(false);
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
