// Builds data/researchers.json: leading researchers per field, from OpenAlex (free, no key).
// Step 1: most active authors per search query (works grouped by author).
// Step 2: author details (institution, h-index, topics) for the best candidates.
// Public scholarly facts only. If OpenAlex is unreachable the previous file is kept.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fetchText } from "./net.mjs";

const cfg = JSON.parse(await readFile("config/researchers.json", "utf8"));
const OUT = "data/researchers.json";
const API = "https://api.openalex.org";
// Retries with growing pauses: OpenAlex answers 429/5xx when it is hit too fast.
const json = async (u, headers = {}) => {
  for (let i = 0; ; i++) {
    try { return JSON.parse(await fetchText(u, { accept: "application/json", ...headers })); }
    catch (e) { if (i >= 4 || !/HTTP (429|5\d\d)/.test(e.message)) throw e; await new Promise((r) => setTimeout(r, 2500 * 2 ** i)); }
  }
};
// An author must work on geodata: at least one of their main research topics has to match.
const GEO = /remote sensing|photogramm|lidar|laser scan|point cloud|synthetic aperture|\bSAR\b|radar|geodes|GNSS|\bGPS\b|geospatial|geograph|\bGIS\b|spatial|surveying|earth observation|satellite|hyperspectral|multispectral|land (use|cover)|landslide|terrain|\bcity\b|urban|building information|\bBIM\b|cartograph|geoinformat|image (classification|fusion|segmentation)|change detection|altimetry|sea level|gravity|tectonic|geophys|navigation|positioning|3D model|digital twin/i;
const isGeo = (a) => (a.topics || []).slice(0, 8).some((t) => GEO.test(t.display_name || ""));
// OpenAlex sometimes appends a disambiguating initial ("Fabio Remondino A").
const cleanName = (n) => n.replace(/^(.+\S{3,}) [A-Z]$/, "$1");
// The most recent affiliation by year; falls back to OpenAlex's last known institution.
function currentInstitution(a) {
  const best = (a.affiliations || []).map((x) => ({ x, last: Math.max(0, ...(x.years || [])), n: (x.years || []).length }))
    .sort((p, q) => q.last - p.last || q.n - p.n)[0]?.x?.institution;
  const li = a.last_known_institutions?.[0];
  return { name: best?.display_name || li?.display_name || "", country: best?.country_code || li?.country_code || "" };
}
const idOf = (u) => String(u).replace("https://openalex.org/", "");

async function activeAuthors(query) {
  const f = `from_publication_date:${cfg.since}-01-01,type:article`;
  const u = `${API}/works?search=${encodeURIComponent(query)}&filter=${f}&group_by=authorships.author.id&per_page=100`;
  const j = await json(u);
  return (j.group_by || []).filter((g) => g.key && g.key !== "unknown").map((g) => ({ id: idOf(g.key), n: g.count }));
}

async function details(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const u = `${API}/authors?filter=openalex:${chunk.join("|")}&per_page=50&select=id,display_name,orcid,works_count,cited_by_count,summary_stats,last_known_institutions,affiliations,topics`;
    const j = await json(u);
    for (const a of j.results || []) out.set(idOf(a.id), a);
    await new Promise((r) => setTimeout(r, 250));
  }
  return out;
}

const byField = {};
let failed = 0;
for (const f of cfg.fields) {
  const score = new Map();
  for (const q of f.queries) {
    try { for (const a of await activeAuthors(q)) score.set(a.id, (score.get(a.id) || 0) + a.n); }
    catch (e) { failed++; console.log(`query "${q}" failed: ${e.message}`); }
    await new Promise((r) => setTimeout(r, 250));
  }
  byField[f.id] = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 70);
  console.log(`${f.id}: ${byField[f.id].length} candidate authors`);
}
const allIds = [...new Set(Object.values(byField).flat().map(([id]) => id))];
if (!allIds.length) { console.log("No candidates; keeping previous file."); process.exit(0); }
const info = await details(allIds);

