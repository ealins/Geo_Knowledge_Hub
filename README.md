# Geo Radar

**A live radar of open academic opportunities in photogrammetry, remote sensing and geoinformatics.**

🌐 **Live site:** [geoacademic.app](https://geoacademic.app)

Geo Radar collects PhD and research positions, master's programmes, conferences and schools, high-impact papers and field news from public sources, keeps only what is relevant and still open, and shows it on one page. It refreshes every hour and forgets anything that has gone stale.

It is not a research database or a search engine. It is a short, fresh list: what you can still apply to, attend or read this month.

---

## Contents

- [What it covers](#what-it-covers)
- [How it works](#how-it-works)
- [Freshness rules](#freshness-rules)
- [Repository layout](#repository-layout)
- [Run locally](#run-locally)
- [Deploy your own](#deploy-your-own)
- [Adapt it to another domain](#adapt-it-to-another-domain)
- [Configuration reference](#configuration-reference)
- [Responsible crawling](#responsible-crawling)
- [Contributing](#contributing)
- [License](#license)

---

## What it covers

**Fields.** Photogrammetry, remote sensing, geoinformatics, geodesy and geomatics, including earth observation, SAR/InSAR, LiDAR and point clouds, GIS, GNSS, GeoAI, UAV mapping, hyper- and multispectral imaging, and BIM/CityGML/digital twins. German terms (Fernerkundung, Photogrammetrie, Geoinformatik, Geodäsie) are matched too. The full keyword list is in [`config/domain.json`](config/domain.json).

**Kinds of items.**

| Kind | Examples | Kept for |
|---|---|---|
| Jobs | PhD, postdoc, research assistant, scientist, internship, graduate programme | 30 days unseen |
| Courses | MSc and other degree programmes with an application deadline | 120 days |
| Events | Conferences, workshops, symposia, summer/winter schools, calls for papers | 60 days |
| Papers | Recent papers with demonstrated impact (top venue, citations, top-10 % flag) | 60 days |
| News | Field press and agency news (RSS) | 7 days |

**Sources.** About 125 configured sources: university and research-centre career pages (e.g. DLR, ESA, EUMETSAT, ETH Zurich, EPFL, DTU, Aalto, AWI), EURAXESS and jobs.ac.uk searches, programme pages, ISPRS and society event calendars, OpenAlex for papers, and RSS feeds from the geo press and agencies. See [`config/sources.json`](config/sources.json).

---

## How it works

```
                 hourly cron (Cloudflare Worker)
                              │
        ┌─────────────────────┼──────────────────────────┐
        ▼                     ▼                          ▼
 render career pages   dispatch GitHub workflows   tag new items with AI
 (Browser Rendering,   radar · discover ·          (type + relevance,
  every 12 h → KV)     discover-events · adzuna     capped per run → KV)
                              │
                              ▼
               scripts/radar.mjs  (GitHub Actions)
        fetch sources → check robots.txt → parse → match domain
        → read deadlines → merge into data/feed.json → drop stale
                              │
                              ▼
               scripts/build.mjs → dist/  → Cloudflare Worker (static assets)
                              │
                              ▼
                       geoacademic.app
```

1. **Collect.** [`scripts/radar.mjs`](scripts/radar.mjs) fetches every enabled source in `config/sources.json` (RSS/Atom, HTML listing pages, EURAXESS, jobs.ac.uk, OpenAlex, ISPRS calendars), checks robots.txt first, and parses the items.
2. **Filter.** An item is kept only if it matches the domain terms and a kind's keywords in [`config/domain.json`](config/domain.json), and none of the exclusions.
3. **Find deadlines.** [`scripts/deadline.mjs`](scripts/deadline.mjs) opens the item's own page and reads the closing date, first from schema.org JSON-LD (`validThrough`), then from dates written next to words like "deadline", "closing date", "apply by" or "Bewerbungsfrist".
4. **Discover.** Three extra jobs widen the net without manual source lists:
   - [`discover.mjs`](scripts/discover.mjs) (weekly): ranks universities by recent output in the field via OpenAlex, then finds their programme pages and deadlines.
   - [`discover-events.mjs`](scripts/discover-events.mjs) (daily): starts from ISPRS member societies and related calendars, visits each organisation and keeps upcoming events.
   - [`adzuna.mjs`](scripts/adzuna.mjs) (daily, capped): job search via the Adzuna API.
5. **Render JavaScript pages.** The Worker ([`worker/index.js`](worker/index.js)) renders career pages that need a browser (Cloudflare Browser Rendering) twice a day and stores the links in KV; the radar reads them from `/api/collected`.
6. **Tag.** The Worker classifies new jobs, courses and events with a small model on Workers AI (type: PhD/postdoc/student/internship/industry; relevance 0–10; one-line summary). Results are cached in KV and served at `/api/ai`.
7. **Build and deploy.** [`scripts/build.mjs`](scripts/build.mjs) copies the page and data into `dist/`; the workflow commits the feed and deploys the Worker.

**Scheduling.** GitHub's own scheduler often skips or delays runs, so the Worker's hourly cron dispatches the workflows instead. The cron entries in the workflows are only a fallback.

---

## Freshness rules

- Every item records `first_seen` and `last_seen`. **New** means first seen in the last 7 days.
- Positions, programmes and events are shown only with a **confirmed open deadline** read from the item's own page. Items without a listed deadline are hidden unless you tick the box. Closed items are removed.
- Papers are kept only if they show impact: a top venue (list in `config/domain.json`), citations, field-weighted citation impact or OpenAlex's top-10 % flag, and are ranked by that score.
- Each kind has its own retention window (`retain_days`). An item disappears once it has gone unseen for longer than that.
- A source that fails 5 times in a row is paused. Set its `consecutive_failures` in `data/status.json` to `0` to retry.
- Sources whose robots.txt disallows the bot are skipped and reported as errors.

---

## Repository layout

```
.github/workflows/   radar (fetch, build, deploy), discover, discover-events, adzuna, validate-radar (PR checks)
config/              domain terms, sources, discovery settings, collector pages, Adzuna queries
scripts/             radar, build, deadline parser, discovery jobs, UI check, tests
site/                the single-page front end (index.html), fonts, brand assets, vendored d3 + Natural Earth land
worker/              Cloudflare Worker: static assets, /api/collected, /api/ai, hourly cron
data/                generated: feed.json, status.json, discovered programmes/events, curated items, logs
wrangler.jsonc       Worker configuration (domain, bindings, cron)
```

---

## Run locally

Requirements: **Node.js 20+**.

```bash
git clone https://github.com/ealins/Geo_Knowlege_Hub.git
cd Geo_Knowlege_Hub
npm install

npm run fetch     # node scripts/radar.mjs  → updates data/feed.json
npm run build     # node scripts/build.mjs  → writes dist/
npm test          # unit tests (deadline parser, source config)
npm run check-ui  # Playwright screenshots of the built page (needs Playwright)
```

Open `dist/index.html` through any static server, for example `npx serve dist`.

Optional: set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` to run `scripts/adzuna.mjs`.

---

## Deploy your own

The site runs as a Cloudflare Worker serving static assets, with GitHub Actions doing the fetching.

1. **Cloudflare.** Create an API token from the "Edit Cloudflare Workers" template, and a KV namespace. Put the namespace id and your domain into `wrangler.jsonc`.
2. **GitHub secrets.** In the repository settings add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (and `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` if you use Adzuna).
3. **Worker secret.** Add `GH_TOKEN` to the Worker: a fine-grained token for this repository only, with permission "Actions: read and write". The Worker uses it to start the workflows on time.
4. **Bindings.** The Worker uses Workers AI (`AI`), Browser Rendering (`BROWSER`) and KV (`KV`). All three have free allowances; the AI tagging is capped per run to stay within them.
5. Push to `main`. The `radar` workflow builds and deploys.

---

## Adapt it to another domain

Nothing in the code is specific to geoinformatics. To build a radar for another field:

1. Replace the `terms`, `exclude` and `top_venues` in `config/domain.json`.
2. Replace the sources in `config/sources.json` (career pages, EURAXESS/jobs.ac.uk searches, OpenAlex queries, RSS feeds).
3. Adjust the discovery queries in `config/discover.json` and the starting directories in `config/discover-events.json`.
4. Update the AI tagging prompt in `worker/index.js`, and the title and texts in `site/index.html`.

---

## Configuration reference

| File | Purpose |
|---|---|
| `config/domain.json` | Domain terms, per-kind keywords, exclusions, retention windows, paper impact threshold, top venues |
| `config/sources.json` | All sources: `id`, `name`, `url`, `type` (html, rss, euraxess, jobsacuk, openalex, isprs-calendar, …), `kind`, `enabled` |
| `config/boards.json` | Include/exclude rules for job boards |
| `config/collector.json` | Career pages the Worker renders in a browser |
| `config/discover.json` | Programme discovery: OpenAlex queries, countries, limits per university |
| `config/discover-events.json` | Event discovery: societies, hubs, hosts to include or skip |
| `config/adzuna.json` | Adzuna queries and daily call cap |

Set `enabled: true` on a source only after its URL has been checked.

---

## Responsible crawling

- robots.txt is checked before every fetch; disallowed sources are skipped.
- Requests identify themselves as `GeoRadarBot/1.0 (+https://geoacademic.app)`.
- Each source is fetched at most a few times a day, and failing sources are paused automatically.
- Only titles, links, dates and short summaries are kept. Each item links back to its original page.

If you run a site listed here and want it removed or fetched differently, please open an issue.

---

## Contributing

Suggestions for sources are the most useful contribution. Open an issue or a pull request that adds an entry to `config/sources.json`. Pull requests that change `config/` are validated automatically by the `validate-radar` workflow.

---

## License

No license has been chosen yet, so all rights are reserved by default. Open an issue if you would like to reuse the code.

---

Built by [Ealin Sapkota](https://github.com/ealins), MSc Photogrammetry & Geoinformatics, HFT Stuttgart.
