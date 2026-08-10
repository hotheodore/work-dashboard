import "server-only";
import * as store from "./store";
import { filterJobs, todayKey } from "./jobFilters";
import { fetchAllSources } from "./sources";
import type { Job, ListingsCache } from "./types";

const REFRESH_MS = 12 * 60 * 60 * 1000; // at most one upstream fetch per 12h

/**
 * Pulls every configured source (see `lib/sources`), merges and dedupes.
 * Throws only when *no* source produced anything — a partial run is kept, with
 * each source's outcome recorded in `cache.sources`.
 */
export async function refreshListings(force = false): Promise<ListingsCache> {
  const [cache, settings] = await Promise.all([store.getListings(), store.getSettings()]);
  const fresh =
    cache.fetchedAt && Date.now() - new Date(cache.fetchedAt).getTime() < REFRESH_MS;
  if (fresh && !force && cache.jobs.length) return cache;

  const { jobs, runs } = await fetchAllSources(settings);

  if (!jobs.length) {
    const why = runs
      .filter((r) => r.status !== "ok")
      .map((r) => `${r.label}: ${r.detail ?? r.status}`)
      .join("; ");
    throw new Error(`every listings source came back empty — ${why || "no sources configured"}`);
  }

  const next: ListingsCache = { fetchedAt: new Date().toISOString(), jobs, sources: runs };
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
