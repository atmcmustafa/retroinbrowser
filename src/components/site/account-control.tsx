"use client";

import { AccountMenu, SignInButton } from "@/components/site/account-menu";
import { useSession } from "@/components/site/session-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountControl() {
  const session = useSession();
  if (session.status === "loading") return <AccountControlSkeleton />;
  if (!session.user) return <SignInButton />;
  return <AccountMenu user={session.user} />;
}

export function AccountControlSkeleton() {
  return <Skeleton aria-hidden className="h-8 w-[4.5rem] rounded-lg" />;
}
