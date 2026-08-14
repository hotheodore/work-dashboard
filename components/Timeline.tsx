"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { setAssignmentStatus } from "@/lib/actions";
import { classVar } from "@/lib/classColors";
import { groupDeadlines, type Deadline } from "@/lib/derive";

/** One list for everything with a date on it. Replaced the old split between a
 *  "Due today" checklist and a separate Deadlines rail, which showed the same
 *  assignments twice. Today is a group header now, not a badge. */
export default function Timeline({ items }: { items: Deadline[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const groups = groupDeadlines(items);

  if (!groups.length)
    return <p className="py-8 text-center text-sm text-muted">Nothing due. Enjoy it.</p>;

  const complete = (id: string) =>
    start(async () => {
      await setAssignmentStatus(id, "done");
      router.refresh();
    });

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="sticky top-0 z-10 bg-surface/85 py-1 text-xs font-medium uppercase tracking-[0.08em] text-faint backdrop-blur-sm">
            {g.label}
            <span className="tabular ml-1.5 font-mono text-faint/70">{g.items.length}</span>
          </h3>
          <ul className="mt-1 space-y-1">
            {g.items.map((d) => (
              <li
                key={`${d.kind}-${d.id}`}
                // Assignments carry their class color; applications share --warn
                // so the two kinds stay apart without needing a legend.
                style={d.classId ? classVar(d.classId) : { ["--class-color" as string]: "var(--warn)" }}
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border-l-[3px] border-class bg-surface-2/50 py-2 pr-2.5 pl-2.5 transition-colors hover:bg-surface-2"
              >
                {d.kind === "assignment" ? (
                  <input
                    type="checkbox"
                    aria-label={`Mark ${d.label} done`}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                    disabled={pending}
                    onChange={() => complete(d.id)}
                  />
                ) : (
                  <Briefcase size={14} className="shrink-0 text-warn" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm leading-snug">{d.label}</p>
                  <p className="truncate text-xs text-faint">{d.sub}</p>
                </div>
                {/* Today's rows need no date — the header already said it. */}
                {g.key !== "today" && (
                  <span className="tabular shrink-0 font-mono text-xs text-faint">
                    {new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
