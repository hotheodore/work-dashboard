/**
 * Single-password gate for the hosted deployment.
 *
 * The dashboard holds a resume, application history and an Anthropic API key,
 * so the public URL needs a lock. There is one user, so there is no user table:
 * DASHBOARD_PASSWORD is the whole credential. The cookie stores a SHA-256 of
 * the password, not the password itself, so a leaked cookie jar does not hand
 * over something typeable into the login form of a re-used password.
 *
 * Imported by `proxy.ts`, so this file must stay free of Node-only APIs.
 */

export const AUTH_COOKIE = "wd_auth";
export const LOGIN_PATH = "/login";

export const authRequired = () => Boolean(process.env.DASHBOARD_PASSWORD);

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Cookie value that proves knowledge of DASHBOARD_PASSWORD. */
export const expectedToken = () => sha256(process.env.DASHBOARD_PASSWORD ?? "");

export async function tokenFor(password: string): Promise<string | null> {
  if (!authRequired()) return null;
  const expected = await expectedToken();
  const candidate = await sha256(password);
  return timingSafeEqual(candidate, expected) ? candidate : null;
}

/** Constant-time compare of two equal-length hex digests. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
