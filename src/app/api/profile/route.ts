import { getCurrentUser } from "@/lib/auth";
import { getFavorites, getRecentlyPlayed } from "@/lib/data/library";

const RECENT_LIMIT = 12;
const noStore = { "Cache-Control": "private, no-store" };

async function loadProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [recent, favorites] = await Promise.all([
    getRecentlyPlayed(user.id, RECENT_LIMIT),
    getFavorites(user.id),
  ]);
  return {
    user: {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.role === "admin",
      createdAt: user.created_at,
      providers: user.providers,
    },
    recent,
    favorites,
  };
}

export type Profile = NonNullable<Awaited<ReturnType<typeof loadProfile>>>;

export async function GET() {
  const profile = await loadProfile();
  if (!profile) return Response.json({ error: "Signed out." }, { status: 401, headers: noStore });
  return Response.json(profile, { headers: noStore });
}
