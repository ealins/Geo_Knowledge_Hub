// Cloudflare Worker entry for geoacademic.app.
// - Static site is served by the assets binding (no code runs for those requests).
// - /api/collected serves the last browser-rendered career-page snapshot from KV.
// - A cron trigger (every 12 h) renders the pages in config/collector.json with Browser Rendering.
import puppeteer from "@cloudflare/puppeteer";
import cfg from "../config/collector.json";

const KEY = "collected";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const diag = {}; // last cron run: what happened and why (read at /api/diag)
const AI_MAX_PER_RUN = 120; // ~5 neurons per item, so far below the 10,000 neurons/day included allowance

// Workers AI may return `response` as an already-parsed object (when the reply is valid JSON) or as text,
// and small models sometimes add trailing commas or line breaks inside strings. Returns an object or null.
function aiJson(r) {
  const v = r?.response;
  if (v == null) return null;
  if (typeof v === "object") return v;
  const m = String(v).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { /* try a light repair */ }
  try { return JSON.parse(m[0].replace(/[\u0000-\u001f]+/g, " ").replace(/,\s*([}\]])/g, "$1")); } catch { return null; }
}

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
  const dg = (diag.tag = { todo: todo.length, ok: 0, nojson: 0, err: 0, firstErr: "", sample: "" });
  for (const it of todo) {
    try {
      const prompt = `Classify this item for a geodata (photogrammetry, remote sensing, GIS, LiDAR, SAR, geodesy, GeoAI, BIM/CityGML) opportunity board.
Title: ${it.title}
Details: ${(it.summary || "").slice(0, 500)}
Place: ${it.location || "unknown"}
Reply with ONLY compact JSON: {"type":"phd|postdoc|student|internship|industry|other","relevance":0-10,"summary":"max 25 words, plain"}.
relevance = how central geodata is to the work (10 core research, 0 unrelated such as sales or construction).`;
      const r = await env.AI.run(AI_MODEL, { messages: [{ role: "user", content: prompt }], max_tokens: 120, temperature: 0 });
      const j = aiJson(r);
      if (!j) { dg.nojson++; dg.sample ||= JSON.stringify(r?.response ?? r).slice(0, 160); continue; }
      const type = ["phd", "postdoc", "student", "internship", "industry", "other"].includes(j.type) ? j.type : "other";
      const relevance = Math.max(0, Math.min(10, Number(j.relevance) || 0));
      await env.KV.put("ai:" + it.id, JSON.stringify({ type, relevance, summary: String(j.summary || "").slice(0, 200) }), { expirationTtl: 60 * 60 * 24 * 90 });
      done++; dg.ok++;
    } catch (e) { dg.err++; dg.firstErr ||= String(e?.message || e).slice(0, 200); /* skip item, retry next run */ }
  }
  return done;
}

