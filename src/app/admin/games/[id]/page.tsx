import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { GameForm } from "@/components/admin/game-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getAdminGame } from "@/lib/data/admin";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";
import { gameStatusLabels } from "@/lib/schemas/game";

export const metadata: Metadata = { title: "Edit game" };

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [game, platforms, genres] = await Promise.all([
    getAdminGame(id),
    getPlatforms(),
    getGenres(),
  ]);
  if (!game) notFound();

  const details = [
    gameStatusLabels[game.status],
    game.published_at && `published ${format(new Date(game.published_at), "d MMM yyyy")}`,
    `${game.click_count.toLocaleString("en-US")} clicks`,
  ].filter(Boolean);

  return (
    <>
      <AdminPageHeader title={game.title} description={details.join(" · ")} />
      <GameForm game={game} platforms={platforms} genres={genres} />
    </>
  );
}
