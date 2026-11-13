import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginPanel, LoginSkeleton } from "@/components/site/login-panel";
import type { OAuthProvider } from "@/lib/auth-providers";
import { getEnabledProviders } from "@/lib/data/auth";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

// Static: the providers are read when the site is built, and ?next, ?error and whether someone
// is already signed in are read in the browser.
export default async function LoginPage() {
  const providers = await getEnabledProviders().catch((error): OAuthProvider[] => {
    console.error("Loading sign-in providers failed", error);
    return [];
  });

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
        <LoginPanel providers={providers} siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </Suspense>
    </main>
  );
}
