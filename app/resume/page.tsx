import PageHeader from "@/components/PageHeader";
import { Badge, EmptyState } from "@/components/ui";
import ResumeEditor from "@/components/resume/ResumeEditor";
import { getResume, listTailored } from "@/lib/store";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const [resume, tailored] = await Promise.all([getResume(), listTailored()]);
  const empty = !resume.experiences.length && !resume.projects.length && !resume.skills.length;

  return (
    <>
      {/* The tailored-docs card was a read-only list of file paths with no actions.
          The count is the only part worth surfacing, so it lives in the header. */}
      <PageHeader
        title="Resume"
        subtitle="Source of truth for tailoring."
        action={
          tailored.length ? (
            <Badge tone="accent">
              {tailored.length} tailored {tailored.length === 1 ? "document" : "documents"}
            </Badge>
          ) : undefined
        }
      />

      {empty && (
        <div className="mb-6">
          <EmptyState
            title="Resume is empty"
            hint="Fill it in below, or seed it from a PDF with: npm run seed:resume -- <path-to-pdf>"
          />
        </div>
      )}

      <ResumeEditor initial={resume} />
    </>
  );
}
