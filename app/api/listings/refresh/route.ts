import { refreshListings } from "@/lib/jobs";

export const maxDuration = 60;

/** Vercel Cron issues GET; the UI posts. Same work either way. */
export const GET = (request: Request) => POST(request);

export async function POST(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  try {
    const cache = await refreshListings(force);
    return Response.json({
      fetchedAt: cache.fetchedAt,
      count: cache.jobs.length,
      sample: cache.jobs[0] ?? null,
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "refresh failed" },
      { status: 502 },
    );
  }
}
