import type { Assignment } from "./types";

export interface ClassGrade {
  gradedWeight: number; // weight % that has a grade
  totalWeight: number; // weight % of every assignment entered
  earned: number; // weighted points earned so far
  current: number | null; // grade over graded work only
  projected: number | null; // remaining work at `current`; null until weights cover the course
  completion: number; // 0-100, share of assignments marked done
}

/** Weighted grade math. Pure — no I/O, safe to unit-check. */
export function classGrade(items: Assignment[]): ClassGrade {
  const graded = items.filter((a) => typeof a.grade === "number");
  const gradedWeight = graded.reduce((s, a) => s + a.weight, 0);
  const earned = graded.reduce((s, a) => s + (a.grade as number) * (a.weight / 100), 0);
  const current = gradedWeight > 0 ? (earned / (gradedWeight / 100)) : null;

  const totalWeight = items.reduce((s, a) => s + a.weight, 0);
  const remaining = Math.max(0, totalWeight - gradedWeight);
  // Only project when the entered weights actually cover the course — otherwise
  // "projected final" would just report how much of the syllabus is typed in.
  const projected =
    current === null || totalWeight < 95 ? null : earned + current * (remaining / 100);

  const done = items.filter((a) => a.status === "done").length;
  const completion = items.length ? (done / items.length) * 100 : 0;

  return { gradedWeight, totalWeight, earned, current, projected, completion };
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
