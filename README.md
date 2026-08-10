# Work Dashboard

A dashboard for tracking coursework and internship applications, built with Next.js 16, React 19, and Tailwind CSS 4. State is JSON — on local disk during development, in Vercel Blob when deployed. No database, no accounts.

> **Note:** Run it locally with `npm run dev`, or deploy it to Vercel — see [Deploying](#deploying). This page is documentation only.

## Features

### Dashboard
KPI tiles, the assignments due today, the day's internship picks, a deadline countdown, and four Recharts visualizations covering grade trends, workload distribution, and application progress.

### Assignments
One page per class, each with its own table and charts. Add work manually, or paste a syllabus and let Claude extract the schedule — every extracted item is shown for review before anything is written to disk.

### Internships
Five previously unseen postings surfaced each day, merged and deduplicated across several sources, an application pipeline to track each one through its stages, and per-job resume tailoring with a generated cover letter draft.

| Source | Needs | Notes |
| --- | --- | --- |
| [vanshb03/Summer2027-Internships](https://github.com/vanshb03/Summer2027-Internships) | nothing | Public `listings.json`; wins when a posting appears in more than one feed |
| [SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships) | nothing | Public `listings.json` |
| Handshake | `HANDSHAKE_COOKIE`, `HANDSHAKE_HOST` | No public student API — the adapter replays your own signed-in session, so it stops working when that cookie expires |
| Indeed | `SERPAPI_KEY`, or `INDEED_SEARCH_URL` | Indeed retired its open API and blocks server-side requests, so postings come through a search provider you hold a key for |

A source with missing credentials is reported as skipped in Settings; a source that errors is reported with its message. Neither stops the others from landing.

### Resume, Calendar, Notes, and Settings
A resume of record that feeds the tailoring step, a month view of every deadline across all classes and applications, interview-prep notes, and filters plus a manual listings refresh.

## Getting started

```bash
git clone https://github.com/hotheodore/work-dashboard.git
cd work-dashboard
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run check      # grade / streak / job-filter self-check
npm run build      # production build
npm run lint
```

### Optional: Claude API

Resume tailoring, cover letters, and syllabus parsing call the Claude API. Every other feature works without a key.

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

Seed the resume from a PDF once, then edit it on the Resume page:

```bash
npm run seed:resume -- "path/to/Resume.pdf"
```

## Deploying

The app runs on Vercel. A serverless filesystem is read-only and discarded between requests, so the hosted instance keeps the same JSON files in [Vercel Blob](https://vercel.com/docs/vercel-blob) instead of `data/`. The switch is automatic: `lib/store.ts` uses Blob whenever `BLOB_READ_WRITE_TOKEN` is set, and local disk otherwise, so `npm run dev` is unchanged.

1. Push the repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. In the project, **Storage → Create → Blob**, then connect the store. Vercel adds `BLOB_READ_WRITE_TOKEN` to the environment.
3. Add the remaining environment variables (Project → Settings → Environment Variables):

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `BLOB_READ_WRITE_TOKEN` | yes | Added by the Blob store; switches storage off the filesystem |
   | `DASHBOARD_PASSWORD` | yes | The password for the sign-in page. Without it the site is public |
   | `ANTHROPIC_API_KEY` | optional | Resume tailoring, cover letters, syllabus parsing |
   | `CRON_SECRET` | optional | Lets the daily listings cron through the password gate |
   | `HANDSHAKE_COOKIE` | optional | Enables the Handshake source — the `Cookie` header from a signed-in request |
   | `HANDSHAKE_HOST` | optional | Your school's host, e.g. `myschool.joinhandshake.com` (default `app.joinhandshake.com`) |
   | `SERPAPI_KEY` | optional | Enables the Indeed source via SerpApi's `indeed` engine |
   | `INDEED_SEARCH_URL` | optional | Alternative to `SERPAPI_KEY`: any JSON search endpoint, with `{query}` / `{location}` placeholders |
   | `INDEED_API_KEY` | optional | Sent as `Authorization: Bearer` with `INDEED_SEARCH_URL` |

   **Without `BLOB_READ_WRITE_TOKEN` the deploy cannot persist anything.** The bundle at `/var/task` is read-only, so `lib/store.ts` falls back to the OS temp dir — writes stop failing with `EROFS`, but they vanish when the instance recycles, and Settings shows a warning saying so.

4. Copy `BLOB_READ_WRITE_TOKEN` into your local `.env.local` and seed the store with the data already on your machine:

   ```bash
   npm run data:push
   ```

   This overwrites the remote copies, so run it before the first deploy, not after editing data in the hosted app.

5. Redeploy. Visiting any page now asks for `DASHBOARD_PASSWORD` first.

Access control lives in `proxy.ts`: every route except `/login` requires a cookie holding a SHA-256 of the password, API routes get a `401` instead of a redirect, and the whole gate is skipped when `DASHBOARD_PASSWORD` is unset. `vercel.json` schedules the listings refresh at 12:00 UTC daily (the Hobby plan allows one cron run per day).

## How data is stored

Everything lives in `data/` locally — one JSON file per concern, written atomically so a crash mid-write cannot corrupt a file — and under the `work-dashboard/` prefix of the Blob store when deployed, as private blobs with no public URL. Delete any local file to reset that section — the app recreates it empty on next load.

| File | Holds |
| --- | --- |
| `assignments.json` | Assignments across all classes |
| `classes.json` | Class list, grade weights |
| `applications.json` | Internship application pipeline |
| `listings-cache.json` | Cached upstream job feed (gitignored, regenerated) |
| `daily-picks.json` | Which postings were surfaced on which day |
| `seen-jobs.json` | Postings already shown, so picks never repeat |
| `resume.json` | Resume of record |
| `notes.json` | Interview-prep notes |
| `settings.json` | Role keywords, locations, season, picks per day |

Generated tailoring documents land in `data/tailored/` and are gitignored. Listings refresh at most every 12 hours; force one from Settings. The season filter defaults to `Summer 2027` — change it in Settings when the cycle moves.

## Stack

Next.js 16 (App Router, React Server Components) · React 19 · TypeScript · Tailwind CSS 4 · Recharts 3 · Anthropic SDK

## License

MIT
