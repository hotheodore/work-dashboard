import Link from "next/link";
import { ArrowRight, CalendarClock, MessagesSquare, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, StatChip } from "@/components/ui";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import ProgressRing from "@/components/charts/ProgressRing";
import Timeline from "@/components/Timeline";
import TodayEvents from "@/components/TodayEvents";
import PickList from "@/components/internships/PickList";
import QuickAdd from "@/components/assignments/QuickAdd";
import { getApplications, getAssignments, getClasses } from "@/lib/store";
import { getDailyPicks } from "@/lib/jobs";
import { connection, fetchTodayEvents } from "@/lib/google";
import { activityCounts, deadlines } from "@/lib/derive";
import { dayKey, daysBetween, formatDate } from "@/lib/time";
import { greeting } from "@/lib/greeting";
import type { CalendarEvent } from "@/lib/types";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

/** Google being down or unlinked must not take the whole dashboard with it. */
async function todayEvents(): Promise<{ events: CalendarEvent[]; error?: string }> {
  if (!(await connection())) return { events: [], error: "Google Calendar isn't connected." };
  try {
    return { events: await fetchTodayEvents() };
  } catch (e) {
    return { events: [], error: e instanceof Error ? e.message : "Could not reach Google Calendar." };
  }
}

export default async function DashboardPage() {
  const [classes, assignments, apps, picks, calendar] = await Promise.all([
    getClasses(),
    getAssignments(),
    getApplications(),
    getDailyPicks(),
    todayEvents(),
  ]);

  const now = new Date();
  const today = dayKey(now);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const appsThisWeek = apps.filter((a) => new Date(a.appliedAt) >= weekAgo).length;
  const interviews = apps.filter((a) => a.status === "interview" || a.status === "oa").length;
  const dueSoon = assignments.filter((a) => {
    if (a.status === "done") return false;
    const out = daysBetween(today, a.dueDate);
    return out >= -1 && out <= 7;
  }).length;

  const counts = activityCounts(assignments, apps);

  // Today's completion drives the ring beside the heatmap.
  const dueToday = assignments.filter((a) => a.dueDate === today);
  const doneToday = dueToday.filter((a) => a.status === "done").length;
  const todayPct = dueToday.length ? (doneToday / dueToday.length) * 100 : 0;
  const empty = !classes.length && !apps.length && !picks.jobs.length;

  return (
    // Locked to the viewport on desktop so the dashboard never scrolls — the
    // lists inside scroll instead. Below lg it falls back to normal flow.
    <div className="flex flex-col lg:h-[calc(100vh-3rem)] lg:overflow-hidden">
      <PageHeader
        className="mb-5"
        eyebrow={formatDate(now, { weekday: "long", month: "long", day: "numeric" })}
        title={greeting(now)}
        stats={
          <>
            <StatChip label="Applied this week" value={appsThisWeek} icon={<Send />} tone="navy" />
            <StatChip
              label="Active interviews"
              value={interviews}
              icon={<MessagesSquare />}
              tone={interviews ? "ok" : "blue"}
              className="hidden lg:flex"
            />
            <StatChip
              label="Due in 7 days"
              value={dueSoon}
              icon={<CalendarClock />}
              tone={dueSoon > 4 ? "warn" : "accent"}
            />
          </>
        }
      />

      {empty && (
        <div className="mb-4">
          <EmptyState
            title="Nothing tracked yet"
            hint="Add a class under Assignments, then refresh listings in Settings to start getting daily internship picks."
          />
        </div>
      )}

      {classes.length > 0 && <QuickAdd classes={classes} />}

      {/* Asymmetric on purpose: picks and today's calendar stack in the narrow
          column; the timeline is the spine and gets the width to show dates.
          On a phone only the spine survives — the calendar, the picks and the
          heatmap are all reference material you go to a dedicated page for,
          and each one pushed the deadlines below the fold. */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
        {/* Left column: what's happening today above what to apply to today. */}
        <div className="hidden min-h-0 min-w-0 flex-col gap-4 lg:col-span-5 lg:flex">
          <Card
            title="Today"
            tint="var(--accent-2)"
            className="flex min-h-0 min-w-0 flex-[2] flex-col"
            bodyClass="min-h-0 flex-1 overflow-y-auto fade-bottom px-5 pt-0 pb-5"
          >
            <TodayEvents events={calendar.events} error={calendar.error} />
          </Card>

          <Card
            accented
            title="Today's picks"
            className="flex min-h-0 min-w-0 flex-[3] flex-col"
            bodyClass="min-h-0 flex-1 overflow-y-auto px-5 pt-0 pb-5"
            action={
              <Link
                href="/internships"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                All picks <ArrowRight size={12} aria-hidden />
              </Link>
            }
          >
            {/* Exactly three: a partial fourth row peeking out read as a scroll bug. */}
            <PickList jobs={picks.jobs.slice(0, 3)} matchPool={picks.matchPool} compact />
          </Card>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:col-span-7">
          {/* flex-[3] only divides space inside the locked-height desktop
              layout; on a phone the card is in normal flow and needs a floor. */}
          <Card
            title="Timeline"
            tint="var(--accent-3)"
            className="flex min-h-[60vh] min-w-0 flex-[3] flex-col lg:min-h-0"
            bodyClass="min-h-0 flex-1 overflow-y-auto fade-bottom px-5 pt-0 pb-5"
            action={
              <Link
                href="/calendar"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                Calendar <ArrowRight size={12} aria-hidden />
              </Link>
            }
          >
            <Timeline items={deadlines(assignments, apps, classes)} />
          </Card>

          <Card
            title="Activity"
            tint="var(--accent)"
            className="hidden min-h-0 min-w-0 flex-[2] flex-col lg:flex"
            bodyClass="min-h-0 flex-1 overflow-hidden px-5 pt-1 pb-5"
          >
            <ActivityHeatmap
              counts={counts}
              weeks={18}
              showStats
              aside={
                <ProgressRing
                  value={todayPct}
                  label="Done today"
                  hint={dueToday.length ? `${doneToday} of ${dueToday.length}` : "Nothing due"}
                  tone={dueToday.length && todayPct === 100 ? "ok" : "accent"}
                />
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
