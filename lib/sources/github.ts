import { normalizeListing } from "../jobFilters";
import type { Job } from "../types";
import type { JobSource } from "./types";

/**
 * The community internship repos publish the same `listings.json` schema, so
 * one adapter covers all of them — only the raw URL differs.
 */
function githubSource(id: string, label: string, url: string): JobSource {
  return {
    id,
    label,
    configured: () => ({ ok: true }),
    async fetch() {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const raw = (await res.json()) as Record<string, unknown>[];
      if (!Array.isArray(raw)) throw new Error("expected a JSON array of listings");
      return raw.map((r) => normalizeListing(r, id)).filter((j): j is Job => j !== null);
    },
  };
}

export const simplify2026 = githubSource(
  "simplify2026",
  "SimplifyJobs/Summer2026-Internships",
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
);

export const vansh2027 = githubSource(
  "vansh2027",
  "vanshb03/Summer2027-Internships",
  "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/.github/scripts/listings.json",
);
