import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env.server";

function matches(token: string, secret: string) {
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Scripts, SQL and dashboard edits bypass the admin actions' updateTag; they call this instead.
export async function POST(request: NextRequest) {
  const secret = serverEnv.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "REVALIDATE_SECRET is not set" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!matches(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  for (const tag of ["games", "taxonomy"]) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
