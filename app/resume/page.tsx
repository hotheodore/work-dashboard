import PageHeader from "@/components/PageHeader";
import { Card, EmptyState } from "@/components/ui";
import ResumeEditor from "@/components/resume/ResumeEditor";
import { getResume, listTailored } from "@/lib/store";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const [resume, tailored] = await Promise.all([getResume(), listTailored()]);
  const empty = !resume.experiences.length && !resume.projects.length && !resume.skills.length;

  return (
    <>
      <PageHeader
        title="Resume"
        subtitle="Source of truth for tailoring. Every generated bullet traces back to something here."
      />

      {empty && (
        <div className="mb-6">
          <EmptyState
            title="Resume is empty"
            hint='Seed it from your PDF: npm run seed:resume -- "C:/Users/theod/Documents/Resume - Theodore Ho FINAL.pdf" — or just fill it in below.'
          />
        </div>
      )}

      <ResumeEditor initial={resume} />

      <div className="mt-6">
        <Card title={`Tailored documents (${tailored.length})`}>
          {!tailored.length ? (
            <p className="text-sm text-muted">
              Tailor an application from the Internships pipeline and it shows up here.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {tailored.map((f) => (
                <li key={f} className="font-mono text-xs text-muted">
                  data/tailored/{f}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
