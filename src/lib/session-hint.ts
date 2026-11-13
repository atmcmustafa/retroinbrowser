// Pages are static and render signed out. This readable flag sits next to the HttpOnly session
// cookie so the browser only asks /api/session who is signed in when someone might be; anonymous
// visitors never make that request. It holds no secret: the session cookie decides.
export const SESSION_HINT = "rib-signed-in";

// Same lifetime as the Supabase session cookies.
export const sessionHintMaxAge = 400 * 24 * 60 * 60;

export function hasSessionHint() {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${SESSION_HINT}=`));
}

export function clearSessionHint() {
  document.cookie = `${SESSION_HINT}=; Max-Age=0; Path=/; SameSite=Lax`;
}
