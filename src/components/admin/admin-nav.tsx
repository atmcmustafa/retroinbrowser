"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/screenshots", label: "Screenshots" },
  { href: "/admin/taxonomy", label: "Taxonomy" },
];

export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

// Rendered without a pathname as the Suspense fallback: dynamic segments like
// /admin/games/[id] can't resolve usePathname during prerendering.
export function AdminNavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {links.map(({ href, label }) => {
        const active =
          pathname !== undefined &&
          (href === "/admin" ? pathname === href : pathname.startsWith(href));
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
