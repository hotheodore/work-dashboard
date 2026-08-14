import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui";
import SettingsForm from "@/components/settings/SettingsForm";
import GoogleCalendar from "@/components/settings/GoogleCalendar";
import { getListings, getSettings } from "@/lib/store";
import { hasKey } from "@/lib/claude";
import { configured as googleConfigured, connection } from "@/lib/google";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const [settings, listings, google, params] = await Promise.all([
    getSettings(),
    getListings(),
    connection(),
    searchParams,
  ]);
  const key = hasKey();
  const cfg = googleConfigured();

  // Set by /api/google/callback on the way back from consent.
  const outcome = typeof params.google === "string" ? params.google : undefined;
  const reason = typeof params.reason === "string" ? params.reason : undefined;

  return (
    <>
      {/* API status was a whole Card wrapping one sentence — it's a header badge now. */}
      <PageHeader
        title="Settings"
        subtitle={
          key
            ? "Resume tailoring, cover letters, and syllabus parsing are available."
            : "Tailoring and syllabus parsing need ANTHROPIC_API_KEY in .env.local, then a dev server restart."
        }
        action={
          <Badge tone={key ? "ok" : "default"}>
            {key ? "Claude API connected" : "No Claude API key"}
          </Badge>
        }
      />
      <div className="space-y-6">
        <GoogleCalendar
          connected={Boolean(google)}
          account={google?.account}
          reason={cfg.ok ? undefined : cfg.reason}
          status={
            outcome ? { ok: outcome === "connected", detail: reason ?? "unknown error" } : undefined
          }
        />
        <SettingsForm
          initial={settings}
          fetchedAt={listings.fetchedAt}
          cachedCount={listings.jobs.length}
          sources={listings.sources ?? []}
        />
      </div>
    </>
  );
}
