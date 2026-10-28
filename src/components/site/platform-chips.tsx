import Link from "next/link";

type PlatformWithCount = { id: number; slug: string; name: string; color: string; count: number };

export function PlatformChips({ platforms }: { platforms: PlatformWithCount[] }) {
  return (
    <section aria-labelledby="browse-by-platform" className="text-center">
      <h2
        id="browse-by-platform"
        className="font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]"
      >
        Browse by original platform
      </h2>
      <ul className="mt-5 flex flex-wrap justify-center gap-2">
        {platforms.map((platform) => (
          <li key={platform.id}>
            <Link
              href={`/platforms/${platform.slug}`}
              className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-surface-hover"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              {platform.name}
              <span className="text-xs text-muted-foreground tabular-nums">{platform.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
