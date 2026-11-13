import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/data/library";
import type { Session } from "@/lib/session";
import { SESSION_HINT } from "@/lib/session-hint";

const noStore = { "Cache-Control": "private, no-store" };

// The browser calls this only while the session hint is set, so anonymous visitors never do.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    (await cookies()).delete(SESSION_HINT);
    return Response.json({ user: null, favorites: [] } satisfies Session, { headers: noStore });
  }

  const session: Session = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.role === "admin",
    },
    favorites: await getFavoriteIds(user.id),
  };
  return Response.json(session, { headers: noStore });
}
