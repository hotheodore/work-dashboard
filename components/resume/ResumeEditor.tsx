"use client";

import { useState, useTransition } from "react";
import { saveResume } from "@/lib/actions";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { Resume, ResumeEntry } from "@/lib/types";

const newId = () => Math.random().toString(36).slice(2, 9);

export default function ResumeEditor({ initial }: { initial: Resume }) {
  const [resume, setResume] = useState<Resume>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      await saveResume(resume);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function updateSection(key: "experiences" | "projects", entries: ResumeEntry[]) {
    setResume({ ...resume, [key]: entries });
  }

  function section(key: "experiences" | "projects", label: string) {
    const entries = resume[key];
    return (
      <Card
        title={label}
        action={
          <Button
            onClick={() =>
              updateSection(key, [
                ...entries,
                { id: newId(), company: "", role: "", dates: "", bullets: [] },
              ])
            }
          >
            + Entry
          </Button>
        }
      >
        <div className="space-y-4">
          {!entries.length && <p className="text-sm text-muted">Nothing here yet.</p>}
          {entries.map((e, i) => (
            <div key={e.id} className="rounded-lg border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className={inputClass}
                  placeholder="Company / project"
                  value={e.company}
                  onChange={(ev) =>
                    updateSection(
                      key,
                      entries.map((x, xi) => (xi === i ? { ...x, company: ev.target.value } : x)),
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Role"
                  value={e.role}
                  onChange={(ev) =>
                    updateSection(
                      key,
                      entries.map((x, xi) => (xi === i ? { ...x, role: ev.target.value } : x)),
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Dates"
                  value={e.dates}
                  onChange={(ev) =>
                    updateSection(
                      key,
                      entries.map((x, xi) => (xi === i ? { ...x, dates: ev.target.value } : x)),
                    )
                  }
                />
              </div>

              <div className="mt-2 space-y-2">
                {e.bullets.map((b, bi) => (
                  <div key={b.id} className="flex gap-2">
                    <textarea
                      className={`${inputClass} h-16 resize-y text-xs`}
                      value={b.text}
                      onChange={(ev) =>
                        updateSection(
                          key,
                          entries.map((x, xi) =>
                            xi === i
                              ? {
                                  ...x,
                                  bullets: x.bullets.map((y, yi) =>
                                    yi === bi ? { ...y, text: ev.target.value } : y,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        updateSection(
                          key,
                          entries.map((x, xi) =>
                            xi === i
                              ? { ...x, bullets: x.bullets.filter((_, yi) => yi !== bi) }
                              : x,
                          ),
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between">
                  <Button
                    onClick={() =>
                      updateSection(
                        key,
                        entries.map((x, xi) =>
                          xi === i
                            ? { ...x, bullets: [...x.bullets, { id: newId(), text: "" }] }
                            : x,
                        ),
                      )
                    }
                  >
                    + Bullet
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => updateSection(key, entries.filter((_, xi) => xi !== i))}
                  >
                    Remove entry
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Basics">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Name">
            <input
              className={inputClass}
              value={resume.name}
              onChange={(e) => setResume({ ...resume, name: e.target.value })}
            />
          </Field>
          <Field label="Contact">
            <input
              className={inputClass}
              value={resume.contact}
              onChange={(e) => setResume({ ...resume, contact: e.target.value })}
            />
          </Field>
          <Field label="Education">
            <input
              className={inputClass}
              value={resume.education}
              onChange={(e) => setResume({ ...resume, education: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Skills (comma separated)">
            <textarea
              className={`${inputClass} h-20 resize-y`}
              value={resume.skills.join(", ")}
              onChange={(e) =>
                setResume({
                  ...resume,
                  skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </Field>
        </div>
      </Card>

      {section("experiences", "Experience")}
      {section("projects", "Projects")}

      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-ok">Saved</span>}
        <Button variant="primary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save resume"}
        </Button>
      </div>
    </div>
  );
}
