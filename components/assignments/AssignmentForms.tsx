"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAssignment, addClass, deleteClass, updateClass } from "@/lib/actions";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import type { Klass, Status } from "@/lib/types";
import { dayKey } from "@/lib/time";

export function AddClassButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", code: "", term: "", professor: "", location: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    start(async () => {
      await addClass({ ...form, color: "" });
      setForm({ name: "", code: "", term: "", professor: "", location: "" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        + Class
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add class">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Data Structures"
              autoFocus
            />
          </Field>
          <Field label="Code">
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="CS 201"
            />
          </Field>
          <Field label="Term">
            <input
              className={inputClass}
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              placeholder="Fall 2026"
            />
          </Field>
          <Field label="Professor">
            <input
              className={inputClass}
              value={form.professor}
              onChange={(e) => setForm({ ...form, professor: e.target.value })}
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Location">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="MWF 11:30–12:20, CSI Room 553"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Add class"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AddAssignmentButton({
  classes,
  defaultClassId,
}: {
  classes: Klass[];
  defaultClassId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({
    classId: defaultClassId ?? classes[0]?.id ?? "",
    title: "",
    dueDate: dayKey(),
    status: "todo" as Status,
    notes: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.classId) return;
    start(async () => {
      await addAssignment({
        classId: form.classId,
        title: form.title.trim(),
        dueDate: form.dueDate,
        status: form.status,
        notes: form.notes,
        completedAt: form.status === "done" ? new Date().toISOString() : null,
      });
      setForm({ ...form, title: "", notes: "" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)} disabled={!classes.length}>
        + Assignment
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add assignment">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Class">
            <select
              className={inputClass}
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code || c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Problem set 4"
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date">
              <input
                type="date"
                className={inputClass}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              >
                <option value="todo">To do</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              className={`${inputClass} h-20 resize-y`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Add assignment"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function EditClassButton({ klass }: { klass: Klass }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({
    name: klass.name,
    code: klass.code,
    term: klass.term,
    professor: klass.professor ?? "",
    location: klass.location ?? "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    start(async () => {
      await updateClass(klass.id, form);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit class">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Code">
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label="Term">
            <input
              className={inputClass}
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
            />
          </Field>
          <Field label="Professor">
            <input
              className={inputClass}
              value={form.professor}
              onChange={(e) => setForm({ ...form, professor: e.target.value })}
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Location">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="MWF 11:30–12:20, CSI Room 553"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteClassButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (!confirming)
    return (
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Delete {name} and its assignments?</span>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        No
      </Button>
      <Button
        variant="danger"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await deleteClass(id);
            router.refresh();
          })
        }
      >
        Yes, delete
      </Button>
    </div>
  );
}
