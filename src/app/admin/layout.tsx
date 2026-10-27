import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { signOut } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link
            href="/admin"
            className="rounded-sm font-display text-base font-extrabold tracking-tight [font-stretch:125%]"
          >
            RetroInBrowser
            <span className="ml-2 font-sans text-xs font-medium tracking-normal text-muted-foreground">
              Admin
            </span>
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto">
            <Suspense fallback={<AdminNavLinks />}>
              <AdminNav />
            </Suspense>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">View site</Link>
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</main>
      <Toaster position="bottom-right" />
    </>
  );
}