// Programme facts: the Worker reads each programme page once and asks Workers AI for the few facts
// that decide whether to apply. Anything the page does not state stays empty.
const PROG_MAX_PER_RUN = 20;
const PROG_NONE_TTL = 60 * 60 * 24 * 3; // page blocked by robots.txt or states no facts: do not look again for 3 days
const PROG_RETRY_TTL = 60 * 60 * 6; // transient failure (non-OK status, unparsable AI reply): look again in 6 hours
const UA = "GeoRadar/1.0 (+https://geoacademic.app)";
const robotsCache = new Map();
async function robotsOk(u) {
  const url = new URL(u);
  if (!robotsCache.has(url.origin)) {
    let rules = [];
    try {
      const r = await fetch(url.origin + "/robots.txt", { headers: { "user-agent": UA }, signal: AbortSignal.timeout(5000) });
      if (r.ok) { let all = false; for (const line of (await r.text()).split(/\r?\n/)) { const m = line.match(/^\s*(user-agent|disallow)\s*:\s*(.*?)\s*$/i); if (!m) continue; if (/user-agent/i.test(m[1])) all = m[2] === "*"; else if (all && m[2]) rules.push(m[2]); } }
    } catch { /* no robots file reachable: allowed */ }
    robotsCache.set(url.origin, rules);
  }
  return !robotsCache.get(url.origin).some((p) => (url.pathname + url.search).startsWith(p));
}
const KEYWORDS = /tuition|fee|gebühr|semester|ects|credit|language|sprache|duration|dauer|years?|jahre|deadline|apply|bewerb|master|bachelor|m\.?sc|b\.?sc/i;
function pageFacts(html) {
  const text = html.replace(/<(script|style|nav|footer)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const focus = text.split(/(?<=[.!?])\s+/).filter((s) => KEYWORDS.test(s) && s.length < 400).join(" ");
  return (text.slice(0, 1200) + " " + focus).slice(0, 4200);
}
const clip = (v, n = 40) => (typeof v === "string" && v.trim() && !/^(null|n\/a|not stated|unknown|none)$/i.test(v.trim()) ? v.trim().slice(0, n) : "");
async function enrichProgrammes(env) {
  const feed = await (await fetch("https://geoacademic.app/data/feed.json", { cf: { cacheTtl: 300 } })).json();
  const todo = [];
  for (const it of feed.items) {
    if (it.kind !== "course") continue;
    if (await env.KV.get("prog:" + it.id)) continue;
    todo.push(it);
    if (todo.length >= PROG_MAX_PER_RUN) break;
  }
  let done = 0;
  const pg = (diag.prog = { todo: todo.length, ok: 0, robots: 0, notok: 0, nojson: 0, empty: 0, err: 0, firstErr: "", firstStatus: 0 });
  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(todo.slice(i, i + 4).map(async (it) => {
      const none = (ttl = PROG_NONE_TTL) => env.KV.put("prog:" + it.id, JSON.stringify({ none: 1 }), { expirationTtl: ttl });
      try {
        if (!(await robotsOk(it.url))) { pg.robots++; return none(); }
        const r = await fetch(it.url, { headers: { "user-agent": UA, accept: "text/html" }, signal: AbortSignal.timeout(8000) });
        if (!r.ok || !/html/i.test(r.headers.get("content-type") || "")) { pg.notok++; pg.firstStatus ||= r.status; return none(PROG_RETRY_TTL); }
        const facts = pageFacts((await r.text()).slice(0, 600000));
        const prompt = `Read this university programme page text and extract facts. Use ONLY what the text states; if a fact is not stated, use null. Do not guess.
Text: ${facts}
Reply with ONLY compact JSON: {"degree":"MSc|BSc|PhD|Certificate|Other","language":"teaching language e.g. English, German, English and German","duration":"e.g. 2 years","ects":number of ECTS credits or null,"tuition":"short, e.g. No tuition fees, EUR 1,500 per semester"}`;
        const a = await env.AI.run(AI_MODEL, { messages: [{ role: "user", content: prompt }], max_tokens: 140, temperature: 0 });
        const j = aiJson(a);
        if (!j) { pg.nojson++; return none(PROG_RETRY_TTL); }
        const ects = Number(j.ects);
        const out = {
          degree: ["MSc", "BSc", "PhD", "Certificate"].includes(j.degree) ? j.degree : "",
          language: clip(j.language, 30), duration: clip(j.duration, 20), tuition: clip(j.tuition, 40),
          ects: ects >= 10 && ects <= 400 ? Math.round(ects) : 0,
        };
        if (!out.degree && !out.language && !out.duration && !out.tuition && !out.ects) { pg.empty++; return none(); }
        await env.KV.put("prog:" + it.id, JSON.stringify(out), { expirationTtl: 60 * 60 * 24 * 45 });
        done++; pg.ok++;
      } catch (e) { pg.err++; pg.firstErr ||= String(e?.message || e).slice(0, 200); /* retry next run */ }
    }));
  }
  return done;
}

