import { AccountMenu, SignInButton } from "@/components/site/account-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";

// Reads the session, so it renders per request inside a Suspense boundary; the rest of the
// header stays in the static shell.
export async function AccountControl() {
  const user = await getCurrentUser();
  if (!user) return <SignInButton />;

  return (
    <AccountMenu
      user={{
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.role === "admin",
      }}
    />
  );
}

export function AccountControlSkeleton() {
  return <Skeleton aria-hidden className="h-8 w-[4.5rem] rounded-lg" />;
}
