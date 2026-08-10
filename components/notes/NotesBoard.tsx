"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNote, saveNote } from "@/lib/actions";
import { Button, Card, EmptyState, inputClass } from "@/components/ui";
import type { Note } from "@/lib/types";

const newId = () => Math.random().toString(36).slice(2, 9);

export default function NotesBoard({ notes }: { notes: Note[] }) {
  const [editing, setEditing] = useState<Note | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function mutate(fn: () => Promise<void>) {
    start(async () => {
      await fn();
      setEditing(null);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <Card title={editing.title || "New note"}>
        <div className="space-y-3">
          <input
            className={inputClass}
            placeholder="Title"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            autoFocus
          />
          <textarea
            className={`${inputClass} h-64 resize-y font-mono text-xs`}
            placeholder="Interview prep, questions asked, things to remember…"
            value={editing.body}
            onChange={(e) => setEditing({ ...editing, body: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Tags (comma separated)"
            value={editing.tags.join(", ")}
            onChange={(e) =>
              setEditing({
                ...editing,
                tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
              })
            }
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={pending || !editing.title.trim()}
              onClick={() =>
                mutate(() => saveNote({ ...editing, updatedAt: new Date().toISOString() }))
              }
            >
              {pending ? "Saving…" : "Save note"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Button
          variant="primary"
          onClick={() =>
            setEditing({ id: newId(), title: "", body: "", tags: [], updatedAt: "" })
          }
        >
          + Note
        </Button>
      </div>

      {!notes.length ? (
        <EmptyState title="No notes" hint="Interview prep, company research, questions to ask." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...notes]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((n) => (
              <div key={n.id} className="card flex flex-col p-4">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-2 line-clamp-6 flex-1 whitespace-pre-wrap text-xs text-muted">
                  {n.body}
                </p>
                <p className="mt-3 text-[10px] text-faint">
                  {n.tags.join(" · ")}
                  {n.tags.length ? " · " : ""}
                  {n.updatedAt.slice(0, 10)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => setEditing(n)}>Edit</Button>
                  <Button variant="danger" onClick={() => mutate(() => deleteNote(n.id))}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
