/**
 * One timezone for the whole app.
 *
 * Every date the user sees is a *calendar* date in their zone, not an instant:
 * "due today", "this week", the streak, the heatmap cell. Server components
 * render on Vercel, whose system zone is UTC, so anything derived from the
 * ambient zone (`new Date().getDate()`, `toISOString().slice(0, 10)`, a bare
 * `toLocaleDateString`) is up to a day off for the reader from ~7pm onward.
 *
 * So: day keys come from `dayKey`, day arithmetic from `shiftKey`/`daysBetween`
 * (pure calendar math — immune to the 23- and 25-hour DST days), and display
 * from the `format*` helpers, which pin both locale and zone so the server and
 * the client produce byte-identical text and hydration stays quiet.
 */

export const APP_TZ = process.env.NEXT_PUBLIC_APP_TZ || "America/Chicago";

/** Fixed so server and client agree; the zone is what varies, not the language. */
const LOCALE = "en-US";

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
}

/** Wall-clock fields in APP_TZ for the given instant. */
export function zonedParts(d: Date = new Date()): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of PARTS.formatToParts(d)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  // hour12:false renders midnight as 24 in some engines.
  if (out.hour === 24) out.hour = 0;
  return out as unknown as ZonedParts;
}

/** `YYYY-MM-DD` for the given instant, in APP_TZ. The app's day identity. */
export function dayKey(d: Date = new Date()): string {
  const { year, month, day } = zonedParts(d);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Hour of day, 0-23, in APP_TZ. */
export function hourOfDay(d: Date = new Date()): number {
  return zonedParts(d).hour;
}

function keyParts(key: string): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

/** Calendar arithmetic on a day key. DST-safe: no instants involved. */
export function shiftKey(key: string, days: number): string {
  const [y, m, d] = keyParts(key);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(
    t.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = keyParts(from);
  const [ty, tm, td] = keyParts(to);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Day of week for a day key, 0 = Sunday. */
export function weekdayOf(key: string): number {
  const [y, m, d] = keyParts(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The instant of midnight in APP_TZ on the given day key.
 *  Resolved twice so a DST boundary between the guess and the answer corrects
 *  itself rather than landing an hour off. */
export function startOfDay(key: string): Date {
  const [y, m, d] = keyParts(key);
  const wall = Date.UTC(y, m - 1, d);
  const guess = new Date(wall - offsetMs(new Date(wall)));
  return new Date(wall - offsetMs(guess));
}

/** APP_TZ's offset from UTC at the given instant, in ms (positive east). */
function offsetMs(d: Date): number {
  const p = zonedParts(d);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUTC - Math.floor(d.getTime() / 1000) * 1000;
}

function asDate(d: Date | string): Date {
  // A bare day key has no time part — anchor it at APP_TZ midnight rather than
  // letting the engine read it as UTC midnight and format it a day early.
  if (typeof d === "string") return /^\d{4}-\d{2}-\d{2}$/.test(d) ? startOfDay(d) : new Date(d);
  return d;
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions): string {
  return asDate(d).toLocaleDateString(LOCALE, { ...opts, timeZone: APP_TZ });
}

export function formatTime(d: Date | string, opts: Intl.DateTimeFormatOptions): string {
  return asDate(d).toLocaleTimeString(LOCALE, { ...opts, timeZone: APP_TZ });
}

export function formatDateTime(d: Date | string): string {
  return asDate(d).toLocaleString(LOCALE, { timeZone: APP_TZ });
}
