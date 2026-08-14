import { claude, MODEL } from "@/lib/claude";
import { getClasses } from "@/lib/store";
import { dayKey } from "@/lib/derive";

export const maxDuration = 30;

const SYSTEM = `Extract a single assignment from one line of shorthand a student typed.

Rules:
- title is the assignment itself, cleaned up but in the student's own words. Strip the class code and the date phrase out of it — those are returned separately.
- classId must be the id of the class the line refers to. Match on code ("2181", "engr 2181", "ENGR2181"), on name ("design", "orgo"), or on an unambiguous nickname. Return an empty string if no class clearly matches — do not guess between two plausible classes.
- dueDate is YYYY-MM-DD. Resolve relative phrases ("friday", "next tuesday", "in 3 days", "tmrw") against the current date given in the user message, always choosing the next occurrence in the future. Return an empty string if the line names no date at all.
`;

export async function POST(request: Request) {
  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim())
    return Response.json({ error: "text is required" }, { status: 400 });

  const classes = await getClasses();
  if (!classes.length)
    return Response.json({ error: "Add a class first — there is nothing to file this under." }, { status: 400 });

  // The id list becomes an enum, so the model cannot invent a class that does
  // not exist. "" is the explicit "I could not tell" answer.
  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      classId: { type: "string", enum: ["", ...classes.map((c) => c.id)] },
      dueDate: { type: "string", description: "YYYY-MM-DD, or an empty string" },
    },
    required: ["title", "classId", "dueDate"],
    additionalProperties: false,
  } as const;

  const roster = classes
    .map((c) => `${c.id} = ${[c.code, c.name, c.term].filter(Boolean).join(" · ")}`)
    .join("\n");

  try {
    const message = await claude().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      // Extraction against a fixed schema — low effort keeps this fast enough
      // to feel like typing rather than like waiting on a model.
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      messages: [
        {
          role: "user",
          content: `Today is ${dayKey(new Date())}.\n\nClasses:\n${roster}\n\nLine:\n${text.slice(0, 2000)}`,
        },
      ],
    });

    if (message.stop_reason === "refusal")
      return Response.json({ error: "The model declined this request." }, { status: 422 });

    const json = message.content.find((b) => b.type === "text");
    if (!json) return Response.json({ error: "empty response" }, { status: 502 });

    return Response.json(JSON.parse(json.text));
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "parse failed" },
      { status: 500 },
    );
  }
}
