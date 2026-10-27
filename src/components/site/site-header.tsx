import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { SearchPalette } from "@/components/site/search-palette";
import { SiteNav, SiteNavLinks } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <Suspense fallback={<SiteNavLinks className="hidden md:flex" />}>
          <SiteNav className="hidden md:flex" />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchPalette />
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/submit">
              <PlusIcon data-icon="inline-start" />
              Submit a game
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
