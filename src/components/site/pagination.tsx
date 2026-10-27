import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
      <PageLink href={page > 1 ? hrefFor(page - 1) : null} label="Previous page">
        <ChevronLeftIcon data-icon="inline-start" />
        Previous
      </PageLink>
      <span className="text-sm text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>
      <PageLink href={page < totalPages ? hrefFor(page + 1) : null} label="Next page">
        Next
        <ChevronRightIcon data-icon="inline-end" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return (
      <Button variant="outline" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline">
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
