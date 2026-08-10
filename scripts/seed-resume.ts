/**
 * One-time: read the PDF resume, have Claude structure it into data/resume.json.
 * Run once — after that, edit the resume in the app's Resume page.
 *   npm run seed:resume -- "C:/Users/theod/Documents/Resume - Theodore Ho FINAL.pdf"
 */
import fs from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    contact: { type: "string", description: "email, phone, links — one line" },
    education: { type: "string" },
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          company: { type: "string" },
          role: { type: "string" },
          dates: { type: "string" },
          bullets: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, text: { type: "string" } },
              required: ["id", "text"],
              additionalProperties: false,
            },
          },
        },
        required: ["id", "company", "role", "dates", "bullets"],
        additionalProperties: false,
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          company: { type: "string" },
          role: { type: "string" },
          dates: { type: "string" },
          bullets: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, text: { type: "string" } },
              required: ["id", "text"],
              additionalProperties: false,
            },
          },
        },
        required: ["id", "company", "role", "dates", "bullets"],
        additionalProperties: false,
      },
    },
    skills: { type: "array", items: { type: "string" } },
  },
  required: ["name", "contact", "education", "experiences", "projects", "skills"],
  additionalProperties: false,
} as const;

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: npm run seed:resume -- "<path to resume.pdf>"');
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Add it to .env.local first.");
    process.exit(1);
  }

  const data = (await fs.readFile(pdfPath)).toString("base64");
  const client = new Anthropic();

  const message = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 16000,
    system:
      "Transcribe this resume into structured JSON. Copy the bullets verbatim — do not rewrite, shorten, or improve them. Give every experience, project, and bullet a short stable id (e.g. exp-1, exp-1-b2). Projects go in projects, jobs and internships in experiences.",
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
          { type: "text", text: "Structure this resume." },
        ],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    console.error("The model declined this request.");
    process.exit(1);
  }

  const block = message.content.find((b) => b.type === "text");
  if (!block) {
    console.error("Empty response.");
    process.exit(1);
  }

  const out = path.join(process.cwd(), "data", "resume.json");
  const parsed = JSON.parse(block.text);
  await fs.writeFile(out, JSON.stringify(parsed, null, 2), "utf8");
  console.log(
    `Wrote ${out}: ${parsed.experiences.length} experiences, ${parsed.projects.length} projects, ${parsed.skills.length} skills.`,
  );
  console.log("Spot-check a few bullets against the PDF before relying on it.");
}

main();
