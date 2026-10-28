import { format } from "date-fns";
import { LogOutIcon, ShieldIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearHistoryButton } from "@/components/site/clear-history-button";
import { GameGrid, GameGridSkeleton } from "@/components/site/game-grid";
import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { providerNames } from "@/lib/auth-providers";
import { getFavorites, getRecentlyPlayed } from "@/lib/data/library";
import { timeAgo } from "@/lib/time-ago";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false },
};

const RECENT_LIMIT = 12;

const signInMethods: Record<string, string> = { ...providerNames, email: "email link" };

const sectionHeading = "font-display text-2xl font-extrabold tracking-tight [font-stretch:125%]";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile />
      </Suspense>
    </div>
  );
}

async function Profile() {
  const user = await requireUser("/profile");
  const [recent, favorites] = await Promise.all([
    getRecentlyPlayed(user.id, RECENT_LIMIT),
    getFavorites(user.id),
  ]);
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
            <Detail term="Member since">{format(new Date(user.created_at), "d MMM yyyy")}</Detail>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 sm:self-start">
          {user.role === "admin" && (
            <Button asChild variant="outline">
              <Link href="/admin">
                <ShieldIcon data-icon="inline-start" />
                Admin
              </Link>
            </Button>
          )}
          <form action={signOut}>
            <Button type="submit" variant="outline">
              <LogOutIcon data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </div>
      </section>

      <section aria-labelledby="recently-played">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="recently-played" className={sectionHeading}>
            Recently played
          </h2>
          {recent.length > 0 && <ClearHistoryButton />}
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
