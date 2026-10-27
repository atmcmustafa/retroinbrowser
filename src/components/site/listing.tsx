import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { GameGridSkeleton } from "@/components/site/game-grid";
import { Skeleton } from "@/components/ui/skeleton";

export function FilterLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
    >
      Search and filter
      <ArrowRightIcon aria-hidden className="size-3.5" />
    </Link>
  );
}

export function ListingSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-14 w-64" />
      <Skeleton className="mt-4 h-5 w-80 max-w-full" />
      <div className="mt-10">
        <GameGridSkeleton />
      </div>
    </div>
  );
}
