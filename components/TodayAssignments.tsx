"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAssignmentStatus } from "@/lib/actions";
import type { Assignment } from "@/lib/types";

export default function TodayAssignments({ assignments }: { assignments: Assignment[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!assignments.length)
    return <p className="text-sm text-muted">Nothing due today.</p>;

  return (
    <ul className="space-y-2">
      {assignments.map((a) => (
        <li key={a.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--accent)]"
            disabled={pending}
            onChange={() =>
              start(async () => {
                await setAssignmentStatus(a.id, "done");
                router.refresh();
              })
            }
          />
          <span className="text-sm">{a.title}</span>
        </li>
      ))}
    </ul>
  );
}
