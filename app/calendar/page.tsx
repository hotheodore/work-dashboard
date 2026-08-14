import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui";
import { getApplications, getAssignments, getClasses } from "@/lib/store";
import { dayKey } from "@/lib/derive";
import { classVar } from "@/lib/classColors";

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

      <Card
        bodyClass="p-3"
        action={
          // Was a loose paragraph below the card; a swatch legend says it in less
          // space. Now one swatch per class, since the chips are class-colored.
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
            {classes.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5" style={classVar(c.id)}>
                <span className="h-2 w-2 rounded-full bg-class" />
                {c.code || c.name}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warn" />
              Applications
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 pb-1 text-center text-xs font-medium text-faint">
              {d}
            </div>
          ))}
          {cells.map((key, i) => {
            // Transparent border, not no border — otherwise lead-week cells are
            // 2px shorter than real ones and the grid edge reads as broken.
            if (!key)
              return <div key={`pad-${i}`} className="min-h-26 border border-transparent" />;
            const due = assignments.filter((a) => a.dueDate === key);
            const deadlines = apps.filter((a) => a.deadline === key);
            return (
              <div
                key={key}
                className={`min-h-26 rounded-[var(--radius-sm)] border p-1.5 transition-colors ${
                  key === today
                    ? "border-accent/40 bg-accent-soft"
                    : "border-border hover:bg-surface-2"
                }`}
              >
                {/* Today is a filled marker on the number, not a wash over the
                    whole cell — the wash fought with the colored chips inside. */}
                <p className="mb-1 flex">
                  <span
                    className={`tabular grid h-5 min-w-5 place-items-center rounded-full px-1 font-mono text-xs ${
                      key === today
                        ? "bg-accent font-semibold text-accent-text"
                        : "text-faint"
                    }`}
                  >
                    {Number(key.slice(-2))}
                  </span>
                </p>
                <div className="space-y-1">
                  {due.map((a) => (
                    <p
                      key={a.id}
                      title={a.title}
                      style={classVar(a.classId)}
                      className={`truncate rounded border-l-2 border-class px-1.5 py-0.5 text-xs ${
                        a.status === "done"
                          ? "bg-surface-2 text-faint line-through"
                          : "bg-class/12 text-class"
                      }`}
                    >
                      {label(a.classId)}: {a.title}
                    </p>
                  ))}
                  {deadlines.map((a) => (
                    <p
                      key={a.id}
                      title={`${a.role} — ${a.company}`}
                      className="truncate rounded border-l-2 border-warn bg-warn/12 px-1.5 py-0.5 text-xs text-warn"
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
    </>
  );
}
