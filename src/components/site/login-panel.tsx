"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/site/login-form";
import { OAuthButtons } from "@/components/site/oauth-buttons";
import { useSession } from "@/components/site/session-provider";
import { SignOutButton } from "@/components/site/sign-out-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { providerNames, type OAuthProvider } from "@/lib/auth-providers";
import { safeNextPath } from "@/lib/safe-next-path";

// Set by /auth/callback. A Map, so ?error=__proto__ can't pick up an Object.prototype member.
const loginErrors = new Map([
  ["expired", "That link has expired. Request a new one."],
  ["failed", "Sign-in didn't complete. Try again."],
  ["banned", "This account is banned."],
]);

export function LoginPanel({
  providers,
  siteKey,
}: {
  providers: OAuthProvider[];
  siteKey: string | undefined;
}) {
  const params = useSearchParams();
  const session = useSession();
  const next = safeNextPath(params.get("next"));

  if (session.status === "loading") return <LoginSkeleton />;

  if (session.user) {
    return (
      <>
        <p className="mt-3 text-muted-foreground">
          Signed in as{" "}
          <span className="text-foreground">{session.user.email ?? session.user.name}</span>.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href={next}>Continue</Link>
          </Button>
          <SignOutButton size="lg" />
        </div>
      </>
    );
  }

  const errorKey = params.get("error");
  const error = errorKey ? loginErrors.get(errorKey) : undefined;
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
      <LoginForm next={next} siteKey={siteKey} />
    </>
  );
}

export function LoginSkeleton() {
  return (
    <div aria-hidden className="mt-3 flex flex-col gap-8">
      <Skeleton className="h-6 w-56" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
