import type { Metadata } from "next";
import { z } from "zod";
import { GameForm } from "@/components/admin/game-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getAdminCandidate } from "@/lib/data/admin";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";

export const metadata: Metadata = { title: "New game" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewGamePage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { candidate: candidateParam } = await searchParams;
  const candidateId = z.uuid().safeParse(candidateParam).success
    ? (candidateParam as string)
    : null;

  const [platforms, genres, found] = await Promise.all([
    getPlatforms(),
    getGenres(),
    candidateId ? getAdminCandidate(candidateId) : null,
  ]);
  // Only pending submissions prefill the form; approved ones already have a game.
  const candidate = found?.status === "pending" ? found : undefined;

  return (
    <>
      <AdminPageHeader title="New game" description="Saved as a draft until you publish it." />
      {candidate && (
        <div className="mt-6 rounded-lg border bg-surface px-4 py-3 text-sm">
          <p>
            From a submission:{" "}
            <a
              href={candidate.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm break-all underline underline-offset-2"
            >
              {candidate.url}
            </a>
          </p>
          {candidate.note && (
            <p className="mt-1 text-muted-foreground">&ldquo;{candidate.note}&rdquo;</p>
          )}
          <p className="mt-1 text-muted-foreground">Saving approves the submission.</p>
        </div>
      )}
      <GameForm platforms={platforms} genres={genres} candidate={candidate} />
    </>
  );
}
