// Builds data/researchers.json: leading researchers per field, from OpenAlex (free, no key).
// Step 1: most active authors per search query (works grouped by author).
// Step 2: author details (institution, h-index, topics) for the best candidates.
// Public scholarly facts only. If OpenAlex is unreachable the previous file is kept.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fetchText } from "./net.mjs";

const cfg = JSON.parse(await readFile("config/researchers.json", "utf8"));
const OUT = "data/researchers.json";
const API = "https://api.openalex.org";
const json = async (u) => JSON.parse(await fetchText(u));
// An author must work on geodata: at least one of their main research topics has to match.
const GEO = /remote sensing|photogramm|lidar|laser scan|point cloud|synthetic aperture|\bSAR\b|radar|geodes|GNSS|\bGPS\b|geospatial|geograph|\bGIS\b|spatial|surveying|earth observation|satellite|hyperspectral|multispectral|land (use|cover)|landslide|terrain|\bcity\b|urban|building information|\bBIM\b|cartograph|geoinformat|image (classification|fusion|segmentation)|change detection|altimetry|sea level|gravity|tectonic|geophys|navigation|positioning|3D model|digital twin/i;
const isGeo = (a) => (a.topics || []).slice(0, 8).some((t) => GEO.test(t.display_name || ""));
// OpenAlex sometimes appends a disambiguating initial ("Fabio Remondino A").
const cleanName = (n) => n.replace(/^(.+\S{3,}) [A-Z]$/, "$1");
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
    const u = `${API}/authors?filter=openalex:${chunk.join("|")}&per_page=50&select=id,display_name,orcid,works_count,cited_by_count,summary_stats,last_known_institutions,topics`;
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
    ranked.push({ id, a, n, h, score: n * (1 + h / 40) });
  }
  ranked.sort((x, y) => y.score - x.score);
  ranked.slice(0, cfg.per_field).forEach((r, i) => {
    const p = people.get(r.id) || {
      id: r.id, name: cleanName(r.a.display_name), orcid: r.a.orcid || "",
      institution: r.a.last_known_institutions?.[0]?.display_name || "",
      country: r.a.last_known_institutions?.[0]?.country_code || "",
      h_index: r.h, cited_by: r.a.cited_by_count || 0, works: r.a.works_count || 0,
      expertise: (r.a.topics || []).slice(0, 5).map((t) => t.display_name),
      fields: [], rank: {},
    };
    p.fields.push(f.id); p.rank[f.id] = i + 1; p.recent = { ...(p.recent || {}), [f.id]: r.n };
    people.set(r.id, p);
  });
}

const researchers = [...people.values()].sort((a, b) => b.h_index - a.h_index);
if (researchers.length < 20) { console.log(`Only ${researchers.length} researchers (failed queries: ${failed}); keeping previous file.`); process.exit(0); }
await mkdir("data", { recursive: true });
await writeFile(OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  since: cfg.since,
  fields: cfg.fields.map(({ id, name, blurb }) => ({ id, name, blurb })),
  researchers,
}, null, 1) + "\n");
console.log(`researchers: ${researchers.length} people across ${cfg.fields.length} fields (failed queries: ${failed})`);
