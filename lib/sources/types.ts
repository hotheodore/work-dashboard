import type { Job, Settings } from "../types";

/**
 * A listings backend. Adapters never throw for "not set up" — they report
 * `configured: false` so the refresh can say *why* a source contributed
 * nothing instead of failing the whole run.
 */
export interface JobSource {
  id: string;
  label: string;
  /** False when required credentials/env are missing. `reason` explains what to add. */
  configured(): { ok: boolean; reason?: string };
  /** Settings are passed so remote-search sources can push filters upstream. */
  fetch(settings: Settings): Promise<Job[]>;
}

export const str = (v: unknown) => (typeof v === "string" ? v : "");
export const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

/** Seconds or ISO string in, ISO string out; epoch 0 when the field is missing. */
export function toIso(v: unknown): string {
  if (typeof v === "number") return new Date(v > 1e11 ? v : v * 1000).toISOString();
  if (typeof v === "string" && v) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(0).toISOString();
}

export function slugId(source: string, ...parts: string[]): string {
  return `${source}-${parts.join("-")}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120);
}

/** Search text handed to remote sources that take a query string. */
export function queryFrom(settings: Settings): string {
  const kw = settings.roleKeywords.filter(Boolean);
  return kw.length ? `${kw.join(" ")} intern` : "software engineer intern";
}

export function locationFrom(settings: Settings): string {
  if (settings.remoteOnly) return "Remote";
  return settings.locations[0] ?? "";
}
