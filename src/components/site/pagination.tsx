import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Links for pages that exist as URLs; onPage for lists paged in the browser.
export function Pagination({
  page,
  totalPages,
  hrefFor,
  onPage,
  label = "Pagination",
  className = "mt-12",
}: {
  page: number;
  totalPages: number;
  hrefFor?: (page: number) => string;
  onPage?: (page: number) => void;
  label?: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const target = (to: number) => ({ href: hrefFor?.(to), onClick: onPage && (() => onPage(to)) });

  return (
    <nav aria-label={label} className={cn("flex items-center justify-center gap-3", className)}>
      <PageLink {...(page > 1 ? target(page - 1) : {})} label="Previous page">
        <ChevronLeftIcon data-icon="inline-start" />
        Previous
      </PageLink>
      <span className="text-sm text-muted-foreground tabular-nums">
        {page} / {totalPages}
      </span>
      <PageLink {...(page < totalPages ? target(page + 1) : {})} label="Next page">
        Next
        <ChevronRightIcon data-icon="inline-end" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  onClick,
  label,
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  if (onClick) {
    return (
      <Button type="button" variant="outline" aria-label={label} onClick={onClick}>
        {children}
      </Button>
    );
  }
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
