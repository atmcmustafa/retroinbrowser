"use client";

import { MenuIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { siteLinks } from "@/components/site/links";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col px-2">
          {siteLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-150 hover:bg-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t p-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/submit" onClick={close}>
              <PlusIcon data-icon="inline-start" />
              Submit a game
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
