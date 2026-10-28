import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { getSmokeChecks } from "@/lib/data/admin";
import { timeAgo } from "@/lib/time-ago";

export const metadata: Metadata = { title: "Screenshots" };

const detailsSchema = z.object({
  screenshot: z.url().optional(),
  canvas: z.boolean().optional(),
  console_errors: z.array(z.string()).optional(),
});

const verdictLabels: Record<string, string> = {
  ok: "Loaded",
  broken: "Failed",
  unknown: "Bot check",
};

export default async function AdminScreenshotsPage() {
  await requireAdmin();
  const games = await getSmokeChecks();

  return (
    <>
      <AdminPageHeader
        title="Screenshots"
        description="Each port opened in a headless browser every Sunday, 10 seconds after load."
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const check = game.link_checks[0];
          const details = detailsSchema.safeParse(check?.details).data;
          const errors = details?.console_errors ?? [];
          return (
            <li key={game.id} className="overflow-hidden rounded-lg border bg-surface">
              <div className="relative aspect-video bg-background">
                {details?.screenshot ? (
                  <Image
                    src={details.screenshot}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No screenshot yet
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/games/${game.id}`}
                    className="min-w-0 truncate rounded-sm font-medium hover:underline"
                  >
                    {game.title}
                  </Link>
                  {check && (
                    <Badge variant={check.verdict === "broken" ? "destructive" : "outline"}>
                      {verdictLabels[check.verdict] ?? check.verdict}
                    </Badge>
                  )}
                </div>
                {check ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {timeAgo(check.checked_at)}
                    {check.http_status !== null && ` · HTTP ${check.http_status}`}
                    {details?.canvas !== undefined &&
                      ` · ${details.canvas ? "canvas" : "no canvas"}`}
                    {` · ${errors.length} console ${errors.length === 1 ? "error" : "errors"}`}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not checked yet</p>
                )}
                {(check?.error || errors.length > 0) && (
                  <p className="line-clamp-2 font-mono text-xs break-all text-muted-foreground">
                    {check?.error ?? errors[0]}
                  </p>
                )}
                <a
                  href={game.play_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
                >
                  Open the port
                  <ExternalLinkIcon aria-hidden className="size-3" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
