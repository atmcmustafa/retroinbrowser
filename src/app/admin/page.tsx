import { EyeOffIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RefreshCacheButton } from "@/components/admin/refresh-cache-button";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getAdminStats } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await getAdminStats();

  const tiles = [
    { label: "Published", value: stats.published, href: "/admin/games?status=published" },
    { label: "Drafts", value: stats.drafts, href: "/admin/games?status=draft" },
    { label: "Pending candidates", value: stats.pending, href: "/admin/candidates" },
    { label: "Broken links", value: stats.broken },
    { label: "Users", value: stats.users, href: "/admin/users" },
    { label: "Comments this week", value: stats.comments, href: "/admin/comments" },
  ];

  return (
    <>
      <AdminPageHeader
        title="Overview"
        actions={
          <>
            <RefreshCacheButton />
            <Button asChild>
              <Link href="/admin/games/new">
                <PlusIcon data-icon="inline-start" />
                New game
              </Link>
            </Button>
          </>
        }
      />

      {stats.drafts > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4">
          <p className="flex items-center gap-2.5 text-sm">
            <EyeOffIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span>
              {stats.drafts} {stats.drafts === 1 ? "draft is" : "drafts are"} hidden from the site.
              {stats.published === 0 && " Nothing is published yet, so the site looks empty."}
            </span>
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/games?status=draft">Review and publish</Link>
          </Button>
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map(({ label, value, href }) => (
          <div
            key={label}
            className="relative rounded-lg border bg-surface p-4 transition-colors duration-150 has-[a:hover]:bg-surface-hover"
          >
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {href ? (
                <Link href={href} className="rounded-sm after:absolute after:inset-0">
                  {label}
                </Link>
              ) : (
                label
              )}
            </dt>
            <dd className="mt-2 font-display text-3xl font-extrabold [font-stretch:125%] tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
