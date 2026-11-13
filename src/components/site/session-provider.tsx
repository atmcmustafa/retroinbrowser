"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { Session, SessionUser } from "@/lib/session";
import { clearSessionHint, hasSessionHint } from "@/lib/session-hint";

type SessionState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "signed-in"; user: SessionUser };

type SessionContextValue = SessionState & {
  isFavorite: (gameId: string) => boolean;
  markFavorite: (gameId: string, saved: boolean) => void;
  signedOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const anonymous: Session = { user: null, favorites: [] };

async function loadSession(): Promise<Session> {
  if (!hasSessionHint()) return anonymous;
  const res = await fetch("/api/session", { cache: "no-store" });
  if (!res.ok) return anonymous;
  const session = (await res.json()) as Session;
  if (!session.user) clearSessionHint();
  return session;
}

// Pages are prerendered signed out; the user is looked up once per page load, and only when the
// session hint says someone might be signed in.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading", user: null });
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    loadSession()
      .catch(() => anonymous)
      .then((session) => {
        if (cancelled) return;
        setFavorites(new Set(session.favorites));
        setState(
          session.user
            ? { status: "signed-in", user: session.user }
            : { status: "anonymous", user: null },
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback((gameId: string) => favorites.has(gameId), [favorites]);
  const markFavorite = useCallback((gameId: string, saved: boolean) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (saved) next.add(gameId);
      else next.delete(gameId);
      return next;
    });
  }, []);
  const signedOut = useCallback(() => {
    setFavorites(new Set());
    setState({ status: "anonymous", user: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, isFavorite, markFavorite, signedOut }),
    [state, isFavorite, markFavorite, signedOut],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error("useSession needs a SessionProvider");
  return value;
}
