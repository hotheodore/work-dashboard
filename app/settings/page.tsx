import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui";
import SettingsForm from "@/components/settings/SettingsForm";
import { getListings, getSettings } from "@/lib/store";
import { hasKey } from "@/lib/claude";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, listings] = await Promise.all([getSettings(), getListings()]);
  const key = hasKey();

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
      <SettingsForm
        initial={settings}
        fetchedAt={listings.fetchedAt}
        cachedCount={listings.jobs.length}
      />
    </>
  );
}
