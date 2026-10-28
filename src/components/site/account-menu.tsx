"use client";

import { LogOutIcon, ShieldIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { UserAvatar } from "@/components/site/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

type AccountUser = { name: string; email: string | null; avatar: string | null; isAdmin: boolean };

// Brings the visitor back to the page they were on after signing in.
export function SignInButton() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = pathname + (search ? `?${search}` : "");
  const href = pathname === "/" ? "/login" : `/login?next=${encodeURIComponent(here)}`;

  return (
    <Button asChild>
      <Link href={href}>Sign in</Link>
    </Button>
  );
}

export function AccountMenu({ user }: { user: AccountUser }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account" className="rounded-full">
          <UserAvatar name={user.name} src={user.avatar} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon />
            Profile
          </Link>
        </DropdownMenuItem>
        {user.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldIcon />
              Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={() => startTransition(() => signOut())}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
