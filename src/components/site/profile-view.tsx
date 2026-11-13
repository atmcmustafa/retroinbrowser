"use client";

import { format } from "date-fns";
import { ShieldIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile } from "@/app/api/profile/route";
import { ClearHistoryButton } from "@/components/site/clear-history-button";
import { GameGrid, GameGridSkeleton } from "@/components/site/game-grid";
import { SignOutButton } from "@/components/site/sign-out-button";
import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { providerNames } from "@/lib/auth-providers";
import { timeAgo } from "@/lib/time-ago";

const signInMethods: Record<string, string> = { ...providerNames, email: "email link" };

const sectionHeading = "font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]";

// The page is static; the profile comes from /api/profile. Proxy already sends signed-out
// visitors to /login, so a 401 here means the session ended while the page was open.
export function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login?next=%2Fprofile");
          return null;
        }
        return res.ok ? (res.json() as Promise<Profile>) : Promise.reject();
      })
      .then((body) => {
        if (!cancelled && body) setProfile(body);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (failed) {
    return (
      <p className="text-muted-foreground">Your profile couldn&apos;t load. Reload the page.</p>
    );
  }
  if (!profile) return <ProfileSkeleton />;

  const { user, recent, favorites } = profile;
  const methods = user.providers.map((provider) => signInMethods[provider] ?? provider);

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <UserAvatar name={user.name} src={user.avatar} large />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight break-words [font-stretch:125%] sm:text-5xl">
            {user.name}
          </h1>
          {user.email && <p className="mt-2 break-all text-muted-foreground">{user.email}</p>}
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {methods.length > 0 && <Detail term="Signs in with">{methods.join(", ")}</Detail>}
            <Detail term="Member since">{format(new Date(user.createdAt), "d MMM yyyy")}</Detail>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 sm:self-start">
          {user.isAdmin && (
            <Button asChild variant="outline">
              <Link href="/admin">
                <ShieldIcon data-icon="inline-start" />
                Admin
              </Link>
            </Button>
          )}
          <SignOutButton icon />
        </div>
      </section>

      <section aria-labelledby="recently-played">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recently-played" className={sectionHeading}>
            Recently played
          </h2>
          {recent.length > 0 && (
            <ClearHistoryButton onCleared={() => setProfile({ ...profile, recent: [] })} />
          )}
        </div>
        {recent.length > 0 ? (
          <GameGrid
            games={recent.map((game) => ({
              ...game,
              note: `Played ${timeAgo(game.played_at)}`,
            }))}
          />
        ) : (
          <EmptyState>Games you open with Play show up here.</EmptyState>
        )}
      </section>

      <section aria-labelledby="favorites">
        <h2 id="favorites" className={`mb-4 ${sectionHeading}`}>
          Favorites
          {favorites.length > 0 && (
            <span className="ml-2 align-middle font-sans text-sm font-medium tracking-normal text-muted-foreground tabular-nums">
              {favorites.length}
            </span>
          )}
        </h2>
        {favorites.length > 0 ? (
          <GameGrid games={favorites} />
        ) : (
          <EmptyState>
            Press Save on a game&apos;s page to keep it here.{" "}
            <Link href="/games" className="rounded-sm text-foreground underline underline-offset-2">
              Browse games
            </Link>
          </EmptyState>
        )}
      </section>
    </div>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-12 w-64 max-w-full" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <div>
        <Skeleton className="mb-4 h-8 w-48" />
        <GameGridSkeleton count={6} />
      </div>
    </div>
  );
}
