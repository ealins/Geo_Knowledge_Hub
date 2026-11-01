// Cloudflare Worker entry for geoacademic.app.
// - Static site is served by the assets binding (no code runs for those requests).
// - /api/collected serves the last browser-rendered career-page snapshot from KV.
// - A cron trigger (every 12 h) renders the pages in config/collector.json with Browser Rendering.
import puppeteer from "@cloudflare/puppeteer";
import cfg from "../config/collector.json";

const KEY = "collected";

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

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/api/collected") {
      const body = (await env.KV.get(KEY)) || JSON.stringify({ fetched_at: null, pages: [] });
      return new Response(body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=900", "access-control-allow-origin": "*" } });
    }
    return new Response("Not found", { status: 404 });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(collect(env));
  },
};
