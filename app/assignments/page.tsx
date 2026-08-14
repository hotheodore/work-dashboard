import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, StatGrid } from "@/components/ui";
import { AddAssignmentButton, AddClassButton } from "@/components/assignments/AssignmentForms";
import AssignmentTable from "@/components/assignments/AssignmentTable";
import DueTimeline from "@/components/charts/DueTimeline";
import ClassCompletion from "@/components/charts/ClassCompletion";
import { getAssignments, getClasses } from "@/lib/store";
import { completionData, timelineData } from "@/lib/derive";
import { completion } from "@/lib/progress";
import { classVar } from "@/lib/classColors";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const [classes, assignments] = await Promise.all([getClasses(), getAssignments()]);

  const upcoming = assignments
    .filter((a) => a.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 10);

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle={`${classes.length} classes · ${assignments.filter((a) => a.status !== "done").length} open`}
        action={
          <div className="flex gap-2">
            <AddClassButton />
            <AddAssignmentButton classes={classes} />
          </div>
        }
      />

      {!classes.length ? (
        <EmptyState
          title="No classes yet"
          hint="Add a class to start tracking assignments and deadlines."
        />
      ) : (
        <div className="space-y-6">
          <StatGrid>
            {classes.map((c) => {
              const mine = assignments.filter((a) => a.classId === c.id);
              const pct = completion(mine);
              const next = mine
                .filter((a) => a.status !== "done")
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
              return (
                <Link key={c.id} href={`/assignments/${c.id}`} className="block h-full">
                  <div
                    className="card card-interactive card-spine flex h-full flex-col p-5 pl-6 hover:border-class"
                    style={classVar(c.id)}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-class">
                      {c.code || c.term || "Class"}
                    </p>
                    <p className="mt-1.5 text-base font-semibold">{c.name}</p>
                    {/* Progress bar reads faster than the percentage alone. */}
                    <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-class transition-[width] duration-500"
                        style={{ width: `${Math.round(pct)}%` }}
                      />
                    </div>
                    <p className="tabular mt-2 font-mono text-sm text-muted">
                      {Math.round(pct)}% complete
                    </p>
                    <p className="mt-auto pt-2 text-xs text-faint">
                      {next ? `Next: ${next.title} (${next.dueDate})` : "Nothing due"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </StatGrid>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Next 14 days">
              <DueTimeline data={timelineData(assignments, classes)} classes={classes} />
            </Card>
            <Card title="Completion by class">
              <ClassCompletion data={completionData(assignments, classes)} />
            </Card>
          </div>

          <Card title="Upcoming across all classes" bodyClass="px-2 pb-2">
            <AssignmentTable
              assignments={upcoming}
              classLabel={Object.fromEntries(classes.map((c) => [c.id, c.name]))}
            />
          </Card>
        </div>
      )}
    </>
  );
}
