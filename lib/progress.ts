import type { Assignment } from "./types";
import { dayKey, shiftKey } from "./time";

/** Share of assignments marked done, 0-100. Pure — no I/O, safe to unit-check. */
export function completion(items: Assignment[]): number {
  if (!items.length) return 0;
  return (items.filter((a) => a.status === "done").length / items.length) * 100;
}

/** Consecutive days ending today that have at least one activity date.
 *  `dates` are already app-zone day keys — activityCounts produces them. */
export function streak(dates: string[], today = dayKey()): number {
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  let count = 0;
  let cursor = today;
  // today not counting yet is fine — start from today and walk back while active
  for (;;) {
    if (days.has(cursor)) count++;
    else if (count > 0 || cursor !== today) break;
    cursor = shiftKey(cursor, -1);
    if (count > 3650) break;
  }
  return count;
}
