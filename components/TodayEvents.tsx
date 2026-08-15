import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { formatTime } from "@/lib/time";

const time = (iso: string) => formatTime(iso, { hour: "numeric", minute: "2-digit" });

/**
 * Today's Google Calendar events. `error` covers both "not connected" and a
 * failed fetch — either way the card explains itself rather than going blank.
 */
export default function TodayEvents({
  events,
  error,
}: {
  events: CalendarEvent[];
  error?: string;
}) {
  if (error)
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted">{error}</p>
        <Link href="/settings" className="mt-1 inline-block text-xs text-accent hover:underline">
          Open Settings
        </Link>
      </div>
    );

  if (!events.length)
    return (
      <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
        <CalendarDays size={14} aria-hidden /> Nothing on the calendar today.
      </p>
    );

  return (
    <ul className="space-y-1">
      {events.map((e) => (
        <li
          key={e.id}
          // Each calendar keeps its own Google color down the left edge.
          style={{ ["--class-color" as string]: e.calendarColor ?? "var(--accent)" }}
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border-l-[3px] border-class bg-surface-2/50 py-2 pr-2.5 pl-2.5 transition-colors hover:bg-surface-2"
        >
          <span className="tabular w-16 shrink-0 font-mono text-xs text-faint">
            {e.allDay ? "all day" : time(e.start)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-snug">{e.title}</p>
            <p className="flex items-center gap-1 truncate text-xs text-faint">
              {e.location && <MapPin size={11} className="shrink-0" aria-hidden />}
              {e.location ? `${e.location} · ` : ""}
              {e.calendarLabel}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
