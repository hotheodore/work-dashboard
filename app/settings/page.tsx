import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui";
import SettingsForm from "@/components/settings/SettingsForm";
import { getListings, getSettings } from "@/lib/store";
import { hasKey } from "@/lib/claude";

// reads data/*.json at request time — never prerender
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, listings] = await Promise.all([getSettings(), getListings()]);

  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForm
        initial={settings}
        fetchedAt={listings.fetchedAt}
        cachedCount={listings.jobs.length}
      />
      <div className="mt-6">
        <Card title="Claude API">
          <p className="text-sm text-muted">
            {hasKey()
              ? "API key detected. Resume tailoring, cover letters, and syllabus parsing are available."
              : "No API key. Everything else works; tailoring and syllabus parsing need ANTHROPIC_API_KEY in .env.local, then a dev server restart."}
          </p>
        </Card>
      </div>
    </>
  );
}
