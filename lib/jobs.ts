import "server-only";
import * as store from "./store";
import { filterJobs, normalizeListing, todayKey } from "./jobFilters";
import type { Job } from "./types";

export const LISTINGS_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json";

const REFRESH_MS = 12 * 60 * 60 * 1000; // at most one upstream fetch per 12h

export async function refreshListings(force = false) {
  const cache = await store.getListings();
  const fresh =
    cache.fetchedAt && Date.now() - new Date(cache.fetchedAt).getTime() < REFRESH_MS;
  if (fresh && !force && cache.jobs.length) return cache;

  const res = await fetch(LISTINGS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`listings fetch failed: ${res.status}`);
  const raw = (await res.json()) as Record<string, unknown>[];

  const jobs = raw
    .map(normalizeListing)
    .filter((j): j is Job => j !== null && j.active)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  const next = { fetchedAt: new Date().toISOString(), jobs };
  await store.setListings(next);
  return next;
}

/**
 * Today's picks, persisted so a refresh never reshuffles the list.
 * Returns fewer than picksPerDay when filters are too tight — never pads.
 */
export async function getDailyPicks(): Promise<{ jobs: Job[]; matchPool: number }> {
  const [settings, cache, seen, picks] = await Promise.all([
    store.getSettings(),
    store.getListings(),
    store.getSeenJobs(),
    store.getDailyPicks(),
  ]);

  const byId = new Map(cache.jobs.map((j) => [j.id, j]));
  const seenSet = new Set(seen);
  const today = todayKey();
  const eligible = filterJobs(cache.jobs, settings, seen);

  // An empty stored list means nothing matched when we last looked (no listings
  // cached yet, filters too tight) — retry rather than serving an empty day.
  let ids = (picks[today] ?? []).filter((id) => byId.has(id));
  if (!ids.length) {
    ids = eligible.slice(0, settings.picksPerDay).map((j) => j.id);
    if (ids.length) await store.setDailyPicks({ ...picks, [today]: ids });
  }

  return {
    // handled picks drop off the list, but stay in today's slate so skipping
    // one never buys a replacement
    jobs: ids.filter((id) => !seenSet.has(id)).map((id) => byId.get(id)!),
    matchPool: eligible.length,
  };
}
