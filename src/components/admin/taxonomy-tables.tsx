import { TaxonomyDeleteButton } from "@/components/admin/taxonomy-delete-button";
import { GenreDialog } from "@/components/admin/taxonomy-genre-dialog";
import { TaxonomyMoveButtons } from "@/components/admin/taxonomy-move-buttons";
import { PlatformDialog } from "@/components/admin/taxonomy-platform-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminTaxonomy } from "@/lib/data/admin";
import { GenreIcon } from "@/lib/genre-icons";

export function TaxonomyTables({ platforms, genres }: AdminTaxonomy) {
  return (
    <>
      <TaxonomySection title="Platforms" action={<PlatformDialog />}>
        <Table>
          <TaxonomyHeader />
          <TableBody>
            {platforms.map((platform, index) => (
              <TableRow key={platform.id}>
                <TableCell>
                  <TaxonomyMoveButtons
                    kind="platform"
                    id={platform.id}
                    name={platform.name}
                    first={index === 0}
                    last={index === platforms.length - 1}
                  />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <span className="font-medium">{platform.name}</span>
                    {platform.short_name && (
                      <span className="text-xs text-muted-foreground">{platform.short_name}</span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {platform.slug}
                </TableCell>
                <TableCell className="text-right tabular-nums">{platform.gameCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <PlatformDialog platform={platform} />
                    <TaxonomyDeleteButton
                      kind="platform"
                      id={platform.id}
                      name={platform.name}
                      gameCount={platform.gameCount}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TaxonomySection>

      <TaxonomySection title="Genres" action={<GenreDialog />}>
        <Table>
          <TaxonomyHeader />
          <TableBody>
            {genres.map((genre, index) => (
              <TableRow key={genre.id}>
                <TableCell>
                  <TaxonomyMoveButtons
                    kind="genre"
                    id={genre.id}
                    name={genre.name}
                    first={index === 0}
                    last={index === genres.length - 1}
                  />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <GenreIcon
                      icon={genre.icon}
                      aria-hidden
                      className="size-4 shrink-0 text-primary"
                    />
                    <span className="font-medium">{genre.name}</span>
                  </span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {genre.slug}
                </TableCell>
                <TableCell className="text-right tabular-nums">{genre.gameCount}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <GenreDialog genre={genre} />
                    <TaxonomyDeleteButton
                      kind="genre"
                      id={genre.id}
                      name={genre.name}
                      gameCount={genre.gameCount}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TaxonomySection>
    </>
  );
}

function TaxonomySection({
  title,
  action,
  children,
}: {
  title: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TaxonomyHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-20">
          <span className="sr-only">Order</span>
        </TableHead>
        <TableHead>Name</TableHead>
        <TableHead className="hidden sm:table-cell">Slug</TableHead>
        <TableHead className="text-right">Games</TableHead>
        <TableHead className="w-20">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
