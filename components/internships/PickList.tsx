"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyToJob, skipJob } from "@/lib/actions";
import { Badge, Button, EmptyState } from "@/components/ui";
import type { Job } from "@/lib/types";

export default function PickList({
  jobs,
  matchPool,
  compact = false,
}: {
  jobs: Job[];
  matchPool: number;
  compact?: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<void>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  if (!jobs.length)
    return (
      <EmptyState
        title={matchPool ? "All of today's picks handled" : "No matching postings"}
        hint={
          matchPool
            ? "Come back tomorrow for five more."
            : "Refresh listings in Settings, or loosen your role keywords, location, and season filters."
        }
      />
    );

  return (
    <ul className="space-y-2">
      {jobs.map((j) => (
        <li key={j.id} className="rounded-lg border border-border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{j.role}</p>
              <p className="truncate text-xs text-muted">{j.company}</p>
              {!compact && (
                <p className="mt-1 text-xs text-faint">
                  {j.locations.slice(0, 3).join(" · ") || "Location not listed"}
                  {j.sponsorship && j.sponsorship !== "Other" ? ` · ${j.sponsorship}` : ""}
                </p>
              )}
            </div>
            {!compact && <Badge>{j.postedAt.slice(0, 10)}</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={j.url} target="_blank" rel="noreferrer">
              <Button>Open posting</Button>
            </a>
            <Button variant="primary" disabled={pending} onClick={() => run(() => applyToJob(j.id))}>
              Applied
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => run(() => skipJob(j.id))}>
              Skip
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
