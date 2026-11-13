// What /api/session returns: the signed-in user and their saved games, for the browser.
export type SessionUser = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  isAdmin: boolean;
};

export type Session = { user: SessionUser | null; favorites: string[] };
