import Link from "next/link";
import { GenreIcon } from "@/lib/genre-icons";

type GenreWithCount = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  count: number;
};

export function GenreGrid({ genres }: { genres: GenreWithCount[] }) {
  return (
    <section aria-label="Genres">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {genres.map((genre) => (
          <li key={genre.id}>
            <Link
              href={`/genres/${genre.slug}`}
              className="flex items-center gap-2 rounded-lg border bg-surface p-2 transition-colors duration-150 hover:bg-surface-hover sm:gap-3 sm:p-2.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md border bg-background sm:size-9">
                <GenreIcon
                  icon={genre.icon}
                  aria-hidden
                  className="size-3.5 text-primary sm:size-4"
                />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{genre.name}</span>
              <span className="rounded-full bg-background px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums sm:px-2">
                {genre.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
