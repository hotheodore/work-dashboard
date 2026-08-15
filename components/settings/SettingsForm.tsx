"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/lib/actions";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { Settings, SourceRun } from "@/lib/types";
import { formatDateTime } from "@/lib/time";

const TONE: Record<SourceRun["status"], string> = {
  ok: "text-[var(--ok)]",
  skipped: "text-muted",
  error: "text-[var(--danger)]",
};

export default function SettingsForm({
  initial,
  fetchedAt,
  cachedCount,
  sources,
}: {
  initial: Settings;
  fetchedAt: string | null;
  cachedCount: number;
  sources: SourceRun[];
}) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [runs, setRuns] = useState<SourceRun[]>(sources);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function refresh() {
    setRefreshing(true);
    setStatus(null);
    try {
      const res = await fetch("/api/listings/refresh?force=1", { method: "POST" });
      const data = await res.json();
      setWarning(data.warning ?? null);
      if (!res.ok) throw new Error(data.error ?? "refresh failed");
      setRuns(data.sources ?? []);
      setStatus(`Cached ${data.count} active postings.`);
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Internship filters">
        <div className="space-y-3">
          <Field label="Role keywords (comma separated — a posting matches if its title contains any)">
            <input
              className={inputClass}
              value={s.roleKeywords.join(", ")}
              onChange={(e) =>
                setS({
                  ...s,
                  roleKeywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Locations (comma separated)">
              <input
                className={inputClass}
                placeholder="NYC, Boston, CA"
                value={s.locations.join(", ")}
                onChange={(e) =>
                  setS({
                    ...s,
                    locations: e.target.value.split(",").map((l) => l.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Season / year">
              <input
                className={inputClass}
                placeholder="Summer 2027"
                value={s.season}
                onChange={(e) => setS({ ...s, season: e.target.value })}
              />
            </Field>
            <Field label="Picks per day">
              <input
                type="number"
                min={1}
                max={20}
                className={inputClass}
                value={s.picksPerDay}
                onChange={(e) => setS({ ...s, picksPerDay: Number(e.target.value) || 5 })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={s.remoteOnly}
              onChange={(e) => setS({ ...s, remoteOnly: e.target.checked })}
            />
            Remote only
          </label>
          <div className="flex justify-end">
            <Button
              variant="primary"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await saveSettings(s);
                  router.refresh();
                })
              }
            >
              {pending ? "Saving…" : "Save filters"}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Listings">
        <p className="text-sm text-muted">
          {cachedCount} active postings cached
          {fetchedAt ? `, last fetched ${formatDateTime(fetchedAt)}` : " — never fetched"}.
        </p>

        {runs.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs">
            {runs.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className="w-56 shrink-0 text-text">{r.label}</span>
                <span className={TONE[r.status]}>
                  {r.status === "ok" ? `${r.count} postings` : r.status}
                  {r.detail ? ` — ${r.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {warning && <p className="mt-3 text-xs text-[var(--danger)]">{warning}</p>}

        <div className="mt-3 flex items-center gap-3">
          <Button variant="primary" onClick={refresh} disabled={refreshing}>
            {refreshing ? "Fetching…" : "Refresh listings now"}
          </Button>
          {status && <span className="text-xs text-muted">{status}</span>}
        </div>
      </Card>
    </div>
  );
}
