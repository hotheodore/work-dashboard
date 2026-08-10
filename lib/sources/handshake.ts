import type { Job, Settings } from "../types";
import { arr, locationFrom, queryFrom, slugId, str, toIso, type JobSource } from "./types";

/**
 * Handshake has no public API for students — postings live behind a school's
 * SSO session. This adapter therefore replays *your own* session: copy the
 * `Cookie` header from a signed-in request in devtools into
 * `HANDSHAKE_COOKIE`, and set `HANDSHAKE_HOST` to your school's host
 * (e.g. `myschool.joinhandshake.com`).
 *
 * Because it is an internal endpoint, the response shape is not contracted and
 * may change without notice; parsing is deliberately tolerant, and a failure
 * degrades to "this source returned nothing" rather than breaking a refresh.
 * The session cookie also expires — a 401/403 here means paste a fresh one.
 */

const HOST = () => process.env.HANDSHAKE_HOST || "app.joinhandshake.com";
const COOKIE = () => process.env.HANDSHAKE_COOKIE || "";

type Raw = Record<string, unknown>;

const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});

/** The payload nests postings under a differently named key per endpoint version. */
function pickList(payload: unknown): Raw[] {
  const root = obj(payload);
  for (const key of ["results", "postings", "jobs", "data", "records"]) {
    const v = root[key];
    if (Array.isArray(v)) return v.map(obj);
  }
  return Array.isArray(payload) ? (payload as Raw[]).map(obj) : [];
}

function toJob(raw: Raw): Job | null {
  const job = obj(raw.job);
  const employer = obj(raw.employer ?? job.employer);
  const company = str(raw.employer_name) || str(employer.name) || str(raw.company);
  const role = str(raw.title) || str(job.title) || str(raw.name);
  const id = str(raw.id) || str(job.id) || `${company}-${role}`;
  if (!company || !role) return null;

  const locations = arr(raw.locations).length
    ? arr(raw.locations)
    : [str(obj(raw.location).name) || str(raw.location) || str(raw.location_name)].filter(Boolean);

  return {
    id: slugId("handshake", id),
    company,
    role,
    url: str(raw.url) || `https://${HOST()}/stu/jobs/${id}`,
    locations,
    postedAt: toIso(raw.created_at ?? raw.posted_at ?? raw.date_posted),
    season: undefined,
    sponsorship: undefined,
    terms: arr(raw.job_type_names ?? job.job_type_names),
    active: raw.expired !== true,
    source: "handshake",
  };
}

export const handshake: JobSource = {
  id: "handshake",
  label: "Handshake",
  configured: () =>
    COOKIE()
      ? { ok: true }
      : {
          ok: false,
          reason: "set HANDSHAKE_COOKIE (a signed-in session cookie) and HANDSHAKE_HOST",
        },

  async fetch(settings: Settings) {
    const url = new URL(`https://${HOST()}/stu/postings`);
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("query", queryFrom(settings));
    url.searchParams.set("job.job_type_names[]", "Internship");
    const loc = locationFrom(settings);
    if (loc) url.searchParams.set("location", loc);

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: COOKIE(),
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    if (res.status === 401 || res.status === 403)
      throw new Error("session rejected — HANDSHAKE_COOKIE has expired, paste a fresh one");
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const text = await res.text();
    // A signed-out response is the login HTML page, not JSON.
    if (!text.trimStart().startsWith("{") && !text.trimStart().startsWith("["))
      throw new Error("got HTML, not JSON — the session cookie is not signed in");

    return pickList(JSON.parse(text))
      .map(toJob)
      .filter((j): j is Job => j !== null);
  },
};
