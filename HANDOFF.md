# Workbench — Handoff

Built 2026-08-10. Everything below is implemented and verified unless a section says otherwise.

---

## 1. What this is and why

Theodore wanted one local app replacing scattered tracking of two workstreams — coursework and internship applications — plus automation of the daily "what do I apply to today" decision. Three core jobs:

1. **Dashboard homepage** — at-a-glance state of everything.
2. **Assignment tracker** — a subsection per class, charts, syllabus ingestion.
3. **Internship tracker** — five internships a day with per-job resume tailoring.

All connected by a persistent sidebar.

Decisions locked during the requirements interview: Next.js, clean light design **plus** a matching dark mode, JSON files on disk for storage, public GitHub internship listings as the job source, Anthropic API key in `.env.local` for the LLM features, resume seeded by parsing the existing PDF.

---

## 2. Stack

| Piece | Choice | Note |
|---|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack) | scaffolded with `create-next-app` |
| Language | TypeScript, strict | |
| Styling | Tailwind CSS v4 + CSS custom properties | tokens in `app/globals.css` |
| Charts | Recharts 3 | heatmap is hand-rolled CSS grid |
| LLM | `@anthropic-ai/sdk`, model `claude-opus-5` | server-side only |
| Storage | JSON files in `data/` | no database |

Removed during the build: `pdf-parse` and `date-fns`. The Claude API reads PDFs natively, and the date math needed was a handful of lines. `server-only` is installed and guards the server modules.

Runs locally: `npm run dev` → http://localhost:3000. No auth, no deployment target.

---

## 3. Commands

```bash
npm run dev          # dev server
npm run build        # production build (also typechecks)
npm run check        # logic self-check — grades, streak, job filters
npm run lint
npm run seed:resume -- "C:/Users/theod/Documents/Resume - Theodore Ho FINAL.pdf"
```

