// Cloudflare Worker entry for geoacademic.app.
// - Static site is served by the assets binding (no code runs for those requests).
// - /api/collected serves the last browser-rendered career-page snapshot from KV.
// - A cron trigger (every 12 h) renders the pages in config/collector.json with Browser Rendering.
import puppeteer from "@cloudflare/puppeteer";
import cfg from "../config/collector.json";

const KEY = "collected";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const AI_MAX_PER_RUN = 120; // ~5 neurons per item, so far below the 10,000 neurons/day included allowance

async function collect(env) {
  const pages = cfg.pages.slice(0, cfg.max_pages);
  const out = { fetched_at: new Date().toISOString(), pages: [] };
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    for (const p of pages) {
      const page = await browser.newPage();
      try {
        await page.setUserAgent("GeoRadarBot/1.0 (+https://geoacademic.app)");
        await page.goto(p.url, { waitUntil: "networkidle2", timeout: cfg.page_timeout_ms });
        const links = await page.evaluate(() => {
          const seen = new Set(); const res = [];
          for (const a of document.querySelectorAll("a[href]")) {
            const t = (a.innerText || a.textContent || "").replace(/\s+/g, " ").trim();
            if (t.length < 12 || t.length > 220 || seen.has(a.href + t)) continue;
            seen.add(a.href + t); res.push({ t, h: a.href });
            if (res.length >= 400) break;
          }
          return res;
        });
        out.pages.push({ id: p.id, name: p.name, url: p.url, ok: true, links });
      } catch (e) {
        out.pages.push({ id: p.id, name: p.name, url: p.url, ok: false, error: String(e.message || e).slice(0, 120), links: [] });
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  // Keep the previous snapshot for pages that failed this time.
  const prev = JSON.parse((await env.KV.get(KEY)) || "null");
  if (prev) for (const q of out.pages) if (!q.ok) { const old = prev.pages.find((x) => x.id === q.id && x.ok); if (old) Object.assign(q, { links: old.links, stale: true }); }
  await env.KV.put(KEY, JSON.stringify(out));
  return out;
}

// Tag new positions, programmes and events once each (cached in KV). Never touches items already tagged.
async function tagItems(env) {
  const feed = await (await fetch("https://geoacademic.app/data/feed.json", { cf: { cacheTtl: 300 } })).json();
  const todo = [];
  for (const it of feed.items) {
    if (!["job", "course", "event"].includes(it.kind)) continue;
    if (await env.KV.get("ai:" + it.id)) continue;
    todo.push(it);
    if (todo.length >= AI_MAX_PER_RUN) break;
  }
  let done = 0;
  for (const it of todo) {
    try {
      const prompt = `Classify this item for a geodata (photogrammetry, remote sensing, GIS, LiDAR, SAR, geodesy, GeoAI, BIM/CityGML) opportunity board.
Title: ${it.title}
Details: ${(it.summary || "").slice(0, 500)}
Place: ${it.location || "unknown"}
Reply with ONLY compact JSON: {"type":"phd|postdoc|student|internship|industry|other","relevance":0-10,"summary":"max 25 words, plain"}.
relevance = how central geodata is to the work (10 core research, 0 unrelated such as sales or construction).`;
      const r = await env.AI.run(AI_MODEL, { messages: [{ role: "user", content: prompt }], max_tokens: 120, temperature: 0 });
      const m = String(r.response ?? "").match(/\{[\s\S]*\}/);
      if (!m) continue;
      const j = JSON.parse(m[0]);
      const type = ["phd", "postdoc", "student", "internship", "industry", "other"].includes(j.type) ? j.type : "other";
      const relevance = Math.max(0, Math.min(10, Number(j.relevance) || 0));
      await env.KV.put("ai:" + it.id, JSON.stringify({ type, relevance, summary: String(j.summary || "").slice(0, 200) }), { expirationTtl: 60 * 60 * 24 * 90 });
      done++;
    } catch { /* skip item, retry next run */ }
  }
  return done;
}

async function aiMap(env) {
  const out = {}; let cursor;
  do {
    const l = await env.KV.list({ prefix: "ai:", cursor, limit: 1000 });
    await Promise.all(l.keys.map(async (k) => { const v = await env.KV.get(k.name); if (v) out[k.name.slice(3)] = JSON.parse(v); }));
    cursor = l.list_complete ? undefined : l.cursor;
  } while (cursor);
  return out;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/collected") {
      const body = (await env.KV.get(KEY)) || JSON.stringify({ fetched_at: null, pages: [] });
      return new Response(body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=900", "access-control-allow-origin": "*" } });
    }
    if (u.pathname === "/api/ai") {
      return new Response(JSON.stringify(await aiMap(env)), { headers: { "content-type": "application/json", "cache-control": "public, max-age=900" } });
    }
    return new Response("Not found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    // "23 */12 * * *": render career pages, then tag. "47 */4 * * *": tag new items only.
    const collectRun = event.cron.startsWith("23 ");
    ctx.waitUntil((async () => { try { if (collectRun) await collect(env); } finally { await tagItems(env); } })());
  },
};
