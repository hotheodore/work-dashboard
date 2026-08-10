import type { Job, Settings } from "./types";

type RawListing = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

/** Upstream schema lives in exactly one place — a field rename only touches this function. */
export function normalizeListing(raw: RawListing): Job | null {
  const company = str(raw.company_name) || str(raw.company);
  const role = str(raw.title) || str(raw.role);
  const url = str(raw.url) || str(raw.link);
  if (!company || !role || !url) return null;

  const posted = raw.date_posted ?? raw.date_updated;
  const postedAt =
    typeof posted === "number"
      ? new Date(posted * 1000).toISOString()
      : typeof posted === "string" && posted
        ? new Date(posted).toISOString()
        : new Date(0).toISOString();

  return {
    id: str(raw.id) || `${company}-${role}-${url}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    company,
    role,
    url,
    locations: arr(raw.locations),
    postedAt,
    season: str(raw.season) || undefined,
    sponsorship: str(raw.sponsorship) || undefined,
    terms: arr(raw.terms),
    active: raw.active !== false && raw.is_visible !== false,
  };
}

function matchScore(job: Job, keywords: string[]): number {
  if (!keywords.length) return 1;
  const hay = `${job.role} ${job.company}`.toLowerCase();
  return keywords.reduce((n, k) => (k && hay.includes(k.toLowerCase()) ? n + 1 : n), 0);
}

function locationOk(job: Job, s: Settings): boolean {
  const locs = job.locations.join(" ").toLowerCase();
  const isRemote = locs.includes("remote");
  if (s.remoteOnly) return isRemote;
  if (!s.locations.length) return true;
  return isRemote || s.locations.some((l) => l && locs.includes(l.toLowerCase()));
}

function seasonOk(job: Job, s: Settings): boolean {
  if (!s.season) return true;
  const want = s.season.toLowerCase();
  const have = `${job.season ?? ""} ${job.terms.join(" ")}`.toLowerCase();
  if (!have.trim()) return true; // upstream omitted it — don't silently drop the job
  return want.split(/\s+/).every((tok) => have.includes(tok));
}

export function filterJobs(jobs: Job[], s: Settings, seen: string[]): Job[] {
  const seenSet = new Set(seen);
  return jobs
    .filter((j) => j.active && !seenSet.has(j.id) && locationOk(j, s) && seasonOk(j, s))
    .map((j) => ({ job: j, score: matchScore(j, s.roleKeywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.job.postedAt.localeCompare(a.job.postedAt) || b.score - a.score)
    .map((x) => x.job);
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

