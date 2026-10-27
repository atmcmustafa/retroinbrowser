import type { Metadata } from "next";
import { GameForm } from "@/components/admin/game-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import { getGenres, getPlatforms } from "@/lib/data/taxonomy";

export const metadata: Metadata = { title: "New game" };

export default async function NewGamePage() {
  await requireAdmin();
  const [platforms, genres] = await Promise.all([getPlatforms(), getGenres()]);

  return (
    <>
      <AdminPageHeader title="New game" description="Saved as a draft until you publish it." />
      <GameForm platforms={platforms} genres={genres} />
    </>
  );
}
