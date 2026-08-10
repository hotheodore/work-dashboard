"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteApplication, setApplicationStatus } from "@/lib/actions";
import { Button, EmptyState, inputClass } from "@/components/ui";
import type { AppStatus, Application } from "@/lib/types";
import TailorButton from "./TailorButton";

const STATUSES: AppStatus[] = ["saved", "applied", "oa", "interview", "offer", "rejected"];

export default function Pipeline({ apps }: { apps: Application[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!apps.length)
    return <EmptyState title="No applications yet" hint="Mark a daily pick as applied." />;

  function mutate(fn: () => Promise<void>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-faint">
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Company</th>
            <th className="px-3 py-2">Applied</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Tailoring</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2">
                <a href={a.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                  {a.role}
                </a>
              </td>
              <td className="px-3 py-2 text-muted">{a.company}</td>
              <td className="px-3 py-2 tabular-nums text-muted">{a.appliedAt.slice(0, 10)}</td>
              <td className="px-3 py-2">
                <select
                  className={`${inputClass} w-32 px-2 py-1 text-xs`}
                  value={a.status}
                  disabled={pending}
                  onChange={(e) =>
                    mutate(() => setApplicationStatus(a.id, e.target.value as AppStatus))
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <TailorButton application={a} />
              </td>
              <td className="px-3 py-2 text-right">
                <Button variant="ghost" onClick={() => mutate(() => deleteApplication(a.id))}>
                  ✕
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
