import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Card, StatTile } from "@/components/ui";
import { AddAssignmentButton, DeleteClassButton } from "@/components/assignments/AssignmentForms";
import AssignmentTable from "@/components/assignments/AssignmentTable";
import SyllabusPaste from "@/components/assignments/SyllabusPaste";
import DueTimeline from "@/components/charts/DueTimeline";
import ClassCompletion from "@/components/charts/ClassCompletion";
import { getAssignments, getClasses } from "@/lib/store";
import { completionData, timelineData } from "@/lib/derive";
import { classGrade } from "@/lib/grades";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function ClassPage({ params }: PageProps<"/assignments/[classId]">) {
  const { classId } = await params;
  const [classes, all] = await Promise.all([getClasses(), getAssignments()]);
  const klass = classes.find((c) => c.id === classId);
  if (!klass) notFound();

  const mine = all.filter((a) => a.classId === classId);
  const g = classGrade(mine);

  return (
    <>
      <PageHeader
        title={klass.name}
        subtitle={[klass.code, klass.term].filter(Boolean).join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <DeleteClassButton id={klass.id} name={klass.code || klass.name} />
            <AddAssignmentButton classes={classes} defaultClassId={klass.id} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Assignments" value={mine.length} hint={`${mine.filter((a) => a.status === "done").length} done`} />
        <StatTile label="Completion" value={`${Math.round(g.completion)}%`} />
        <StatTile
          label="Current grade"
          value={g.current === null ? "—" : `${g.current.toFixed(1)}%`}
          hint={`${g.gradedWeight}% of grade graded`}
        />
        <StatTile
          label="Projected final"
          value={g.projected === null ? "—" : `${g.projected.toFixed(1)}%`}
          hint={
            g.totalWeight < 95
              ? `only ${g.totalWeight}% of the course weight entered`
              : "assumes remaining work scores at current average"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Next 14 days">
          <DueTimeline data={timelineData(mine, [klass])} classes={[klass]} />
        </Card>
        <Card title="Done vs pending">
          <ClassCompletion data={completionData(mine, [klass])} />
        </Card>
      </div>

      <div className="mt-6 space-y-6">
        <Card title="All assignments" bodyClass="px-2 pb-2">
          <AssignmentTable assignments={mine} />
        </Card>
        <Card title="Paste a syllabus">
          <SyllabusPaste classId={klass.id} />
        </Card>
      </div>
    </>
  );
}
