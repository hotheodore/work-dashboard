import { claude, MODEL, textOf } from "@/lib/claude";
import {
  getApplications,
  getListings,
  getResume,
  readTailored,
  saveTailored,
  setApplications,
} from "@/lib/store";
import type { Resume } from "@/lib/types";

export const maxDuration = 300;

const SYSTEM = `You tailor a student's existing resume to one internship posting, and draft a cover letter.

Hard rule: every bullet you propose must be traceable to something already in their resume JSON. Rephrase, reorder, and re-emphasize their real work — never invent an employer, a technology, a metric, or a number that is not there. If the posting asks for something they genuinely lack, list it under missing keywords instead of manufacturing it.

Output GitHub-flavored Markdown with exactly these sections:

## Lead with
Three to five of their existing bullets, quoted or lightly rewritten, ordered by relevance to this posting. Name the resume entry each came from.

## Rewrites
For each bullet worth changing: the original, then the tailored version, then one line on what the change targets in the posting.

## Missing keywords
Terms from the posting absent from their resume. Mark each as "worth learning", "close enough to something they have (say what)", or "skip".

## Cover letter
A complete draft, three or four short paragraphs, specific to this company and role, first person, no filler openings like "I am writing to express my interest".`;

function resumeIsEmpty(r: Resume) {
  return !r.experiences.length && !r.projects.length && !r.skills.length;
}

export async function POST(request: Request) {
  let applicationId: string;
  let regenerate = false;
  try {
    ({ applicationId, regenerate = false } = await request.json());
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const apps = await getApplications();
  const app = apps.find((a) => a.id === applicationId);
  if (!app) return Response.json({ error: "application not found" }, { status: 404 });

  if (app.tailoringPath && !regenerate) {
    const cached = await readTailored(app.tailoringPath);
    if (cached) return Response.json({ markdown: cached, cached: true });
  }

  const [resume, listings] = await Promise.all([getResume(), getListings()]);
  if (resumeIsEmpty(resume))
    return Response.json(
      { error: "Your resume is empty. Seed it with `npm run seed:resume`, or fill it in on the Resume page." },
      { status: 400 },
    );

  const job = listings.jobs.find((j) => j.id === app.jobId);
  const posting = [
    `Company: ${app.company}`,
    `Role: ${app.role}`,
    `URL: ${app.url}`,
    job?.locations.length ? `Locations: ${job.locations.join(", ")}` : "",
    job?.season ? `Season: ${job.season}` : "",
    job?.terms.length ? `Terms: ${job.terms.join(", ")}` : "",
    job?.sponsorship ? `Sponsorship: ${job.sponsorship}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await claude().messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { effort: "high" },
      messages: [
        {
          role: "user",
          content: `Posting:\n${posting}\n\nResume JSON:\n${JSON.stringify(resume, null, 2)}`,
        },
      ],
    });

    if (message.stop_reason === "refusal")
      return Response.json({ error: "The model declined this request." }, { status: 422 });

    const markdown = textOf(message);
    if (!markdown) return Response.json({ error: "empty response" }, { status: 502 });

    const path = await saveTailored(app.jobId || app.id, markdown);
    await setApplications(
      apps.map((a) => (a.id === app.id ? { ...a, tailoringPath: path } : a)),
    );

    return Response.json({ markdown, path });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "tailoring failed" }, { status: 500 });
  }
}
