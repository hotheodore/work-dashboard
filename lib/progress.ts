import type { Assignment } from "./types";

/** Share of assignments marked done, 0-100. Pure — no I/O, safe to unit-check. */
export function completion(items: Assignment[]): number {
  if (!items.length) return 0;
  return (items.filter((a) => a.status === "done").length / items.length) * 100;
}

/** Consecutive days ending today that have at least one activity date. */
export function streak(dates: string[], today = new Date()): number {
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  let count = 0;
  const cursor = new Date(today);
  // today not counting yet is fine — start from today and walk back while active
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) count++;
    else if (count > 0 || key !== today.toISOString().slice(0, 10)) break;
    cursor.setDate(cursor.getDate() - 1);
    if (count > 3650) break;
  }
  return count;
}
