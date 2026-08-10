import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
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

async function read<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return raw.trim() ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Atomic write: temp file then rename, so a crash mid-write cannot truncate the real file. */
async function write<T>(file: string, data: T): Promise<void> {
  const target = path.join(DATA_DIR, file);
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, target);
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
  const dir = path.join(DATA_DIR, "tailored");
  await fs.mkdir(dir, { recursive: true });
  const file = `${jobId.replace(/[^a-z0-9._-]/gi, "_")}.md`;
  await fs.writeFile(path.join(dir, file), markdown, "utf8");
  return `tailored/${file}`;
}

export async function readTailored(relPath: string): Promise<string | null> {
  // path is app-generated, but it round-trips through JSON on disk — keep it inside DATA_DIR
  const target = path.resolve(DATA_DIR, relPath);
  if (target !== DATA_DIR && !target.startsWith(DATA_DIR + path.sep)) return null;
  try {
    return await fs.readFile(target, "utf8");
  } catch {
    return null;
  }
}

export async function listTailored(): Promise<string[]> {
  try {
    return (await fs.readdir(path.join(DATA_DIR, "tailored"))).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

export const newId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
