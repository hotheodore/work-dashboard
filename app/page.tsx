import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Card, EmptyState, StatTile } from "@/components/ui";
import DeadlineList from "@/components/DeadlineList";
import DueTimeline from "@/components/charts/DueTimeline";
import AppFunnel from "@/components/charts/AppFunnel";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import ClassCompletion from "@/components/charts/ClassCompletion";
import TodayAssignments from "@/components/TodayAssignments";
import PickList from "@/components/internships/PickList";
import { getApplications, getAssignments, getClasses } from "@/lib/store";
import { getDailyPicks } from "@/lib/jobs";
import {
  activityCounts,
  completionData,
  dayKey,
  deadlines,
  funnelData,
  timelineData,
} from "@/lib/derive";
import { streak } from "@/lib/grades";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [classes, assignments, apps, picks] = await Promise.all([
    getClasses(),
    getAssignments(),
    getApplications(),
    getDailyPicks(),
  ]);

  const today = dayKey(new Date());
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
  const days = streak(Object.keys(counts));
  const dueToday = assignments.filter((a) => a.dueDate === today && a.status !== "done");

  const empty = !classes.length && !apps.length && !picks.jobs.length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString(undefined, {
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Applications this week" value={appsThisWeek} />
        <StatTile label="Active interviews" value={interviews} tone={interviews ? "ok" : "default"} />
        <StatTile
          label="Due in 7 days"
          value={dueSoon}
          tone={dueSoon > 4 ? "warn" : "default"}
        />
        <StatTile label="Streak" value={`${days}d`} hint="days with activity" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          title="Today"
          className="lg:col-span-2"
          action={
            <Link href="/internships" className="text-xs text-accent hover:underline">
              All picks →
            </Link>
          }
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">
                Due today
              </p>
              <TodayAssignments assignments={dueToday} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Due next 14 days"
          action={
            <Link href="/assignments" className="text-xs text-accent hover:underline">
              Assignments →
            </Link>
          }
        >
          <DueTimeline data={timelineData(assignments, classes)} classes={classes} compact />
        </Card>
        <Card
          title="Application funnel"
          action={
            <Link href="/internships" className="text-xs text-accent hover:underline">
              Pipeline →
            </Link>
          }
        >
          <AppFunnel data={funnelData(apps)} compact />
        </Card>
        <Card title="Activity">
          <ActivityHeatmap counts={counts} compact />
        </Card>
        <Card title="Completion by class">
          <ClassCompletion data={completionData(assignments, classes)} compact />
        </Card>
      </div>
    </>
  );
}
