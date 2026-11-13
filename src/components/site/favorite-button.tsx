"use client";

import { HeartIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setFavorite } from "@/lib/actions/library";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  gameId,
  saved,
  onChange,
}: {
  gameId: string;
  saved: boolean;
  onChange: (saved: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !saved;
    onChange(next);
    startTransition(async () => {
      const result = await setFavorite(gameId, next);
      if (!result.ok) {
        onChange(!next);
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
