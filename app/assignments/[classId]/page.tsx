import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Card, StatGrid, StatTile } from "@/components/ui";
import {
  AddAssignmentButton,
  DeleteClassButton,
  EditClassButton,
} from "@/components/assignments/AssignmentForms";
import AssignmentTable from "@/components/assignments/AssignmentTable";
import SyllabusPaste from "@/components/assignments/SyllabusPaste";
import SyllabusUpload from "@/components/assignments/SyllabusUpload";
import DueTimeline from "@/components/charts/DueTimeline";
import { getAssignments, getClasses } from "@/lib/store";
import { timelineData } from "@/lib/derive";
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
        subtitle={[klass.code, klass.term, klass.professor && `Prof. ${klass.professor}`]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <EditClassButton klass={klass} />
            <DeleteClassButton id={klass.id} name={klass.code || klass.name} />
            <AddAssignmentButton classes={classes} defaultClassId={klass.id} />
          </div>
        }
      />

      {klass.location && <p className="-mt-4 mb-4 text-sm text-muted">{klass.location}</p>}

      <StatGrid>
        <StatTile
          label="Assignments"
          value={mine.length}
          hint={`${mine.filter((a) => a.status === "done").length} done`}
        />
        <StatTile
          label="Completion"
          value={`${Math.round(g.completion)}%`}
          hint={`${mine.filter((a) => a.status !== "done").length} still open`}
        />
        <StatTile
          label="Current grade"
          value={g.current === null ? "—" : `${g.current.toFixed(1)}%`}
          hint={`${g.gradedWeight}% of grade graded`}
        />
        <StatTile
          label="Projected final"
          value={g.projected === null ? "—" : `${g.projected.toFixed(1)}%`}
          hint={g.totalWeight < 95 ? `${g.totalWeight}% of weight entered` : "at current average"}
        />
      </StatGrid>

      {/* "Done vs pending" used to sit here: a 280px chart drawing one bar, saying
          the same thing as the Completion tile above. */}
      <div className="mt-6">
        <Card title="Next 14 days">
          <DueTimeline data={timelineData(mine, [klass])} classes={[klass]} />
        </Card>
      </div>

      <div className="mt-6 space-y-6">
        <Card title="All assignments" bodyClass="px-2 pb-2">
          <AssignmentTable assignments={mine} />
        </Card>
        <Card title="Syllabus file">
          <SyllabusUpload
            classId={klass.id}
            syllabusPath={klass.syllabusPath}
            syllabusName={klass.syllabusName}
          />
        </Card>
        <Card title="Paste a syllabus">
          <SyllabusPaste classId={klass.id} />
        </Card>
      </div>
    </>
  );
}
