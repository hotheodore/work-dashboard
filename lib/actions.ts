"use server";

import { revalidatePath } from "next/cache";
import * as store from "./store";
import type {
  AppStatus,
  Application,
  Assignment,
  Klass,
  Note,
  Resume,
  Settings,
  Status,
} from "./types";

/* ---------------- classes ---------------- */

export async function addClass(input: Omit<Klass, "id">) {
  const classes = await store.getClasses();
  const klass: Klass = { ...input, id: store.newId() };
  await store.setClasses([...classes, klass]);
  revalidatePath("/assignments");
  revalidatePath("/");
  return klass;
}

export async function deleteClass(id: string) {
  await store.setClasses((await store.getClasses()).filter((c) => c.id !== id));
  await store.setAssignments((await store.getAssignments()).filter((a) => a.classId !== id));
  revalidatePath("/assignments");
  revalidatePath("/");
}

/* ---------------- assignments ---------------- */

export async function addAssignment(input: Omit<Assignment, "id">) {
  const all = await store.getAssignments();
  const item: Assignment = { ...input, id: store.newId() };
  await store.setAssignments([...all, item]);
  revalidatePath("/assignments");
  revalidatePath("/");
  revalidatePath("/calendar");
  return item;
}

export async function addAssignments(items: Omit<Assignment, "id">[]) {
  const all = await store.getAssignments();
  await store.setAssignments([...all, ...items.map((i) => ({ ...i, id: store.newId() }))]);
  revalidatePath("/assignments");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function updateAssignment(id: string, patch: Partial<Assignment>) {
  const all = await store.getAssignments();
  await store.setAssignments(
    all.map((a) => {
      if (a.id !== id) return a;
      const next = { ...a, ...patch };
      // completedAt drives the activity heatmap; keep it in sync with status
      if (patch.status === "done" && !next.completedAt)
        next.completedAt = new Date().toISOString();
      if (patch.status && patch.status !== "done") next.completedAt = null;
      return next;
    }),
  );
  revalidatePath("/assignments");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function setAssignmentStatus(id: string, status: Status) {
  await updateAssignment(id, { status });
}

export async function deleteAssignment(id: string) {
  await store.setAssignments((await store.getAssignments()).filter((a) => a.id !== id));
  revalidatePath("/assignments");
  revalidatePath("/");
  revalidatePath("/calendar");
}

/* ---------------- applications ---------------- */

export async function applyToJob(jobId: string) {
  const [jobs, apps, seen] = await Promise.all([
    store.getListings(),
    store.getApplications(),
    store.getSeenJobs(),
  ]);
  const job = jobs.jobs.find((j) => j.id === jobId);
  if (!job) return;
  if (!apps.some((a) => a.jobId === jobId)) {
    const app: Application = {
      id: store.newId(),
      jobId: job.id,
      company: job.company,
      role: job.role,
      url: job.url,
      location: job.locations[0],
      appliedAt: new Date().toISOString(),
      status: "applied",
    };
    await store.setApplications([...apps, app]);
  }
  if (!seen.includes(jobId)) await store.setSeenJobs([...seen, jobId]);
  revalidatePath("/internships");
  revalidatePath("/");
}

export async function skipJob(jobId: string) {
  const seen = await store.getSeenJobs();
  // seen is the only record needed — today's slate stays fixed so a skip
  // doesn't pull in a replacement pick
  if (!seen.includes(jobId)) await store.setSeenJobs([...seen, jobId]);
  revalidatePath("/internships");
  revalidatePath("/");
}

export async function setApplicationStatus(id: string, status: AppStatus) {
  const apps = await store.getApplications();
  await store.setApplications(apps.map((a) => (a.id === id ? { ...a, status } : a)));
  revalidatePath("/internships");
  revalidatePath("/");
}

export async function deleteApplication(id: string) {
  await store.setApplications((await store.getApplications()).filter((a) => a.id !== id));
  revalidatePath("/internships");
  revalidatePath("/");
}

/* ---------------- resume / notes / settings ---------------- */

export async function saveResume(resume: Resume) {
  await store.setResume(resume);
  revalidatePath("/resume");
}

export async function saveNote(note: Note) {
  const notes = await store.getNotes();
  const next = notes.some((n) => n.id === note.id)
    ? notes.map((n) => (n.id === note.id ? note : n))
    : [...notes, note];
  await store.setNotes(next);
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  await store.setNotes((await store.getNotes()).filter((n) => n.id !== id));
  revalidatePath("/notes");
}

export async function saveSettings(settings: Settings) {
  await store.setSettings(settings);
  revalidatePath("/settings");
  revalidatePath("/internships");
}

export async function newNoteId() {
  return store.newId();
}
