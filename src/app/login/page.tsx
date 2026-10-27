import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/site/login-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/lib/actions/auth";
import { getCurrentUser, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-16">
      <Link
        href="/"
        className="w-fit rounded-sm font-display text-lg font-extrabold tracking-tight [font-stretch:125%]"
      >
        RetroInBrowser
      </Link>
      <h1 className="mt-10 font-display text-5xl font-extrabold tracking-tight [font-stretch:125%]">
        Sign in
      </h1>
      <Suspense fallback={<LoginSkeleton />}>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginPanel({ searchParams }: { searchParams: SearchParams }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const next = safeNextPath(params.next);

  if (user) {
    return (
      <>
        <p className="mt-3 text-muted-foreground">
          Signed in as <span className="text-foreground">{user.email ?? user.username}</span>.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href={next}>Continue</Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="lg">
              Sign out
            </Button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="mt-3 text-muted-foreground">We&apos;ll email you a link to sign in.</p>
      {params.error === "link" && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          That link is invalid or has expired. Request a new one.
        </p>
      )}
      <LoginForm next={next} />
    </>
  );
}

function LoginSkeleton() {
  return (
    <div aria-hidden className="mt-3 flex flex-col gap-8">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
