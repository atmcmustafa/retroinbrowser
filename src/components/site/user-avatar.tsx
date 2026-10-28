import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

// Provider CDNs (Google in particular) can refuse images requested with a foreign referrer.
export function UserAvatar({
  name,
  src,
  large = false,
}: {
  name: string;
  src: string | null;
  large?: boolean;
}) {
  return (
    <Avatar className={large ? "size-20" : "size-8"}>
      {src && <AvatarImage src={src} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn("font-semibold", large && "text-2xl")}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
