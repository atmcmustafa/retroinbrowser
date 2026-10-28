import Link from "next/link";
import { cn } from "@/lib/utils";

export function FilterTabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { label: string; href: string; active: boolean; count?: number }[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors duration-150",
            tab.active
              ? "border-foreground bg-foreground text-background"
              : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="text-xs tabular-nums">{tab.count}</span>}
        </Link>
      ))}
    </nav>
  );
}
