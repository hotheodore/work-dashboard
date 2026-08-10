import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, StatTile } from "@/components/ui";
import { AddAssignmentButton, AddClassButton } from "@/components/assignments/AssignmentForms";
import AssignmentTable from "@/components/assignments/AssignmentTable";
import DueTimeline from "@/components/charts/DueTimeline";
import ClassCompletion from "@/components/charts/ClassCompletion";
import { getAssignments, getClasses } from "@/lib/store";
import { completionData, timelineData } from "@/lib/derive";
import { classGrade } from "@/lib/grades";

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
          hint="Add a class to start tracking assignments, grades, and deadlines."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((c) => {
              const mine = assignments.filter((a) => a.classId === c.id);
              const g = classGrade(mine);
              const next = mine
                .filter((a) => a.status !== "done")
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
              return (
                <Link key={c.id} href={`/assignments/${c.id}`} className="block">
                  <div className="card h-full p-5 transition-colors hover:border-accent">
                    <p className="text-xs font-medium uppercase tracking-wider text-faint">
                      {c.code || c.term || "Class"}
                    </p>
                    <p className="mt-1 text-base font-semibold">{c.name}</p>
                    <p className="mt-3 text-sm text-muted">
                      {Math.round(g.completion)}% complete
                      {g.current !== null && ` · ${g.current.toFixed(1)}% grade`}
                    </p>
                    <p className="mt-1 text-xs text-faint">
                      {next ? `Next: ${next.title} (${next.dueDate})` : "Nothing due"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

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
              classLabel={(id) => classes.find((c) => c.id === id)?.code ?? ""}
            />
          </Card>
        </div>
      )}
    </>
  );
}
