"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeSyllabus, uploadSyllabus } from "@/lib/actions";
import { Button } from "@/components/ui";

export default function SyllabusUpload({
  classId,
  syllabusPath,
  syllabusName,
}: {
  classId: string;
  syllabusPath?: string | null;
  syllabusName?: string | null;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function pick() {
    setError(null);
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same filename
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted");
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      try {
        await uploadSyllabus(classId, fd);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  if (syllabusPath) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <a
          href={`/api/syllabus/${classId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {syllabusName ?? "syllabus.pdf"}
        </a>
        <Button onClick={pick} disabled={pending}>
          {pending ? "Uploading…" : "Replace"}
        </Button>
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await removeSyllabus(classId);
              router.refresh();
            })
          }
        >
          Remove
        </Button>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onChange} />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={pick} disabled={pending}>
        {pending ? "Uploading…" : "Upload syllabus (PDF)"}
      </Button>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onChange} />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
