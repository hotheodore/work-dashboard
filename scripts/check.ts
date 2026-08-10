/** Smallest thing that fails if the grade / streak / job-filter logic breaks: npm run check */
import assert from "node:assert/strict";
import { classGrade, streak } from "../lib/grades";
import { dedupeJobs, filterJobs, normalizeListing, todayKey } from "../lib/jobFilters";
import type { Assignment, Job, Settings } from "../lib/types";

const a = (p: Partial<Assignment>): Assignment => ({
  id: Math.random().toString(36).slice(2),
  classId: "c1",
  title: "x",
  dueDate: "2026-01-01",
  weight: 0,
  status: "todo",
  grade: null,
  completedAt: null,
  ...p,
});

// --- grades ---
const partial = classGrade([
  a({ weight: 30, status: "done", grade: 88 }),
  a({ weight: 20 }),
]);
assert.equal(partial.current, 88);
assert.equal(partial.projected, null, "projection must stay null until weights cover the course");
assert.equal(partial.completion, 50);

const full = classGrade([
  a({ weight: 50, status: "done", grade: 90 }),
  a({ weight: 50, status: "done", grade: 70 }),
]);
assert.equal(full.current, 80);
assert.equal(full.projected, 80);

// ungraded work is projected at the current average once weights cover the course
const mixed = classGrade([
  a({ weight: 40, status: "done", grade: 100 }),
  a({ weight: 60 }),
]);
assert.equal(mixed.current, 100);
assert.equal(mixed.projected, 100);
assert.equal(classGrade([]).current, null);

// --- streak ---
const day = (n: number) => {
  const d = new Date("2026-08-10T12:00:00");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const at = new Date("2026-08-10T12:00:00");
assert.equal(streak([day(0), day(1), day(2)], at), 3);
assert.equal(streak([day(1), day(2)], at), 2, "a streak ending yesterday still counts");
assert.equal(streak([day(0), day(2)], at), 1, "a gap ends the streak");
assert.equal(streak([], at), 0);

// --- listings ---
const raw = normalizeListing({
  id: "j1",
  company_name: "Acme",
  title: "Software Engineer Intern",
  url: "https://example.com/j1",
  locations: ["Remote"],
  date_posted: 1_760_000_000,
  terms: ["Summer 2027"],
  active: true,
});
assert.ok(raw, "a well-formed listing must normalize");
assert.equal(raw.company, "Acme");
assert.equal(raw.id, "github:j1", "ids are namespaced by source");
assert.equal(raw.source, "github");
assert.equal(normalizeListing({ company_name: "Acme" }), null, "no role/url means no job");

const jobs: Job[] = [
  raw,
  { ...raw, id: "j2", role: "Marketing Intern" },
  { ...raw, id: "j3", terms: ["Summer 2026"] },
  { ...raw, id: "j4", locations: ["Seattle, WA"] },
  { ...raw, id: "j5", active: false },
];
const settings: Settings = {
  roleKeywords: ["software"],
  locations: [],
  remoteOnly: true,
  season: "Summer 2027",
  picksPerDay: 5,
};
assert.deepEqual(
  filterJobs(jobs, settings, []).map((j) => j.id),
  ["github:j1"],
  "keyword, season, remote, and active filters must all apply",
);
assert.deepEqual(filterJobs(jobs, settings, ["github:j1"]), [], "seen jobs never come back");

// --- multi-source dedupe ---
assert.deepEqual(
  dedupeJobs([
    { ...raw, id: "vansh2027:a", source: "vansh2027" },
    { ...raw, id: "simplify2026:a", source: "simplify2026" }, // same url
    { ...raw, id: "simplify2026:b", url: "https://example.com/j2" },
    { ...raw, id: "simplify2026:c", active: false },
  ]).map((j) => j.id),
  ["vansh2027:a", "simplify2026:b"],
  "same apply URL collapses to the first source; inactive postings drop",
);

assert.match(todayKey(new Date(2026, 0, 5)), /^2026-01-05$/);

console.log("checks passed");
