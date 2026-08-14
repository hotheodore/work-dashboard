"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectGoogle } from "@/lib/actions";
import { Badge, Button, Card } from "@/components/ui";

/**
 * Connect/disconnect for the one Google account. Connecting is a full page
 * navigation (Google's consent screen), so it is a plain link, not a fetch.
 */
export default function GoogleCalendar({
  connected,
  account,
  reason,
  status,
}: {
  connected: boolean;
  account?: string;
  /** Why it cannot be connected — missing env vars. */
  reason?: string;
  /** Outcome of the last callback, from ?google= on the URL. */
  status?: { ok: boolean; detail?: string };
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Card
      title="Google Calendar"
      action={
        <Badge tone={connected ? "ok" : "default"}>{connected ? "Connected" : "Not connected"}</Badge>
      }
    >
      <p className="text-sm text-muted">
        {connected
          ? `Today's events from every calendar on ${account ?? "your account"} show on the dashboard.`
          : "Connect a Google account to see today's events on the dashboard. Read-only access."}
      </p>

      {/* A greyed-out button with a quiet grey line under it reads as broken, so
          say plainly that the button is off and what turns it on. */}
      {reason && (
        <p className="mt-2 rounded-[var(--radius-sm)] border border-border bg-surface-2 px-3 py-2 text-xs text-warn">
          Connecting is unavailable here — {reason}.
        </p>
      )}
      {status && (
        <p className={`mt-2 text-xs ${status.ok ? "text-[var(--ok)]" : "text-[var(--danger)]"}`}>
          {status.ok ? "Google Calendar connected." : `Could not connect — ${status.detail}`}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        {connected ? (
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await disconnectGoogle();
                router.refresh();
              })
            }
          >
            {pending ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : (
          <a
            href="/api/google/connect"
            // Matches Button's primary variant — it navigates, so it stays an anchor.
            className={`inline-flex items-center justify-center rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-[background-color,box-shadow] ${
              reason
                ? "pointer-events-none border border-border bg-surface-2 text-faint"
                : "bg-accent bg-[linear-gradient(180deg,color-mix(in_oklab,#fff_14%,var(--accent)),var(--accent))] text-accent-text shadow-[var(--shadow-sm),inset_0_1px_0_rgb(255_255_255/0.18)] hover:brightness-108"
            }`}
            aria-disabled={Boolean(reason)}
            title={reason}
          >
            Connect Google Calendar
          </a>
        )}
      </div>
    </Card>
  );
}
