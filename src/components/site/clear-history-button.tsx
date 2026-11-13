"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearPlayHistory } from "@/lib/actions/library";

export function ClearHistoryButton({ onCleared }: { onCleared: () => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await clearPlayHistory();
          if (result.ok) onCleared();
          else toast.error(result.message);
        })
      }
    >
      {pending ? "Clearing…" : "Clear"}
    </Button>
  );
}
