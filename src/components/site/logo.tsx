import { Gamepad2Icon } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 rounded-sm font-display text-base font-extrabold tracking-tight [font-stretch:125%] sm:text-lg"
    >
      <Gamepad2Icon aria-hidden className="size-5 text-primary" />
      RetroInBrowser
    </Link>
  );
}
