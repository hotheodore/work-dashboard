import type { Job, Settings } from "../types";
import { arr, locationFrom, queryFrom, slugId, str, toIso, type JobSource } from "./types";

/**
 * Indeed retired its open publisher API and its site blocks datacenter traffic
 * (a plain server-side fetch of indeed.com returns 403), so postings have to
 * come through a search provider you hold a key for. Two ways to configure it:
 *
 *   SERPAPI_KEY=...                     — uses SerpApi's `indeed` engine
 *   INDEED_SEARCH_URL=https://…{query}…{location}   — any JSON search endpoint
 *   INDEED_API_KEY=...                  — optional, sent as `Authorization: Bearer`
 *
 * `{query}` and `{location}` in INDEED_SEARCH_URL are replaced with the
 * URL-encoded values derived from your filters. The parser accepts the common
 * envelope keys, so most providers work without code changes.
 */

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});

const serpKey = () => process.env.SERPAPI_KEY || "";
const customUrl = () => process.env.INDEED_SEARCH_URL || "";

function endpoint(settings: Settings): string {
  const query = queryFrom(settings);
  const location = locationFrom(settings);
  if (customUrl())
    return customUrl()
      .replace("{query}", encodeURIComponent(query))
      .replace("{location}", encodeURIComponent(location));

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "indeed");
  url.searchParams.set("q", query);
  if (location) url.searchParams.set("l", location);
  url.searchParams.set("api_key", serpKey());
  return url.toString();
}

function pickList(payload: unknown): Raw[] {
  const root = obj(payload);
  for (const key of ["jobs_results", "results", "jobs", "data", "hits"]) {
    const v = root[key];
    if (Array.isArray(v)) return v.map(obj);
  }
  return Array.isArray(payload) ? (payload as Raw[]).map(obj) : [];
}

function toJob(raw: Raw): Job | null {
  const company = str(raw.company_name) || str(raw.company) || str(obj(raw.employer).name);
  const role = str(raw.title) || str(raw.job_title);
  const url =
    str(raw.link) || str(raw.job_link) || str(raw.url) || str(raw.apply_link) || str(raw.share_link);
  if (!company || !role || !url) return null;

  const locations = arr(raw.locations).length
    ? arr(raw.locations)
    : [str(raw.location) || str(raw.formattedLocation)].filter(Boolean);

  return {
    id: slugId("indeed", str(raw.job_id) || str(raw.id) || `${company}-${role}`),
    company,
    role,
    url,
    locations,
    postedAt: toIso(raw.date_posted ?? raw.posted_at ?? raw.created_at),
    season: undefined,
    sponsorship: undefined,
    terms: arr(raw.detected_extensions ? [] : raw.job_types),
    active: true,
    source: "indeed",
  };
}

export const indeed: JobSource = {
  id: "indeed",
  label: "Indeed",
  configured: () =>
    serpKey() || customUrl()
      ? { ok: true }
      : {
          ok: false,
          reason:
            "Indeed has no open API — set SERPAPI_KEY, or INDEED_SEARCH_URL for another JSON search provider",
        },

  async fetch(settings: Settings) {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.INDEED_API_KEY) headers.Authorization = `Bearer ${process.env.INDEED_API_KEY}`;

    const res = await fetch(endpoint(settings), { cache: "no-store", headers });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const payload = await res.json();
    const error = str(obj(payload).error);
    if (error) throw new Error(error);

    return pickList(payload)
      .map(toJob)
      .filter((j): j is Job => j !== null);
  },
};
