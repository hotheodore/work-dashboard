import "server-only";
import { clearGoogleTokens, getGoogleTokens, setGoogleTokens } from "./store";
import type { CalendarEvent, GoogleTokens } from "./types";

/**
 * Read-only Google Calendar for the one account this dashboard belongs to.
 * Plain REST over fetch rather than the googleapis SDK — the same shape every
 * other integration here uses, and Calendar needs three endpoints total.
 *
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  — OAuth client (Web application)
 *   GOOGLE_REDIRECT_URI                      — must match the console exactly,
 *                                              e.g. http://localhost:3000/api/google/callback
 *
 * The refresh token is the connection and lives in storage; the access token is
 * cached beside it so most requests skip the token round trip.
 */

const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const API = "https://www.googleapis.com/calendar/v3";

const clientId = () => process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = () => process.env.GOOGLE_REDIRECT_URI || "";

/** Same {ok, reason} contract lib/sources adapters use, so Settings can print it. */
export function configured(): { ok: boolean; reason?: string } {
  const missing = [
    !clientId() && "GOOGLE_CLIENT_ID",
    !clientSecret() && "GOOGLE_CLIENT_SECRET",
    !redirectUri() && "GOOGLE_REDIRECT_URI",
  ].filter(Boolean);
  return missing.length
    ? { ok: false, reason: `Set ${missing.join(", ")} in .env.local, then restart the dev server` }
    : { ok: true };
}

export async function connection(): Promise<GoogleTokens | null> {
  const t = await getGoogleTokens();
  return t?.refreshToken ? t : null;
}

export function authUrl(): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  // Google only issues a refresh token on a consent screen it actually shows,
  // so force one — otherwise reconnecting silently yields no refresh token.
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error)
    throw new Error(data.error_description || data.error || `${res.status} ${res.statusText}`);
  return data;
}

const expiryFrom = (seconds = 3600) =>
  // 60s of slack so a token that expires mid-request is treated as already gone.
  new Date(Date.now() + (seconds - 60) * 1000).toISOString();

/** Completes the OAuth dance and persists the connection. */
export async function exchangeCode(code: string): Promise<void> {
  const data = await tokenRequest({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: redirectUri(),
    grant_type: "authorization_code",
  });
  if (!data.refresh_token)
    throw new Error("Google returned no refresh token — revoke the app's access and connect again");

  const tokens: GoogleTokens = {
    refreshToken: data.refresh_token,
    accessToken: data.access_token,
    accessTokenExpiry: data.access_token ? expiryFrom(data.expires_in) : undefined,
    connectedAt: new Date().toISOString(),
  };
  tokens.account = data.access_token ? await accountEmail(data.access_token) : undefined;
  await setGoogleTokens(tokens);
}

/** Best-effort label for the Settings row; a failure here must not break connecting. */
async function accountEmail(accessToken: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${API}/calendars/primary`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { id?: string };
    return data.id;
  } catch {
    return undefined;
  }
}

export async function disconnect(): Promise<void> {
  await clearGoogleTokens();
}

async function accessToken(): Promise<string> {
  const tokens = await connection();
  if (!tokens) throw new Error("Google Calendar is not connected");

  const fresh =
    tokens.accessToken &&
    tokens.accessTokenExpiry &&
    new Date(tokens.accessTokenExpiry).getTime() > Date.now();
  if (fresh) return tokens.accessToken as string;

  const data = await tokenRequest({
    refresh_token: tokens.refreshToken,
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "refresh_token",
  });
  if (!data.access_token) throw new Error("Google returned no access token");

  await setGoogleTokens({
    ...tokens,
    accessToken: data.access_token,
    accessTokenExpiry: expiryFrom(data.expires_in),
  });
  return data.access_token;
}

async function api<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

type CalendarListEntry = {
  id: string;
  summary?: string;
  summaryOverride?: string;
  backgroundColor?: string;
  selected?: boolean;
  deleted?: boolean;
};

type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

/** Local-midnight bounds for the given day, as the RFC3339 Google wants. */
function dayBounds(now = new Date()): { timeMin: string; timeMax: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

function toEvent(raw: GoogleEvent, cal: CalendarListEntry): CalendarEvent | null {
  const start = raw.start?.dateTime ?? raw.start?.date;
  const end = raw.end?.dateTime ?? raw.end?.date;
  if (!start || !end || raw.status === "cancelled") return null;
  return {
    id: `${cal.id}:${raw.id}`,
    calendarId: cal.id,
    calendarLabel: cal.summaryOverride || cal.summary || cal.id,
    calendarColor: cal.backgroundColor,
    title: raw.summary || "(no title)",
    start,
    end,
    allDay: !raw.start?.dateTime,
    location: raw.location,
    url: raw.htmlLink,
  };
}

/**
 * Every event on every calendar for today, sorted. One calendar failing is
 * dropped rather than blanking the card — same isolation as fetchAllSources.
 */
export async function fetchTodayEvents(now = new Date()): Promise<CalendarEvent[]> {
  const token = await accessToken();
  const { timeMin, timeMax } = dayBounds(now);

  const list = await api<{ items?: CalendarListEntry[] }>("/users/me/calendarList", token);
  const calendars = (list.items ?? []).filter((c) => !c.deleted && c.selected !== false);

  const perCalendar = await Promise.all(
    calendars.map(async (cal) => {
      const query = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true", // expand recurring series into occurrences
        orderBy: "startTime",
        maxResults: "50",
      });
      try {
        const data = await api<{ items?: GoogleEvent[] }>(
          `/calendars/${encodeURIComponent(cal.id)}/events?${query}`,
          token,
        );
        return (data.items ?? [])
          .map((e) => toEvent(e, cal))
          .filter((e): e is CalendarEvent => e !== null);
      } catch {
        return [];
      }
    }),
  );

  // All-day events first, then by start time — matches how Google itself stacks them.
  return perCalendar.flat().sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    return a.start.localeCompare(b.start);
  });
}
