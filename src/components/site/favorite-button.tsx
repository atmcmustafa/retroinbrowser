"use client";

import { HeartIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFavorite } from "@/lib/actions/library";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  gameId,
  initialSaved,
}: {
  gameId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await setFavorite(gameId, next);
      if (!result.ok) {
        setSaved(!next);
        toast.error(result.message);
      }
    });
  }

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      aria-pressed={saved}
      disabled={pending}
      onClick={toggle}
    >
      <HeartIcon data-icon="inline-start" className={cn(saved && "fill-primary text-primary")} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
