import "server-only";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  blobDelete,
  blobEnabled,
  blobListNames,
  blobRead,
  blobReadBinary,
  blobWrite,
  blobWriteBinary,
} from "./blob-store";
import type {
  Application,
  Assignment,
  DailyPicks,
  Klass,
  ListingsCache,
  Note,
  Resume,
  Settings,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

/** Scratch copy used only when the bundled data dir turns out to be read-only. */
const SCRATCH_DIR = path.join(os.tmpdir(), "work-dashboard-data");

/**
 * Two backends behind one interface: local disk for `next dev`, Vercel Blob
 * once BLOB_READ_WRITE_TOKEN is set. A hosted serverless filesystem is
 * read-only and thrown away between requests, so disk writes cannot be used
 * there.
 */
const blobBacked = () => blobEnabled();

/**
 * Deploying without a Blob store used to surface as
 * `EROFS: read-only file system, open '/var/task/data/...tmp'` from whichever
 * write happened to run first. Once a write proves the bundle is read-only we
 * move to the OS temp dir instead: writes succeed, and the caller gets a
 * warning it can show rather than a stack trace. Temp is per-instance and
 * wiped between cold starts, so it is a fallback, not the intended backend.
 */
let diskReadOnly = false;

/** Set when disk writes are landing somewhere that will not survive; UI shows it. */
export function storageWarning(): string | null {
  if (blobBacked()) return null;
  if (diskReadOnly)
    return "No BLOB_READ_WRITE_TOKEN — writes are going to a temp dir that is discarded when the instance recycles. Connect a Vercel Blob store to persist data.";
  return null;
}

function dirsFor(relPath: string): string[] {
  // Scratch first when it is live: it holds the newer copy, the bundle the seed.
  const dirs = diskReadOnly ? [SCRATCH_DIR, DATA_DIR] : [DATA_DIR];
  return dirs.map((d) => path.join(d, relPath));
}

async function readRaw(relPath: string): Promise<string | null> {
  if (blobBacked()) {
    try {
      return await blobRead(relPath);
    } catch {
      return null;
    }
  }
  for (const file of dirsFor(relPath)) {
    try {
      return await fs.readFile(file, "utf8");
    } catch {
      /* try the next location */
    }
  }
  return null;
}

/** Atomic write: temp file then rename, so a crash mid-write cannot truncate the real file. */
async function writeToDir(dir: string, relPath: string, body: string): Promise<void> {
  const target = path.join(dir, relPath);
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, target);
}

const READ_ONLY_CODES = new Set(["EROFS", "EACCES", "EPERM"]);

async function writeRaw(relPath: string, body: string, contentType: string): Promise<void> {
  if (blobBacked()) {
    await blobWrite(relPath, body, contentType);
    return;
  }
  if (!diskReadOnly) {
    try {
      await writeToDir(DATA_DIR, relPath, body);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code ?? "";
      if (!READ_ONLY_CODES.has(code)) throw e;
      diskReadOnly = true;
      console.warn(`data dir is read-only (${code}); falling back to ${SCRATCH_DIR}`);
    }
  }
  await writeToDir(SCRATCH_DIR, relPath, body);
}

async function readRawBinary(relPath: string): Promise<Buffer | null> {
  if (blobBacked()) {
    try {
      return await blobReadBinary(relPath);
    } catch {
      return null;
    }
  }
  for (const file of dirsFor(relPath)) {
    try {
      return await fs.readFile(file);
    } catch {
      /* try the next location */
    }
  }
  return null;
}

async function writeRawBinary(relPath: string, body: Buffer, contentType: string): Promise<void> {
  if (blobBacked()) {
    await blobWriteBinary(relPath, body, contentType);
    return;
  }
  if (!diskReadOnly) {
    try {
      const target = path.join(DATA_DIR, relPath);
      const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(tmp, body);
      await fs.rename(tmp, target);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code ?? "";
      if (!READ_ONLY_CODES.has(code)) throw e;
      diskReadOnly = true;
      console.warn(`data dir is read-only (${code}); falling back to ${SCRATCH_DIR}`);
    }
  }
  const target = path.join(SCRATCH_DIR, relPath);
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(tmp, body);
  await fs.rename(tmp, target);
}

