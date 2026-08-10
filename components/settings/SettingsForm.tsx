"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/lib/actions";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { Settings } from "@/lib/types";

export default function SettingsForm({
  initial,
  fetchedAt,
  cachedCount,
}: {
  initial: Settings;
  fetchedAt: string | null;
  cachedCount: number;
}) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function refresh() {
    setRefreshing(true);
    setStatus(null);
    try {
      const res = await fetch("/api/listings/refresh?force=1", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "refresh failed");
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
          Source: SimplifyJobs/Summer2026-Internships on GitHub. {cachedCount} active postings cached
          {fetchedAt ? `, last fetched ${new Date(fetchedAt).toLocaleString()}` : " — never fetched"}.
        </p>
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
