/** The dashboard header line. Rotates per request so the page has a pulse,
 *  but stays anchored to the hour — a 2am "Good morning" reads as a bug, and
 *  a joke about lunch at midnight reads as one too.
 *
 *  Server-only in practice: DashboardPage is force-dynamic, so the pick is made
 *  fresh on every request and there is no client/server text mismatch to
 *  hydrate around. If this is ever used in a client component, pass the chosen
 *  string down rather than calling it on both sides.
 */

import { hourOfDay } from "./time";

type Slot = "night" | "morning" | "afternoon" | "evening";

function slot(hour: number): Slot {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** Roughly half plain, half comedic — enough straight lines that the jokes
 *  land as a surprise instead of as the house style. */
const LINES: Record<Slot, string[]> = {
  night: [
    "Still up",
    "Technically morning",
    "The deadline is not moving",
    "Sleep is also a deliverable",
    "Late shift",
    "Nobody is grading effort at this hour",
  ],
  morning: [
    "Good morning",
    "Morning",
    "Fresh start, same backlog",
    "Coffee first, then the list",
    "Early enough to count",
    "The day is undefeated so far",
  ],
  afternoon: [
    "Good afternoon",
    "Afternoon",
    "Peak productivity, allegedly",
    "Halfway there",
    "The list has not read itself",
    "Post-lunch, pre-panic",
  ],
  evening: [
    "Good evening",
    "Evening",
    "Winding down",
    "One more, then dinner",
    "Tomorrow's you is watching",
    "The assignments have not moved on their own",
  ],
};

export function greeting(date = new Date()): string {
  const pool = LINES[slot(hourOfDay(date))];
  return pool[Math.floor(Math.random() * pool.length)];
}
