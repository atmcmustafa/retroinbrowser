"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { refreshPublicCache } from "@/lib/actions/games";

export function RefreshCacheButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await refreshPublicCache();
          toast.success("Site refreshed with the latest data.");
        })
      }
    >
      <RefreshCwIcon data-icon="inline-start" className={pending ? "animate-spin" : undefined} />
      Refresh site
    </Button>
  );
}
