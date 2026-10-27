import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
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
    { label: "Pending candidates", value: stats.pending },
    { label: "Broken links", value: stats.broken },
  ];

  return (
    <>
      <AdminPageHeader
        title="Overview"
        actions={
          <Button asChild>
            <Link href="/admin/games/new">
              <PlusIcon data-icon="inline-start" />
              New game
            </Link>
          </Button>
        }
      />
      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