async function deleteRaw(relPath: string): Promise<void> {
  if (blobBacked()) {
    try {
      await blobDelete(relPath);
    } catch {
      /* already gone */
    }
    return;
  }
  for (const dir of [DATA_DIR, SCRATCH_DIR]) {
    try {
      await fs.unlink(path.join(dir, relPath));
    } catch {
      /* not present here */
    }
  }
}

async function read<T>(file: string, fallback: T): Promise<T> {
  const raw = await readRaw(file);
  if (!raw?.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function write<T>(file: string, data: T): Promise<void> {
  await writeRaw(file, JSON.stringify(data, null, 2), "application/json");
}

export const DEFAULT_SETTINGS: Settings = {
  roleKeywords: ["software", "engineer", "swe", "data", "machine learning"],
  locations: [],
  remoteOnly: false,
  season: "Summer 2027",
  picksPerDay: 5,
};

export const EMPTY_RESUME: Resume = {
  name: "",
  contact: "",
  education: "",
  experiences: [],
  projects: [],
  skills: [],
};

export const getClasses = () => read<Klass[]>("classes.json", []);
export const setClasses = (v: Klass[]) => write("classes.json", v);

export const getAssignments = () => read<Assignment[]>("assignments.json", []);
export const setAssignments = (v: Assignment[]) => write("assignments.json", v);

export const getApplications = () => read<Application[]>("applications.json", []);
export const setApplications = (v: Application[]) => write("applications.json", v);

export const getSeenJobs = () => read<string[]>("seen-jobs.json", []);
export const setSeenJobs = (v: string[]) => write("seen-jobs.json", v);

export const getDailyPicks = () => read<DailyPicks>("daily-picks.json", {});
export const setDailyPicks = (v: DailyPicks) => write("daily-picks.json", v);

export const getResume = () => read<Resume>("resume.json", EMPTY_RESUME);
export const setResume = (v: Resume) => write("resume.json", v);

export const getNotes = () => read<Note[]>("notes.json", []);
export const setNotes = (v: Note[]) => write("notes.json", v);

export const getSettings = async (): Promise<Settings> => ({
  ...DEFAULT_SETTINGS,
  ...(await read<Partial<Settings>>("settings.json", {})),
});
export const setSettings = (v: Settings) => write("settings.json", v);

export const getListings = () =>
  read<ListingsCache>("listings-cache.json", { fetchedAt: null, jobs: [] });
export const setListings = (v: ListingsCache) => write("listings-cache.json", v);

/** Tailored resume + cover letter markdown, one file per job. */
export async function saveTailored(jobId: string, markdown: string): Promise<string> {
  const rel = `tailored/${jobId.replace(/[^a-z0-9._-]/gi, "_")}.md`;
  await writeRaw(rel, markdown, "text/markdown");
  return rel;
}

export async function readTailored(relPath: string): Promise<string | null> {
  // path is app-generated, but it round-trips through storage — keep it inside the data root
  const target = path.resolve(DATA_DIR, relPath);
  if (target !== DATA_DIR && !target.startsWith(DATA_DIR + path.sep)) return null;
  const rel = path.relative(DATA_DIR, target).split(path.sep).join("/");
  return readRaw(rel);
}

export async function listTailored(): Promise<string[]> {
  try {
    if (blobBacked()) return (await blobListNames("tailored")).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const names = new Set<string>();
  for (const dir of dirsFor("tailored")) {
    try {
      for (const f of await fs.readdir(dir)) if (f.endsWith(".md")) names.add(f);
    } catch {
      /* directory may not exist in this location */
    }
  }
  return [...names];
}

/** Uploaded syllabus PDF, one file per class — overwrites any prior upload. */
export async function saveSyllabus(classId: string, body: Buffer): Promise<string> {
  const rel = `syllabus/${classId}.pdf`;
  await writeRawBinary(rel, body, "application/pdf");
  return rel;
}

export async function readSyllabus(relPath: string): Promise<Buffer | null> {
  // path is app-generated (class id), but keep it inside the data root regardless
  const target = path.resolve(DATA_DIR, relPath);
  if (target !== DATA_DIR && !target.startsWith(DATA_DIR + path.sep)) return null;
  const rel = path.relative(DATA_DIR, target).split(path.sep).join("/");
  return readRawBinary(rel);
}

export async function deleteSyllabus(classId: string): Promise<void> {
  await deleteRaw(`syllabus/${classId}.pdf`);
}

export const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
