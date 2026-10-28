import Link from "next/link";
import { InfoBox } from "@/components/site/info-box";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";

const link = "rounded-sm font-medium text-foreground underline underline-offset-2";

export async function LibraryBox() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <InfoBox label="Keep your games">
        <Link href="/login" className={link}>
          Sign in
        </Link>{" "}
        with Google or Discord to save favorites and keep a list of the games you played.
      </InfoBox>
    );
  }

  return (
    <InfoBox label="Your library">
      Your favorites and recently played games are on{" "}
      <Link href="/profile" className={link}>
        your profile
      </Link>
      .
    </InfoBox>
  );
}

export function LibraryBoxSkeleton() {
  return <Skeleton aria-hidden className="h-[6.5rem] rounded-lg" />;
}
