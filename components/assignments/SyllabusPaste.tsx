"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addAssignments } from "@/lib/actions";
import { Button, inputClass } from "@/components/ui";

interface Draft {
  title: string;
  dueDate: string;
}

export default function SyllabusPaste({ classId }: { classId: string }) {
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  async function parse() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/syllabus/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      setDrafts(data.assignments as Draft[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }

  function edit(i: number, patch: Partial<Draft>) {
    setDrafts((d) => d && d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function confirm() {
    if (!drafts) return;
    // nothing is written until this point — the review table is the gate
    const rows = drafts.filter((d) => d.title.trim() && d.dueDate);
    start(async () => {
      await addAssignments(
        rows.map((d) => ({
          classId,
          title: d.title.trim(),
          dueDate: d.dueDate,
          status: "todo" as const,
          completedAt: null,
        })),
      );
      setDrafts(null);
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        className={`${inputClass} h-32 resize-y font-mono text-xs`}
        placeholder="Paste syllabus text here — Claude extracts assignments and due dates. You review before anything is saved."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={parse} disabled={!text.trim() || loading}>
          {loading ? "Reading syllabus…" : "Extract assignments"}
        </Button>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>

      {drafts && (
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs text-muted">
            {drafts.length} found. Edit anything that looks wrong — blank dates were ambiguous in the
            source. Nothing is saved until you confirm.
          </p>
          <div className="space-y-2">
            {drafts.map((d, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px] gap-2">
                <input
                  className={`${inputClass} text-xs`}
                  value={d.title}
                  onChange={(e) => edit(i, { title: e.target.value })}
                />
                <input
                  type="date"
                  className={`${inputClass} text-xs`}
                  value={d.dueDate}
                  onChange={(e) => edit(i, { dueDate: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={() => setDrafts(null)}>Discard</Button>
            <Button variant="primary" onClick={confirm} disabled={pending}>
              {pending ? "Saving…" : `Add ${drafts.length}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
