import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { getApplications, getAssignments, getClasses } from "@/lib/store";
import { dayKey } from "@/lib/derive";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const [assignments, apps, classes] = await Promise.all([
    getAssignments(),
    getApplications(),
    getClasses(),
  ]);

  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lead = first.getDay();
  const today = dayKey(now);

  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      dayKey(new Date(now.getFullYear(), now.getMonth(), i + 1)),
    ),
  ];

  const label = (id: string) => classes.find((c) => c.id === id)?.code ?? "Class";

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle={now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      />

      <Card bodyClass="p-3">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1 text-center text-xs font-medium text-faint">
              {d}
            </div>
          ))}
          {cells.map((key, i) => {
            if (!key) return <div key={`pad-${i}`} className="min-h-24" />;
            const due = assignments.filter((a) => a.dueDate === key);
            const deadlines = apps.filter((a) => a.deadline === key);
            return (
              <div
                key={key}
                className={`min-h-24 rounded-md border p-1.5 ${
                  key === today ? "border-accent bg-accent-soft" : "border-border"
                }`}
              >
                <p className="mb-1 text-xs tabular-nums text-faint">{Number(key.slice(-2))}</p>
                <div className="space-y-1">
                  {due.map((a) => (
                    <p
                      key={a.id}
                      title={a.title}
                      className={`truncate rounded px-1 py-0.5 text-[10px] ${
                        a.status === "done"
                          ? "bg-surface-2 text-faint line-through"
                          : "bg-accent-soft text-accent"
                      }`}
                    >
                      {label(a.classId)}: {a.title}
                    </p>
                  ))}
                  {deadlines.map((a) => (
                    <p
                      key={a.id}
                      title={`${a.role} — ${a.company}`}
                      className="truncate rounded bg-warn/10 px-1 py-0.5 text-[10px] text-warn"
                    >
                      {a.company}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-3 text-xs text-faint">
        Assignment due dates in the accent color, application deadlines in amber.
      </p>
    </>
  );
}
