import { dedupeJobs } from "../jobFilters";
import type { Job, Settings, SourceRun } from "../types";
import { simplify2026, vansh2027 } from "./github";
import { handshake } from "./handshake";
import { indeed } from "./indeed";
import type { JobSource } from "./types";

export const SOURCES: JobSource[] = [vansh2027, simplify2026, handshake, indeed];

const FETCH_TIMEOUT_MS = 25_000;

/**
 * Runs every configured source. One source failing (or having no credentials)
 * never fails the refresh — its outcome is reported and the others still land.
 * Sources earlier in SOURCES win ties during dedupe.
 */
export async function fetchAllSources(
  settings: Settings,
): Promise<{ jobs: Job[]; runs: SourceRun[] }> {
  const settled = await Promise.all(
    SOURCES.map(async (source): Promise<{ jobs: Job[]; run: SourceRun }> => {
      const base = { id: source.id, label: source.label };
      const cfg = source.configured();
      if (!cfg.ok)
        return {
          jobs: [],
          run: { ...base, status: "skipped", count: 0, detail: cfg.reason },
        };
      try {
        const jobs = await withTimeout(source.fetch(settings), FETCH_TIMEOUT_MS, source.label);
        return { jobs, run: { ...base, status: "ok", count: jobs.length } };
      } catch (e) {
        return {
          jobs: [],
          run: {
            ...base,
            status: "error",
            count: 0,
            detail: e instanceof Error ? e.message : "fetch failed",
          },
        };
      }
    }),
  );

  const jobs = dedupeJobs(settled.flatMap((s) => s.jobs)).sort((a, b) =>
    b.postedAt.localeCompare(a.postedAt),
  );

  return { jobs, runs: settled.map((s) => s.run) };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ]);
}

export type { JobSource } from "./types";
