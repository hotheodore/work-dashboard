import { notFound } from "next/navigation";
import { ListChecks, CircleCheckBig, CalendarClock } from "lucide-react";
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
import { completion } from "@/lib/progress";
import { classVar } from "@/lib/classColors";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function ClassPage({ params }: PageProps<"/assignments/[classId]">) {
  const { classId } = await params;
  const [classes, all] = await Promise.all([getClasses(), getAssignments()]);
  const klass = classes.find((c) => c.id === classId);
  if (!klass) notFound();

  const mine = all.filter((a) => a.classId === classId);
  const pct = completion(mine);
  const open = mine.filter((a) => a.status !== "done");
  const next = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <>
      <PageHeader
        eyebrow={klass.code || klass.term || "Class"}
        title={klass.name}
        subtitle={[klass.term, klass.professor && `Prof. ${klass.professor}`, klass.location]
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

      <StatGrid cols={3}>
        <StatTile
          label="Assignments"
          icon={<ListChecks />}
          value={mine.length}
          hint={`${mine.filter((a) => a.status === "done").length} done`}
        />
        <StatTile
          label="Completion"
          icon={<CircleCheckBig />}
          value={`${Math.round(pct)}%`}
          tone={pct === 100 && mine.length ? "ok" : "default"}
        />
        <StatTile
          label="Still open"
          icon={<CalendarClock />}
          value={open.length}
          hint={next ? `Next: ${next.title} (${next.dueDate})` : "Nothing outstanding"}
          tone={open.length > 4 ? "warn" : "default"}
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