`seed:resume` loads `.env.local` via `--env-file-if-exists`, so it works whether or not the key is set (it exits with a clear message when it isn't).

---

## 4. Layout of the code

```
app/
  layout.tsx                    sidebar shell + pre-paint theme script
  globals.css                   design tokens (light + dark), .card
  page.tsx                      dashboard homepage
  assignments/page.tsx          class overview
  assignments/[classId]/page.tsx  per-class subsection
  internships/page.tsx          daily picks + pipeline
  resume/ calendar/ notes/ settings/  supporting pages
  api/listings/refresh/route.ts   fetch + normalize + cache upstream listings
  api/syllabus/parse/route.ts     Claude → structured assignment drafts
  api/tailor/route.ts             Claude → tailored bullets + cover letter
lib/
  types.ts        shared types, no logic
  store.ts        the ONLY module that touches fs (server-only)
  actions.ts      server actions — every mutation goes through here
  jobs.ts         server-side: refresh across sources, cache, daily picks (server-only)
  sources/        one adapter per listings backend + fetchAllSources (github, handshake, indeed)
  jobFilters.ts   pure: normalizeListing, dedupeJobs, filterJobs, todayKey (no fs, testable)
  grades.ts       pure: weighted grade math, activity streak
  derive.ts       pure: chart data + deadline shaping
  chartTheme.ts   series palette per theme + live theme detection
  claude.ts       lazy Anthropic client, model constant, hasKey()
components/
  ui/index.tsx    Card, StatTile, Badge, Button, Modal, EmptyState, Field, inputClass
  charts/         DueTimeline, AppFunnel, ClassCompletion, ActivityHeatmap
  <feature>/      assignments, internships, resume, notes, settings
scripts/
  check.ts        assert-based self-check
  seed-resume.ts  one-time PDF → data/resume.json
```

**Rules the code follows — keep them.** Nothing outside `lib/store.ts` calls `fs`. Every mutation is a server action in `lib/actions.ts`. Chart components take data as props and are reused by both the detail page and the homepage via a `compact` prop — one implementation each. Components reference CSS tokens, never hardcoded hex.

---

## 5. Data layer

Files in `data/`, all written atomically (temp file + rename), so a crash mid-write can't truncate one. With `BLOB_READ_WRITE_TOKEN` set, the same files live in Vercel Blob instead. Third case: deployed *without* a Blob token, where `/var/task/data` is read-only — the first write catches `EROFS`/`EACCES`/`EPERM`, switches to the OS temp dir for the rest of the process, and `storageWarning()` reports that writes will not survive. Reads then check temp first and fall back to the bundled copy as a seed.

| File | Contents |
|---|---|
| `classes.json` | `{ id, name, code, color, term }` |
| `assignments.json` | `{ id, classId, title, dueDate, weight, status, grade, notes, completedAt }` |
| `applications.json` | `{ id, jobId, company, role, url, appliedAt, status, deadline, tailoringPath }` |
| `seen-jobs.json` | job ids already served — daily picks never repeat |
| `daily-picks.json` | `{ "YYYY-MM-DD": [jobId, …] }` — today's slate |
| `resume.json` | contact, education, experiences, projects, skills (bullets carry ids) |
| `notes.json` | `{ id, title, body, tags, updatedAt }` |
| `settings.json` | role keywords, locations, remoteOnly, season, picksPerDay |
| `listings-cache.json` | `{ fetchedAt, jobs[] }` — trimmed upstream feed |
| `tailored/<jobId>.md` | generated tailoring + cover letter (gitignored) |

Delete a file to reset that section; `read()` falls back to an empty value.

`readTailored` resolves the path and refuses anything outside `data/` — the path round-trips through JSON on disk, so it is not trusted blindly.

---

## 6. Design system

- Tokens as CSS variables on `:root` (light), redefined under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`, so an explicit choice wins in both directions.
- Tailwind v4 `@theme inline` maps those variables to utility names: `bg-surface`, `text-muted`, `border-border`, `text-accent`, and so on.
- Theme toggle (system / light / dark) sits in the sidebar footer, persists to `localStorage`, and is applied by a tiny inline script in `<head>` so there is no flash of the wrong theme.
- Dark mode is the **same design**, not a different one: identical layout, spacing, and shadows; only the palette swaps.
- Palette: a warm off-white ground and one blue ramp, no second hue. `--accent-3` is the darkest blue the set allows (`#071A33` light — near-black and still reading blue), `--accent` the navy lead, `--accent-2` the light-blue end. The three are spread across the tinted cards, the hero rule, the sidebar's active bar, and the stat chips. Semantic colors stay green/amber/red.
- Dark-mode accents sit at roughly 5-7:1 on `--surface`, not the 8-11:1 they started at — brighter than that and they glowed against the warm gray. The chip tints follow: `--soft-mix` is 14% in light, 8% in dark, because the same mix over a dark surface leaves the label short of AA.
- Gradients carry the depth: `--surface-gradient` (cards darken slightly toward the bottom), `--glow` (one wash, top-left, behind page headers), the primary button's top highlight, and the accented card's rule. Two earlier ambient washes — a second one on the right of every header and a radial in each tinted card's corner — were cut: together they tinted the whole page rather than accenting it.
- Icons and install: `app/icon.svg` is the tab/taskbar favicon, `app/apple-icon.png` the iOS home-screen icon, and `app/manifest.ts` names the installed app "Workbench" with the `public/icon-*.png` set. `components/Logo.tsx` repeats the icon's geometry with fixed hexes — edit it and `app/icon.svg` together. `proxy.ts` lets these paths past the password gate: install-time fetches carry no cookie, and a gated manifest installs as a blank icon.
- The dashboard header line comes from `lib/greeting.ts` — a hour-bucketed pool (night/morning/afternoon/evening), half plain and half joke, picked per request. Keep it server-side; picking on both sides would be a hydration mismatch.
- `lib/chartTheme.ts` holds light and dark variants of every series color and re-renders charts on theme change (matchMedia + MutationObserver on `data-theme`), so nothing washes out. `colorFor(id)` hashes a class id to a stable color, so a class keeps its color everywhere.

---

## 7. Feature notes and the decisions inside them

### Dashboard (`app/page.tsx`)
KPI row (applications this week, active interviews, due in 7 days, activity streak) → Today card (due-today checkboxes and today's picks with the same Apply/Skip actions as the internships page) → deadline countdown, urgency-colored → 2×2 grid of compact charts, each linking to its full page.

### Assignments
Overview shows class cards with completion, next due, and current grade. The class page has the sortable table, four stat tiles, its own two charts, and the syllabus box.

**Grade math** (`lib/grades.ts`): current grade is the weighted average over graded work. Projected final assumes remaining work scores at the current average — **but returns `null` unless entered weights cover ≥95% of the course**, and the tile explains why. Projecting off a half-typed syllabus reports how much you've typed in, not a grade. This is a deliberate change from the original plan.

**Syllabus paste**: textarea → `POST /api/syllabus/parse` → Claude with a strict JSON schema (`output_config.format`) → results land in an **editable review table**. Nothing is written to `assignments.json` until you press confirm. The prompt instructs the model to return an empty date rather than guess when the syllabus gives an unresolvable relative date, so ambiguity surfaces as a blank field for you to fill.

### Internships

**Sources** (`lib/sources/`): one adapter per backend, listed in priority order in `SOURCES` — `vanshb03/Summer2027-Internships`, `SimplifyJobs/Summer2026-Internships` (both public `listings.json` files, same schema, so one `github.ts` adapter covers both), Handshake, and Indeed. `fetchAllSources` runs them in parallel with a 25 s per-source timeout, merges, and dedupes on `host + pathname` of the apply URL — the earlier source wins. Each adapter reports `ok` / `skipped` (missing credentials) / `error` (with the message), stored on the cache as `sources` and shown in Settings. Only an empty *merged* result throws.

Handshake and Indeed are credential-gated by necessity, not by choice: Handshake has no public student API, so the adapter replays a session cookie you paste in (`HANDSHAKE_COOKIE`, `HANDSHAKE_HOST`) against an internal endpoint whose response shape is not contracted — parsing is deliberately tolerant. Indeed retired its open API and 403s server-side requests, so `indeed.ts` goes through a provider you hold a key for (`SERPAPI_KEY`, or `INDEED_SEARCH_URL` with `{query}` / `{location}` placeholders).

The GitHub files are >10 MB combined, so they are fetched in a route handler, filtered to active postings immediately, and only the trimmed set is cached. Refresh is throttled to once per 12 hours; Settings forces one. Upstream field knowledge for the GitHub feeds lives in `normalizeListing`; each other adapter owns its own mapping. Job ids are namespaced (`simplify2026:…`, `handshake-…`) so two feeds carrying the same upstream id stay distinct.

**Daily picks** (`lib/jobs.ts:getDailyPicks`): filter by active, role keywords, location/remote, season, and not-yet-seen; rank newest first with keyword-match strength as tiebreak; take `picksPerDay`; persist under today's date so a refresh never reshuffles.

Two subtleties worth preserving:
- An **empty** stored list means nothing matched last time we looked (no listings cached yet, filters too tight). That case recomputes rather than serving an empty day forever.
- Applying or skipping records the job in `seen-jobs.json` but **does not** shrink today's slate. Handled picks disappear from the display, but skipping one never buys you a replacement — otherwise "five a day" is unbounded.

If fewer than `picksPerDay` match, the UI says so and points at the filters. It never pads.

**Pipeline**: `saved → applied → OA → interview → offer/rejected`, edited inline. The funnel chart reads straight from `applications.json` with funnel semantics (reaching interview implies having applied).

**Tailoring** (`POST /api/tailor`): sends the posting metadata plus `resume.json`, returns Markdown with four sections — lead-with bullets, rewrites, missing keywords, cover letter. Results are cached to `data/tailored/` and the modal offers Regenerate. The system prompt forbids inventing an employer, technology, or metric not present in the resume; anything the posting wants and the resume lacks goes under missing keywords instead. It refuses to run at all on an empty resume, with a message pointing at the seed script.

### Resume / Calendar / Notes / Settings
Resume is a full editor over `resume.json` (entries, bullets, skills) plus a list of generated documents. Calendar is a plain CSS-grid month view merging assignment due dates (accent) and application deadlines (amber), today outlined. Notes are titled Markdown with tags. Settings covers filters, picks-per-day, the forced listings refresh, and an API-key-present indicator that never displays the key.

---

## 8. Claude API usage

Three call sites, all server-side, key never reaches the browser:

| Where | Model | Shape |
|---|---|---|
| `api/syllabus/parse` | `claude-opus-5` | structured outputs via `output_config.format` |
| `api/tailor` | `claude-opus-5` | prose Markdown, `effort: "high"` |
| `scripts/seed-resume.ts` | `claude-opus-5` | base64 PDF document block + structured outputs |

All three check `stop_reason === "refusal"` before reading content. `lib/claude.ts` constructs the client lazily and throws a readable error when the key is missing, so pages that don't need it are unaffected.

---

## 9. What was verified, and how

- `npx tsc --noEmit` clean; `next build` clean.
- All eight routes return 200.
- `POST /api/listings/refresh?force=1` → **1568 active postings cached**, and the first record's fields match `normalizeListing` (`company_name`, `title`, `locations`, `url`, `date_posted`, `terms`, `active`).
- Daily picks written, then byte-identical after a reload.
- Seeded one class and three assignments: they appeared on the class page, the homepage, and the countdown; current grade rendered 88.0%; the projection tile correctly reported "only 50% of the course weight entered". Sample data was removed afterward — the app ships empty.
- `npm run check` passes: grade math (partial coverage, full coverage, empty), streak (contiguous, ending-yesterday, gapped, empty), listing normalization (well-formed and malformed), and the filter stack (keyword, season, remote, active, seen).

**Not verified end-to-end**: the three Claude calls, because no `ANTHROPIC_API_KEY` was configured during the build. Their request shapes follow the current API and typecheck, but the first real run of tailoring, syllabus parsing, and resume seeding is still ahead of you.

---

## 10. Things to know before changing it

- **Every page is `force-dynamic`.** They read `data/*.json` per request. Without it, the build prerenders them, which both freezes the data and races two workers writing `daily-picks.json`. That was a real build failure, not a precaution.
- **`params` is a Promise** in this Next version — `const { classId } = await params`. Route prop types (`PageProps<"/assignments/[classId]">`) are generated; run `npx next typegen` after adding a route or `tsc` will not know about it.
- **`lib/jobFilters.ts` must stay free of `server-only` and `fs`** — `scripts/check.ts` imports it in plain Node. That split exists for exactly that reason.
- **The season filter defaults to `Summer 2027`**, not 2026. The feed has already rolled over (307 Summer 2027 postings against 461 stale Summer 2026 ones as of today). Change it in Settings when the cycle moves again. Postings whose terms are absent are kept rather than silently dropped; `"N/A"` terms will not match a specific season.
- `AGENTS.md` / `CLAUDE.md` in the repo root are generated by `next dev`. Leave them.

---

## 11. Reasonable next steps

None of these are started.

- Application **deadlines** are in the type and the calendar renders them, but no UI sets `deadline` yet — add a field to the pipeline row.
- Tailored documents are listed on the Resume page by filename only; make them viewable there the way the pipeline modal does.
- Notes are plain text in a `<pre>`-ish block; render Markdown if that starts to matter.
- The heatmap counts a completed assignment and a submitted application equally; split them if you want to see which kind of day it was.
- Nothing prunes `seen-jobs.json` or `daily-picks.json`. They grow slowly and harmlessly, but a season rollover is a natural point to clear them.
