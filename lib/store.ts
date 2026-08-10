import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { blobEnabled, blobListNames, blobRead, blobWrite } from "./blob-store";
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

/**
 * Two backends behind one interface: local disk for `next dev`, Vercel Blob
 * once BLOB_READ_WRITE_TOKEN is set. A hosted serverless filesystem is
 * read-only and thrown away between requests, so disk writes cannot be used
 * there.
 */
const blobBacked = () => blobEnabled();

async function readRaw(relPath: string): Promise<string | null> {
  try {
    if (blobBacked()) return await blobRead(relPath);
    return await fs.readFile(path.join(DATA_DIR, relPath), "utf8");
  } catch {
    return null;
  }
}

async function writeRaw(relPath: string, body: string, contentType: string): Promise<void> {
  if (blobBacked()) {
    await blobWrite(relPath, body, contentType);
    return;
  }
  // Atomic write: temp file then rename, so a crash mid-write cannot truncate the real file.
  const target = path.join(DATA_DIR, relPath);
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(tmp, body, "utf8");
  await fs.rename(tmp, target);
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
    return (await fs.readdir(path.join(DATA_DIR, "tailored"))).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

export const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
