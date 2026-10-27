import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = { title: "Page not found" };

// Unmatched URLs land here, outside the (site) layout, so it brings its own shell.
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
