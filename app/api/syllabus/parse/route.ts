import { claude, MODEL } from "@/lib/claude";

export const maxDuration = 60;

const SCHEMA = {
  type: "object",
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          dueDate: {
            type: "string",
            description: "YYYY-MM-DD, or an empty string when the syllabus is ambiguous",
          },
          weight: { type: "number", description: "percent of the final grade, 0 if unstated" },
        },
        required: ["title", "dueDate", "weight"],
        additionalProperties: false,
      },
    },
  },
  required: ["assignments"],
  additionalProperties: false,
} as const;

const SYSTEM = `Extract graded assignments from a course syllabus.

Rules:
- One entry per graded item: problem sets, projects, papers, quizzes, midterms, the final.
- Skip readings, lectures, and office hours — only work that is submitted or sat.
- dueDate must be YYYY-MM-DD. If the syllabus gives a weekday or relative date you cannot resolve to a calendar date, return an empty string rather than guessing.
- weight is the percent of the final grade. If a category weight covers N items, split it evenly. If no weight is stated, use 0.
- Preserve the syllabus's own naming for titles.`;

export async function POST(request: Request) {
  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim())
    return Response.json({ error: "syllabus text is required" }, { status: 400 });

  try {
    const message = await claude().messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: text.slice(0, 200_000) }],
    });

    if (message.stop_reason === "refusal")
      return Response.json({ error: "The model declined this request." }, { status: 422 });

    const json = message.content.find((b) => b.type === "text");
    if (!json) return Response.json({ error: "empty response" }, { status: 502 });

    return Response.json(JSON.parse(json.text));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "parse failed" }, { status: 500 });
  }
}
