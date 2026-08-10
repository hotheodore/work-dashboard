/**
 * One-way sync of the local `data/` directory into Vercel Blob: npm run data:push
 *
 * Run once before the first deploy so the hosted dashboard starts with the
 * classes, applications and resume already on disk. Re-running overwrites the
 * remote copies, so do not run it after editing data in the hosted app.
 *
 * Needs BLOB_READ_WRITE_TOKEN in .env.local (Vercel project → Storage → Blob).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");
const PREFIX = "work-dashboard/";

async function upload(relPath: string, contentType: string) {
  const body = await fs.readFile(path.join(DATA_DIR, relPath), "utf8");
  await put(`${PREFIX}${relPath}`, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 0,
  });
  console.log(`pushed ${relPath} (${body.length} bytes)`);
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new Error("BLOB_READ_WRITE_TOKEN is not set — add it to .env.local");

  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith(".json")) await upload(e.name, "application/json");
  }

  const tailoredDir = path.join(DATA_DIR, "tailored");
  const tailored = await fs.readdir(tailoredDir).catch(() => [] as string[]);
  for (const f of tailored) {
    if (f.endsWith(".md")) await upload(`tailored/${f}`, "text/markdown");
  }

  console.log("done");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
