import { format } from "date-fns";
import type { Metadata } from "next";
import { z } from "zod";
import { GameForm } from "@/components/admin/game-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getAdminCandidate } from "@/lib/data/admin";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import { parseExtracted } from "@/lib/schemas/extraction";

export const metadata: Metadata = { title: "New game" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const linkClass = "rounded-sm break-all underline underline-offset-2";

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
  // Only pending candidates prefill the form; approved ones already have a game.
  const candidate =
    found?.status === "pending"
      ? { ...found, extracted: parseExtracted(found.extracted) }
      : undefined;
  const extracted = candidate?.extracted?.is_port ? candidate.extracted : null;

  return (
    <>
      <AdminPageHeader
        title="New game"
        description={
          extracted
            ? "Filled in from the candidate. Check every field; saving publishes it."
            : "Saved as a draft until you publish it."
        }
      />
      {candidate && (
        <div className="mt-6 flex flex-col gap-1 rounded-lg border bg-surface px-4 py-3 text-sm">
          <p>
            {candidate.source === "user" ? "From a submission: " : "Found at: "}
            <a href={candidate.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {candidate.url}
            </a>
          </p>
          {candidate.note && (
            <p className="text-muted-foreground">&ldquo;{candidate.note}&rdquo;</p>
          )}
          {candidate.extracted && (
            <p className="text-muted-foreground">
              Extractor ({Math.round(candidate.extracted.confidence * 100)}% sure):{" "}
              {candidate.extracted.reason}
            </p>
          )}
          {candidate.candidate_mentions.length > 0 && (
            <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
              {candidate.candidate_mentions.slice(0, 8).map((mention) => (
                <li key={mention.url}>
                  {format(new Date(mention.seen_at), "d MMM")} ·{" "}
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {mention.title ?? mention.url}
                  </a>
                  {mention.points ? ` · ${mention.points}` : ""}
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground">Saving approves the candidate.</p>
        </div>
      )}
      <GameForm platforms={platforms} genres={genres} candidate={candidate} />
    </>
  );
}