const people = new Map();
for (const f of cfg.fields) {
  const ranked = [];
  for (const [id, n] of byField[f.id]) {
    const a = info.get(id); if (!a) continue;
    const h = a.summary_stats?.h_index ?? 0;
    if (h < cfg.min_h_index || (a.works_count || 0) > cfg.max_works || !isGeo(a)) continue;
    if (f.topic_filter && !(a.topics || []).slice(0, 3).some((t) => new RegExp(f.topic_filter, "i").test(t.display_name || ""))) continue;
    ranked.push({ id, a, n, h, score: n * (1 + h / 40) });
  }
  ranked.sort((x, y) => y.score - x.score);
  ranked.slice(0, cfg.per_field).forEach((r, i) => {
    const p = people.get(r.id) || {
      id: r.id, name: cleanName(r.a.display_name), orcid: r.a.orcid || "",
      institution: currentInstitution(r.a).name,
      country: currentInstitution(r.a).country,
      h_index: r.h, cited_by: r.a.cited_by_count || 0, works: r.a.works_count || 0,
      expertise: (r.a.topics || []).slice(0, 5).map((t) => t.display_name),
      fields: [], rank: {},
    };
    p.fields.push(f.id); p.rank[f.id] = i + 1; p.recent = { ...(p.recent || {}), [f.id]: r.n };
    people.set(r.id, p);
  });
}

const researchers = [...people.values()].sort((a, b) => b.h_index - a.h_index);
const thin = cfg.fields.filter((f) => researchers.filter((r) => r.fields.includes(f.id)).length < (f.min_people ?? 10)).map((f) => f.id);
if (thin.length) { console.log(`Fields with fewer than 10 people (${thin.join(", ")}); looks like a degraded run, keeping previous file.`); process.exit(0); }
if (researchers.length < 20) { console.log(`Only ${researchers.length} researchers (failed queries: ${failed}); keeping previous file.`); process.exit(0); }

// Job titles are not in OpenAlex. ORCID's public API lists self-reported employments (title, department).
const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);
async function orcidPosition(p) {
  const id = String(p.orcid || "").replace(/^https?:\/\/orcid\.org\//, "");
  if (!id) return null;
  const j = await json(`https://pub.orcid.org/v3.0/${id}/employments`);
  const items = (j.group || []).flatMap((g) => g["employment-summary"] || [])
    .filter((e) => !e["end-date"] && e["role-title"])
    .map((e) => ({
      title: String(e["role-title"]).trim(), dept: String(e["department-name"] || "").trim(),
      org: e.organization?.name || "", start: Number(e["start-date"]?.year?.value || 0),
    }));
  if (!items.length) return null;
  const want = new Set(norm(p.institution));
  const overlap = (e) => norm(e.org).filter((w) => want.has(w)).length;
  items.sort((a, b) => overlap(b) - overlap(a) || b.start - a.start);
  const e = items[0];
  if (want.size && overlap(e) === 0) return null; // title belongs to a different employer
  return { position: e.title.slice(0, 80), department: e.dept.slice(0, 100) };
}

// Co-author network: for each researcher, the people they publish with most since cfg.since (OpenAlex, one call each).
let withCollab = 0;
for (const p of researchers) {
  try {
    const f = `author.id:${p.id},from_publication_date:${cfg.since}-01-01`;
    const j = await json(`${API}/works?filter=${f}&group_by=authorships.author.id&per_page=40`);
    p.collab = (j.group_by || []).filter((g) => g.key && g.key !== "unknown" && idOf(g.key) !== p.id)
      .slice(0, 14).map((g) => ({ id: idOf(g.key), name: cleanName(g.key_display_name || ""), n: g.count }));
    if (p.collab.length) withCollab++;
  } catch { /* leave without network */ }
  await new Promise((r) => setTimeout(r, 120));
}
console.log(`co-author networks for ${withCollab} of ${researchers.length}`);
let withPos = 0, orcidFail = 0;
for (const p of researchers) {
  try {
    const pos = await orcidPosition(p);
    if (pos) { Object.assign(p, pos); withPos++; }
  } catch (e) { orcidFail++; if (orcidFail <= 3) console.log("orcid:", e.message); }
  await new Promise((r) => setTimeout(r, 120));
}
console.log(`positions found for ${withPos} of ${researchers.length} (orcid errors: ${orcidFail})`);
await mkdir("data", { recursive: true });
await writeFile(OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  since: cfg.since,
  fields: cfg.fields.map(({ id, name, blurb }) => ({ id, name, blurb })),
  researchers,
}, null, 1) + "\n");
console.log(`researchers: ${researchers.length} people across ${cfg.fields.length} fields (failed queries: ${failed})`);
