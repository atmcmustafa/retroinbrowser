import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/site/login-form";
import { OAuthButtons } from "@/components/site/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/lib/actions/auth";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { providerNames, type OAuthProvider } from "@/lib/auth-providers";
import { getEnabledProviders } from "@/lib/data/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Set by /auth/callback. A Map, so ?error=__proto__ can't pick up an Object.prototype member.
const loginErrors = new Map([
  ["expired", "That link has expired. Request a new one."],
  ["failed", "Sign-in didn't complete. Try again."],
  ["banned", "This account is banned."],
]);

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
  const [params, user, providers] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getEnabledProviders().catch((error): OAuthProvider[] => {
      console.error("Loading sign-in providers failed", error);
      return [];
    }),
  ]);
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

  const error = typeof params.error === "string" ? loginErrors.get(params.error) : undefined;
  const accounts = providers.map((provider) => providerNames[provider]).join(" or ");

  return (
    <>
      <p className="mt-3 text-muted-foreground">
        {accounts
          ? `Use your ${accounts} account, or get a sign-in link by email.`
          : "We'll email you a link to sign in."}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {providers.length > 0 && (
        <>
          <OAuthButtons providers={providers} next={next} />
          <div className="mt-8 flex items-center gap-3 text-xs text-muted-foreground">
            <span aria-hidden className="h-px flex-1 bg-border" />
            or
            <span aria-hidden className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <LoginForm next={next} siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
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
