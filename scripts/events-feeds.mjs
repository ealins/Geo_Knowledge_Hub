// Event feeds. Reads open calendars that publish structured data (JSON API or
// RSS) instead of crawling pages: OpenStreetMap Calendar, WikiCFP categories and
// the IEEE GRSS events API. Output: data/events-feeds.json, read by radar.mjs
// as the source "feed-events". robots.txt is respected for every request.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText, robotsAllows } from "./net.mjs";
import { parseOsmcal, parseWikicfp, parseTribe, termRegex } from "./events-feeds-lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(await readFile(path.join(ROOT, "config", "events-feeds.json"), "utf8"));
const domain = JSON.parse(await readFile(path.join(ROOT, "config", "domain.json"), "utf8"));
const OUT = path.join(ROOT, "data", "events-feeds.json");
const prev = await readFile(OUT, "utf8").then(JSON.parse).catch(() => ({ items: [] }));
const now = new Date();
const nowIso = now.toISOString();
const TOPIC = termRegex(domain.terms);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (d) => d.toISOString().slice(0, 10);

async function get(url) {
  if (!(await robotsAllows(url))) throw new Error("disallowed by robots.txt");
  await sleep(400);
  return fetchText(url, { accept: "application/json,application/rss+xml,text/xml;q=0.9,*/*;q=0.5" });
}

const jobs = [];
if (cfg.osmcal?.enabled) {
  jobs.push({ origin: "osmcal", run: async () => parseOsmcal(await get(cfg.osmcal.url), { topic: TOPIC, keep: new RegExp(cfg.osmcal.keep_title, "i"), now }) });
}
for (const cat of cfg.wikicfp?.categories ?? []) {
  jobs.push({ origin: "wikicfp:" + cat, run: async () => parseWikicfp(await get(`${cfg.wikicfp.url}?cat=${encodeURIComponent(cat)}`), { topic: TOPIC, now, exclude: (cfg.wikicfp.exclude_title ?? []).map((p) => new RegExp(p, "i")) }) });
}
for (const t of cfg.tribe ?? []) {
  jobs.push({
    origin: "tribe:" + new URL(t.url).hostname,
    run: async () => {
      const out = [];
      const end = new Date(now.getTime() + 730 * 864e5);
      for (let page = 1; page <= (t.max_pages ?? 5); page++) {
        const body = JSON.parse(await get(`${t.url}?per_page=50&page=${page}&start_date=${iso(now)}&end_date=${iso(end)}`));
        out.push(...parseTribe(body, { host: new URL(t.url).hostname, now }));
        if (page >= (body.total_pages ?? 1)) break;
      }
      return out;
    },
  });
}

const items = [];
const seen = new Set();
const status = {};
for (const job of jobs) {
  try {
    const found = await job.run();
    status[job.origin] = { ok: true, items: found.length };
    console.log(`${job.origin}: ${found.length}`);
    for (const e of found) {
      const key = e.url;
      if (!seen.has(key)) { seen.add(key); items.push({ ...e, origin: job.origin, discovered_at: nowIso }); }
    }
  } catch (e) {
    // A feed that fails keeps its earlier events (still upcoming) instead of vanishing.
    const keep = prev.items.filter((i) => i.origin === job.origin && Date.parse(i.ends) + 864e5 >= now.getTime());
    status[job.origin] = { ok: false, error: e.message, kept: keep.length };
    console.log(`${job.origin}: failed (${e.message}), keeping ${keep.length}`);
    for (const i of keep) if (!seen.has(i.url)) { seen.add(i.url); items.push(i); }
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ generated_at: nowIso, count: items.length, status, items }, null, 1) + "\n");
console.log(`events from feeds: ${items.length}`);
