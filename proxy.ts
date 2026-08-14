import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, LOGIN_PATH, authRequired, expectedToken, timingSafeEqual } from "@/lib/auth";

/** App identity: the manifest and the icons. The browser fetches these without
 *  credentials when installing to a home screen, so gating them redirects the
 *  fetch to /login and the installed app gets a blank icon and the host name
 *  instead of the Workbench mark. Nothing private is in them. */
function isPublicAsset(pathname: string): boolean {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    /^\/icon-(?:192|512|maskable-512)\.png$/.test(pathname)
  );
}

/**
 * Password gate for the hosted deployment. Off entirely when DASHBOARD_PASSWORD
 * is unset, so `next dev` stays a one-command local dashboard.
 */
export async function proxy(request: NextRequest) {
  if (!authRequired()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === LOGIN_PATH || isPublicAsset(pathname)) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token && timingSafeEqual(token, await expectedToken())) return NextResponse.next();

  // Vercel Cron calls the refresh route with the project's CRON_SECRET.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) {
    return NextResponse.next();
  }

  // API routes get a status, not a redirect into an HTML page.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const login = new URL(LOGIN_PATH, request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next's own static output and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
