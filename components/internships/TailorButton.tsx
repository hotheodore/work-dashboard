"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@/components/ui";
import type { Application } from "@/lib/types";

export default function TailorButton({ application }: { application: Application }) {
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run(regenerate: boolean) {
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, regenerate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tailoring failed");
      setMarkdown(data.markdown as string);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tailoring failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => run(false)}>
        {application.tailoringPath ? "View" : "Tailor"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`${application.role} — ${application.company}`}>
        {loading && <p className="text-sm text-muted">Working through the posting and your resume…</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        {markdown && (
          <>
            <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 font-mono text-xs">
              {markdown}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button onClick={() => navigator.clipboard.writeText(markdown)}>Copy</Button>
              <Button variant="primary" onClick={() => run(true)}>
                Regenerate
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