async function aiMap(env, prefix = "ai:") {
  const out = {}; let cursor;
  do {
    const l = await env.KV.list({ prefix, cursor, limit: 1000 });
    await Promise.all(l.keys.map(async (k) => { const v = await env.KV.get(k.name); if (v) out[k.name.slice(prefix.length)] = JSON.parse(v); }));
    cursor = l.list_complete ? undefined : l.cursor;
  } while (cursor);
  return out;
}

// Start a GitHub Actions workflow on time. Needs the Worker secret GH_TOKEN
// (fine-grained token, this repository only, permission "Actions: read and write").
const REPO = "ealins/Geo_Knowledge_Hub"; // the repository was renamed; a POST to the old name is not redirected
async function dispatch(env, workflow) {
  if (!env.GH_TOKEN) { console.log("GH_TOKEN not set; skipping", workflow); (diag.dispatch ||= {})[workflow] = "no GH_TOKEN"; return false; }
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.GH_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "geo-radar-worker", "content-type": "application/json" },
    body: JSON.stringify({ ref: "main" }),
  });
  console.log("dispatch", workflow, r.status);
  (diag.dispatch ||= {})[workflow] = r.status;
  return r.status === 204;
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
    if (u.pathname === "/api/pulse" && req.method === "POST") {
      // "Put your lab on the map": stores a pending claim (name, city, optional link) under a short code. No payment data ever touches this site.
      const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
      let b; try { if (+req.headers.get("content-length") > 2000) return J({ error: "too large" }, 413); b = await req.json(); } catch { return J({ error: "bad request" }, 400); }
      if (b.hp) return J({ code: "GR-XXXXX" }); // honeypot: pretend success to bots
      const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
      const name = clean(b.name, 60), city = clean(b.city, 60); let url = clean(b.url, 200);
      if (!name || !city) return J({ error: "name and city are required" }, 400);
      if (url && !/^https:\/\//i.test(url)) url = "";
      const ip = req.headers.get("cf-connecting-ip") || "x", rk = `rl:${ip}:${new Date().toISOString().slice(0, 13)}`;
      const n = +((await env.KV.get(rk)) || 0); if (n >= 3) return J({ error: "slow down" }, 429);
      await env.KV.put(rk, String(n + 1), { expirationTtl: 3700 });
      const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", r = crypto.getRandomValues(new Uint8Array(5)), code = "GR-" + [...r].map((x) => A[x % A.length]).join("");
      await env.KV.put(`sponsor:${code}`, JSON.stringify({ name, city, url, at: new Date().toISOString() }), { expirationTtl: 60 * 86400 });
      return J({ code });
    }
    if (u.pathname === "/api/diag") {
      return new Response((await env.KV.get("diag:last")) || "{}", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    if (u.pathname === "/api/prog") {
      return new Response(JSON.stringify(await aiMap(env, "prog:")), { headers: { "content-type": "application/json", "cache-control": "public, max-age=900" } });
    }
    return new Response("Not found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    // One hourly cron (minute 5) drives everything, because GitHub's own scheduler skips or delays most runs.
    const d = new Date(event.scheduledTime), h = d.getUTCHours(), dow = d.getUTCDay();
    ctx.waitUntil((async () => {
      if (h % 12 === 0) await collect(env).catch((e) => console.log("collect failed", e?.message)); // career pages twice a day, before the radar reads them
      await dispatch(env, "radar.yml");
      if (h === 4) await dispatch(env, "discover-events.yml");
      if (h === 5) await dispatch(env, "adzuna.yml");
      if (h === 3 && dow === 1) await dispatch(env, "discover.yml");
      await tagItems(env).catch((e) => { diag.tagFatal = String(e?.message || e).slice(0, 200); console.log("tagging failed", e?.message); }); // new items only, capped per run
      await enrichProgrammes(env).catch((e) => { diag.progFatal = String(e?.message || e).slice(0, 200); console.log("programme facts failed", e?.message); }); // new programmes only, capped per run
      diag.at = new Date().toISOString();
      await env.KV.put("diag:last", JSON.stringify(diag)).catch(() => {});
    })());
  },
};
