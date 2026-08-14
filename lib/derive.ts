import type { Application, Assignment, Klass } from "./types";
import { APP_STAGES } from "./types";

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** One row per day: a `day` label plus one numeric column per class id. */
export interface TimelinePoint {
  day: string;
  [classId: string]: string | number;
}

/** Next `days` days, one row per day, one numeric column per class id. */
export function timelineData(
  assignments: Assignment[],
  classes: Klass[],
  days = 14,
): TimelinePoint[] {
  const rows: TimelinePoint[] = [];
  const start = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = dayKey(d);
    const row: TimelinePoint = {
      day: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
    };
    for (const c of classes) {
      row[c.id] = assignments.filter(
        (a) => a.classId === c.id && a.status !== "done" && a.dueDate === key,
      ).length;
    }
    rows.push(row);
  }
  return rows;
}

export function completionData(assignments: Assignment[], classes: Klass[]) {
  return classes.map((c) => {
    const mine = assignments.filter((a) => a.classId === c.id);
    return {
      name: c.code || c.name,
      done: mine.filter((a) => a.status === "done").length,
      pending: mine.filter((a) => a.status !== "done").length,
    };
  });
}

export function funnelData(apps: Application[]) {
  const rank: Record<string, number> = { applied: 0, oa: 1, interview: 2, offer: 3 };
  const labels: Record<string, string> = {
    applied: "Applied",
    oa: "OA",
    interview: "Interview",
    offer: "Offer",
  };
  return APP_STAGES.map((stage) => ({
    stage: labels[stage],
    // funnel semantics: reaching interview implies having applied
    count: apps.filter((a) => a.status !== "rejected" && rank[a.status] >= rank[stage]).length,
  }));
}

/** Heatmap counts: an assignment completed or an application submitted both count as activity. */
export function activityCounts(assignments: Assignment[], apps: Application[]) {
  const counts: Record<string, number> = {};
  const bump = (iso?: string | null) => {
    if (!iso) return;
    const key = iso.slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  };
  assignments.forEach((a) => bump(a.completedAt));
  apps.forEach((a) => bump(a.appliedAt));
  return counts;
}

export interface Deadline {
  id: string;
  label: string;
  sub: string;
  date: string; // YYYY-MM-DD
  daysOut: number;
  kind: "assignment" | "application";
  /** Assignments only — drives the class identity color on the timeline row. */
  classId?: string;
}

export function deadlines(
  assignments: Assignment[],
  apps: Application[],
  classes: Klass[],
  limit = 30,
): Deadline[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysOut = (date: string) =>
    Math.round((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86_400_000);

  const items: Deadline[] = [
    ...assignments
      .filter((a) => a.status !== "done")
      .map((a) => ({
        id: a.id,
        label: a.title,
        sub: classes.find((c) => c.id === a.classId)?.code ?? "Class",
        date: a.dueDate,
        daysOut: daysOut(a.dueDate),
        kind: "assignment" as const,
        classId: a.classId,
      })),
    ...apps
      .filter((a) => a.deadline)
      .map((a) => ({
        id: a.id,
        label: a.role,
        sub: a.company,
        date: a.deadline as string,
        daysOut: daysOut(a.deadline as string),
        kind: "application" as const,
      })),
  ];

  return items
    .filter((i) => i.daysOut >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export interface DeadlineGroup {
  key: "today" | "tomorrow" | "week" | "later";
  label: string;
  items: Deadline[];
}

/** Buckets an already-sorted deadline list by urgency. Empty groups are dropped
 *  so the timeline never shows a header with nothing under it. */
export function groupDeadlines(items: Deadline[]): DeadlineGroup[] {
  const groups: DeadlineGroup[] = [
    { key: "today", label: "Today", items: [] },
    { key: "tomorrow", label: "Tomorrow", items: [] },
    { key: "week", label: "This week", items: [] },
    { key: "later", label: "Later", items: [] },
  ];
  for (const i of items) {
    if (i.daysOut === 0) groups[0].items.push(i);
    else if (i.daysOut === 1) groups[1].items.push(i);
    else if (i.daysOut <= 7) groups[2].items.push(i);
    else groups[3].items.push(i);
  }
  return groups.filter((g) => g.items.length);
}

export function urgencyTone(daysOut: number): "danger" | "warn" | "default" {
  if (daysOut <= 1) return "danger";
  if (daysOut <= 4) return "warn";
  return "default";
}
