import type { Metadata } from "next";
import Link from "next/link";
import { CandidatesTable } from "@/components/admin/candidate-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getAdminCandidates, getCandidateCounts } from "@/lib/data/admin";
import { loadAdminCandidatesParams, serializeAdminCandidatesParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { Constants, type Enums } from "@/types/database";

export const metadata: Metadata = { title: "Candidates" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const statusLabels: Record<Enums<"candidate_status">, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  duplicate: "Duplicates",
};

const emptyText: Record<Enums<"candidate_status">, string> = {
  pending: "Nothing to review. New submissions show up here.",
  approved: "No approved submissions yet.",
  rejected: "No rejected submissions.",
  duplicate: "No duplicates.",
};

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const { status } = await loadAdminCandidatesParams(searchParams);
  const [candidates, counts] = await Promise.all([
    getAdminCandidates(status),
    getCandidateCounts(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Candidates"
        description="Submitted and discovered ports waiting for review."
      />
      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {Constants.public.Enums.candidate_status.map((value) => {
          const active = status === value;
          return (
            <Link
              key={value}
              href={`/admin/candidates${serializeAdminCandidatesParams({ status: value })}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors duration-150",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {statusLabels[value]}
              <span className="text-xs tabular-nums opacity-70">{counts[value]}</span>
            </Link>
          );
        })}
      </nav>
      {candidates.length ? (
        <CandidatesTable candidates={candidates} status={status} />
      ) : (
        <p className="mt-6 rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
          {emptyText[status]}
        </p>
      )}
    </>
  );
}
