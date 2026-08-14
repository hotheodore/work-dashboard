import Link from "next/link";
import { ArrowRight, CalendarClock, MessagesSquare, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, StatChip } from "@/components/ui";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import ProgressRing from "@/components/charts/ProgressRing";
import Timeline from "@/components/Timeline";
import PickList from "@/components/internships/PickList";
import QuickAdd from "@/components/assignments/QuickAdd";
import { getApplications, getAssignments, getClasses } from "@/lib/store";
import { getDailyPicks } from "@/lib/jobs";
import { activityCounts, dayKey, deadlines } from "@/lib/derive";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

function greeting(h: number) {
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [classes, assignments, apps, picks] = await Promise.all([
    getClasses(),
    getAssignments(),
    getApplications(),
    getDailyPicks(),
  ]);

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const appsThisWeek = apps.filter((a) => new Date(a.appliedAt) >= weekAgo).length;
  const interviews = apps.filter((a) => a.status === "interview" || a.status === "oa").length;
  const dueSoon = assignments.filter((a) => {
    if (a.status === "done") return false;
    const out = (new Date(`${a.dueDate}T00:00:00`).getTime() - Date.now()) / 86_400_000;
    return out >= -1 && out <= 7;
  }).length;

  const counts = activityCounts(assignments, apps);

  // Today's completion drives the ring beside the heatmap.
  const today = dayKey(now);
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
        eyebrow={now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        title={greeting(now.getHours())}
        stats={
          <>
            <StatChip label="Applied this week" value={appsThisWeek} icon={<Send />} />
            <StatChip
              label="Active interviews"
              value={interviews}
              icon={<MessagesSquare />}
              tone={interviews ? "ok" : "default"}
            />
            <StatChip
              label="Due in 7 days"
              value={dueSoon}
              icon={<CalendarClock />}
              tone={dueSoon > 4 ? "warn" : "default"}
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

      {/* Asymmetric on purpose: the timeline is the spine and runs full height;
          picks and activity stack beside it at different weights. */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12">
        <Card
          title="Timeline"
          className="flex min-h-0 min-w-0 flex-col lg:col-span-5"
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

        <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:col-span-7">
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

          <Card
            title="Activity"
            className="flex min-h-0 min-w-0 flex-[2] flex-col"
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
