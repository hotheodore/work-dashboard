import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, StatGrid, StatTile } from "@/components/ui";
import PickList from "@/components/internships/PickList";
import Pipeline from "@/components/internships/Pipeline";
import AppFunnel from "@/components/charts/AppFunnel";
import ActivityHeatmap from "@/components/charts/ActivityHeatmap";
import { getApplications, getListings, getSettings } from "@/lib/store";
import { getDailyPicks } from "@/lib/jobs";
import { activityCounts, funnelData } from "@/lib/derive";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const [apps, picks, cache, settings] = await Promise.all([
    getApplications(),
    getDailyPicks(),
    getListings(),
    getSettings(),
  ]);

  const active = apps.filter((a) => a.status !== "rejected");

  return (
    <>
      <PageHeader
        title="Internships"
        subtitle={
          cache.fetchedAt
            ? `${cache.jobs.length} live postings cached · updated ${new Date(cache.fetchedAt).toLocaleString()}`
            : "No listings cached yet — refresh them in Settings"
        }
        action={
          // Every other page's action slot holds a button; this was a bare link.
          <Link
            href="/settings"
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface-2"
          >
            <SlidersHorizontal size={14} aria-hidden />
            Filters &amp; refresh
          </Link>
        }
      />

      <StatGrid>
        <StatTile label="Total applications" value={apps.length} />
        <StatTile label="In play" value={active.length} />
        <StatTile
          label="Offers"
          value={apps.filter((a) => a.status === "offer").length}
          tone="ok"
        />
        <StatTile label="Matching pool" value={picks.matchPool} hint="unseen postings that fit your filters" />
      </StatGrid>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          title={`Today's ${settings.picksPerDay} picks`}
          className="lg:col-span-2"
        >
          <PickList jobs={picks.jobs} matchPool={picks.matchPool} />
        </Card>
        <div className="space-y-4">
          <Card title="Funnel">
            <AppFunnel data={funnelData(apps)} compact />
          </Card>
          {/* Deliberately applications-only. Retitled because an identically
              styled card on the dashboard counts assignments too. */}
          <Card title="Application activity">
            <ActivityHeatmap counts={activityCounts([], apps)} compact />
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card title="Pipeline" bodyClass="px-2 pb-2">
          <Pipeline apps={[...apps].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))} />
        </Card>
      </div>
    </>
  );
}
