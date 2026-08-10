"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAssignment, updateAssignment } from "@/lib/actions";
import { Badge, Button, EmptyState, inputClass } from "@/components/ui";
import type { Assignment, Status } from "@/lib/types";

type SortKey = "dueDate" | "status" | "weight" | "title";

const STATUS_TONE: Record<Status, "default" | "warn" | "ok"> = {
  todo: "default",
  "in-progress": "warn",
  done: "ok",
};

export default function AssignmentTable({
  assignments,
  classLabel,
}: {
  assignments: Assignment[];
  classLabel?: (classId: string) => string;
}) {
  const [sort, setSort] = useState<SortKey>("dueDate");
  const [pending, start] = useTransition();
  const router = useRouter();

  const rows = useMemo(() => {
    const order = { todo: 0, "in-progress": 1, done: 2 };
    return [...assignments].sort((a, b) => {
      if (sort === "dueDate") return a.dueDate.localeCompare(b.dueDate);
      if (sort === "weight") return b.weight - a.weight;
      if (sort === "status") return order[a.status] - order[b.status];
      return a.title.localeCompare(b.title);
    });
  }, [assignments, sort]);

  function mutate(fn: () => Promise<void>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  if (!assignments.length)
    return <EmptyState title="No assignments yet" hint="Add one, or paste a syllabus below." />;

  const th = "px-3 py-2 text-left text-xs font-medium text-faint";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border">
            {([
              ["title", "Assignment"],
              ["dueDate", "Due"],
              ["weight", "Weight"],
              ["status", "Status"],
            ] as [SortKey, string][]).map(([key, label]) => (
              <th key={key} className={th}>
                <button
                  onClick={() => setSort(key)}
                  className={`hover:text-text ${sort === key ? "text-accent" : ""}`}
                >
                  {label}
                </button>
              </th>
            ))}
            <th className={th}>Grade</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2">
                <span className={a.status === "done" ? "text-muted line-through" : ""}>
                  {a.title}
                </span>
                {classLabel && (
                  <span className="ml-2 text-xs text-faint">{classLabel(a.classId)}</span>
                )}
              </td>
              <td className="px-3 py-2 tabular-nums text-muted">{a.dueDate}</td>
              <td className="px-3 py-2 tabular-nums text-muted">{a.weight}%</td>
              <td className="px-3 py-2">
                <select
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                  value={a.status}
                  disabled={pending}
                  onChange={(e) =>
                    mutate(() => updateAssignment(a.id, { status: e.target.value as Status }))
                  }
                >
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <span className="ml-2 align-middle">
                  <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                </span>
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={a.grade ?? ""}
                  placeholder="—"
                  className={`${inputClass} w-20 px-2 py-1 text-xs`}
                  onBlur={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    if (v !== (a.grade ?? null)) mutate(() => updateAssignment(a.id, { grade: v }));
                  }}
                />
              </td>
              <td className="px-3 py-2 text-right">
                <Button variant="ghost" onClick={() => mutate(() => deleteAssignment(a.id))}>
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
