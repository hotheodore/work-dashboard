import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, StatGrid, StatTile } from "@/components/ui";
import DeadlineList from "@/components/DeadlineList";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import TodayAssignments from "@/components/TodayAssignments";
import PickList from "@/components/internships/PickList";
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
  const today = dayKey(now);
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
  const dueToday = assignments.filter((a) => a.dueDate === today && a.status !== "done");

  const empty = !classes.length && !apps.length && !picks.jobs.length;

  return (
    <>
      <PageHeader
        title={greeting(now.getHours())}
        subtitle={now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      {empty && (
        <div className="mb-6">
          <EmptyState
            title="Nothing tracked yet"
            hint="Add a class under Assignments, then refresh listings in Settings to start getting daily internship picks."
          />
        </div>
      )}

      {/* Focal block: what to do right now, with deadlines as the context rail. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Today"
          className="overflow-hidden lg:col-span-2"
          bodyClass="p-6"
          action={
            <Link
              href="/internships"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              All picks <ArrowRight size={12} aria-hidden />
            </Link>
          }
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-faint">
                Due today
              </p>
              <TodayAssignments assignments={dueToday} />
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-faint">
                Today&apos;s picks
              </p>
              <PickList jobs={picks.jobs} matchPool={picks.matchPool} compact />
            </div>
          </div>
        </Card>

        <Card title="Deadlines">
          <DeadlineList items={deadlines(assignments, apps, classes)} />
        </Card>
      </div>

      <StatGrid cols={3} className="mt-4">
        <StatTile label="Applications this week" value={appsThisWeek} />
        <StatTile label="Active interviews" value={interviews} tone={interviews ? "ok" : "default"} />
        <StatTile label="Due in 7 days" value={dueSoon} tone={dueSoon > 4 ? "warn" : "default"} />
      </StatGrid>

      <div className="mt-4">
        <Card title="Activity" bodyClass="p-6">
          <ActivityHeatmap counts={counts} weeks={18} showStats />
        </Card>
      </div>
    </>
  );
}
