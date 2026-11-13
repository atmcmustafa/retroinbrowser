"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSession } from "@/components/site/session-provider";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

// The signed-in parts of a page live in client state, so they're reset here; the action only
// ends the session and drops the cookies.
export function useSignOut() {
  const router = useRouter();
  const session = useSession();
  const [pending, startTransition] = useTransition();
  const run = () =>
    startTransition(async () => {
      await signOut();
      session.signedOut();
      router.push("/");
    });
  return [pending, run] as const;
}

export function SignOutButton({
  variant = "outline",
  size,
  icon = false,
}: {
  variant?: "outline" | "ghost";
  size?: "sm" | "lg";
  icon?: boolean;
}) {
  const [pending, run] = useSignOut();
  return (
    <Button type="button" variant={variant} size={size} disabled={pending} onClick={run}>
      {icon && <LogOutIcon data-icon="inline-start" />}
      Sign out
    </Button>
  );
}
