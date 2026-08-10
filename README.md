# Work Dashboard

A local-first dashboard for tracking coursework and internship applications, built with Next.js 16, React 19, and Tailwind CSS 4. All state lives on disk as JSON — no database, no account, no cloud sync.

> **Note:** This is a self-hosted application, not a hosted web service. It reads and writes files on the machine it runs on and uses server-side API routes, so it must be run locally with `npm run dev`. This page is documentation only.

## Features

### Dashboard
KPI tiles, the assignments due today, the day's internship picks, a deadline countdown, and four Recharts visualizations covering grade trends, workload distribution, and application progress.

### Assignments
One page per class, each with its own table and charts. Add work manually, or paste a syllabus and let Claude extract the schedule — every extracted item is shown for review before anything is written to disk.

### Internships
Five previously unseen postings surfaced each day from the public [SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships) feed, an application pipeline to track each one through its stages, and per-job resume tailoring with a generated cover letter draft.

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

## How data is stored

Everything lives in `data/`, one JSON file per concern, written atomically so a crash mid-write cannot corrupt a file. Delete any file to reset that section — the app recreates it empty on next load.

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
