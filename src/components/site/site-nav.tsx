"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteLinks } from "@/components/site/links";
import { cn } from "@/lib/utils";

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ className }: { className?: string }) {
  return <SiteNavLinks pathname={usePathname()} className={className} />;
}

// Rendered without a pathname as the Suspense fallback: routes with dynamic params
// can't resolve usePathname during prerendering.
export function SiteNavLinks({ pathname, className }: { pathname?: string; className?: string }) {
  return (
    <nav aria-label="Main" className={cn("items-center gap-1", className)}>
      {siteLinks.map(({ href, label }) => {
        const active = pathname !== undefined && isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
              active &&
                "bg-surface text-foreground after:absolute after:-bottom-1 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
