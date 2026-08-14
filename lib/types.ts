export type Status = "todo" | "in-progress" | "done";

export interface Klass {
  id: string;
  name: string;
  code: string;
  color: string;
  term: string;
  professor?: string;
  location?: string;
  syllabusPath?: string | null; // storage-relative path, e.g. syllabus/<classId>.pdf
  syllabusName?: string | null; // original filename, shown in UI
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  status: Status;
  notes?: string;
  completedAt?: string | null; // ISO date, feeds the activity heatmap
}

export type AppStatus = "saved" | "applied" | "oa" | "interview" | "offer" | "rejected";

export const APP_STAGES: AppStatus[] = ["applied", "oa", "interview", "offer"];

export interface Application {
  id: string;
  jobId: string;
  company: string;
  role: string;
  url: string;
  location?: string;
  appliedAt: string; // ISO date
  status: AppStatus;
  deadline?: string | null;
  notes?: string;
  tailoringPath?: string | null;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  url: string;
  locations: string[];
  postedAt: string; // ISO date
  season?: string;
  sponsorship?: string;
  terms: string[];
  active: boolean;
  source: string; // id of the lib/sources adapter that produced it
}

export interface ResumeBullet {
  id: string;
  text: string;
}

export interface ResumeEntry {
  id: string;
  company: string;
  role: string;
  dates: string;
  bullets: ResumeBullet[];
}

export interface Resume {
  name: string;
  contact: string;
  education: string;
  experiences: ResumeEntry[];
  projects: ResumeEntry[];
  skills: string[];
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
}

export interface Settings {
  roleKeywords: string[];
  locations: string[];
  remoteOnly: boolean;
  season: string;
  picksPerDay: number;
}

/** One adapter's outcome in the last refresh — surfaced in Settings. */
export interface SourceRun {
  id: string;
  label: string;
  status: "ok" | "skipped" | "error";
  count: number;
  detail?: string;
}

export interface ListingsCache {
  fetchedAt: string | null;
  jobs: Job[];
  sources?: SourceRun[];
}

export interface DailyPicks {
  [date: string]: string[]; // YYYY-MM-DD -> job ids
}
