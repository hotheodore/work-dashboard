"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/time";
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import { inputClass } from "@/components/ui";
import { addAssignment } from "@/lib/actions";
import { classVar } from "@/lib/classColors";
import type { Klass } from "@/lib/types";

interface Parsed {
  title: string;
  classId: string;
  dueDate: string;
}

/** Debounce long enough that a normal typing rhythm doesn't fire a request per
 *  keystroke, short enough that the chips feel like they're keeping up. */
const DEBOUNCE_MS = 550;

function shortDate(iso: string) {
  return formatDate(iso, {
    month: "short",
    day: "numeric",
  });
}

/** Natural-language assignment entry. Claude reads the line as you type and
 *  the interpretation shows up as chips on the right of the field, so Enter
 *  commits something you've already seen rather than something you have to
 *  confirm in a second step. */
export default function QuickAdd({ classes }: { classes: Klass[] }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks the request in flight so a slow response can't overwrite the chips
  // for a line the user has already moved past.
  const active = useRef<AbortController | null>(null);

  useEffect(() => {
    const line = text.trim();
    active.current?.abort();
    if (line.length < 4) {
      setParsed(null);
      setParsing(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    active.current = controller;
    setParsing(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/quick-add", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: line }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error(data.error ?? "Could not read that.");
        setParsed({
          title: data.title || line,
          classId: data.classId || "",
          dueDate: data.dueDate || "",
        });
        setError(null);
      } catch (e) {
        if (controller.signal.aborted || (e instanceof Error && e.name === "AbortError")) return;
        setParsed(null);
        setError(e instanceof Error ? e.message : "Could not read that.");
      } finally {
        if (!controller.signal.aborted) setParsing(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  const ready = Boolean(parsed?.classId && parsed?.dueDate);

  function save() {
    if (!parsed || !ready || saving) return;
    const item = parsed;
    startSave(async () => {
      await addAssignment({
        classId: item.classId,
        title: item.title,
        dueDate: item.dueDate,
        status: "todo",
      });
      setText("");
      setParsed(null);
      setError(null);
      router.refresh();
      inputRef.current?.focus();
    });
  }

  const klass = parsed?.classId ? classes.find((c) => c.id === parsed.classId) : undefined;

  return (
    <div className="mb-4">
      <div className="relative">
        <Sparkles
          size={15}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 ${
            parsing ? "text-accent" : "text-faint"
          }`}
        />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") setText("");
          }}
          disabled={saving}
          placeholder="Add an assignment — “pset 4 engr 2181 due friday”"
          aria-label="Quick add an assignment"
          className={`${inputClass} py-2.5 pr-[46%] pl-9`}
        />

        {/* Chips live in the right half of the field, where the text won't be
            while typing a short line. Non-interactive: this is a readout. */}
        <div
          className="pointer-events-none absolute top-1/2 right-2.5 flex max-w-[45%] -translate-y-1/2 items-center gap-1.5 overflow-hidden"
          aria-live="polite"
        >
          {saving ? (
            <Chip tone="muted">Adding…</Chip>
          ) : parsing ? (
            <Chip tone="muted">
              <Loader2 size={11} className="animate-spin" aria-hidden />
              Reading…
            </Chip>
          ) : parsed ? (
            <>
              {klass ? (
                <span style={classVar(klass.id)} className="shrink-0">
                  <Chip tone="class">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                    {klass.name || klass.code}
                  </Chip>
                </span>
              ) : (
                <Chip tone="warn">No class</Chip>
              )}
              <Chip tone="muted" title={parsed.title}>
                <span className="truncate">{parsed.title}</span>
              </Chip>
              {parsed.dueDate ? (
                <Chip tone="muted">
                  <CalendarDays size={11} aria-hidden />
                  {shortDate(parsed.dueDate)}
                </Chip>
              ) : (
                <Chip tone="warn">No date</Chip>
              )}
            </>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : parsed && !ready ? (
        <p className="mt-1.5 text-xs text-warn">
          {!parsed.classId ? "Name a class" : "Give it a due date"} and press Enter to add.
        </p>
      ) : null}
    </div>
  );
}

const CHIP_TONES = {
  muted: "bg-surface-2 text-muted",
  warn: "bg-warn/12 text-warn",
  class: "bg-class/12 text-class",
} as const;

function Chip({
  children,
  tone = "muted",
  title,
}: {
  children: React.ReactNode;
  tone?: keyof typeof CHIP_TONES;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full min-w-0 shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}
