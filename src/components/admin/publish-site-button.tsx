"use client";

import { RocketIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publishSite } from "@/lib/actions/games";

// The live site is rebuilt by a deploy; this starts one instead of waiting for the daily run.
export function PublishSiteButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await publishSite();
          if (result.ok) toast.success("Deploy started. The live site updates in a few minutes.");
          else toast.error(result.message);
        })
      }
    >
      <RocketIcon data-icon="inline-start" />
      {pending ? "Starting…" : "Publish site"}
    </Button>
  );
}
