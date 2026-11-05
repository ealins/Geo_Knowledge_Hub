// Puts real coordinates on feed items so the globe pins institutions and cities
// instead of country centres. Free APIs, no keys:
//   ROR (api.ror.org)               institution name -> city and coordinates
//   Open-Meteo geocoding            city name -> coordinates
// Results are cached in data/places.json (misses are retried after 7 days).
// Adds item.geo = [lat, lon, city, countryCode]. Never fails the run.
import { readFile, writeFile } from "node:fs/promises";
import { orgOf, cityOf, keyOf } from "./places-lib.mjs";

const FEED = "data/feed.json", CACHE = "data/places.json";
const MAX_LOOKUPS = 200, RETRY_MS = 7 * 864e5;
const feed = JSON.parse(await readFile(FEED, "utf8"));
const cache = JSON.parse(await readFile(CACHE, "utf8").catch(() => "{}"));
const now = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = { "user-agent": "GeoRadar/1.0 (+https://geoacademic.app)", accept: "application/json" };
const getJson = async (u) => { const r = await fetch(u, { headers, signal: AbortSignal.timeout(12000) }); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); };

async function ror({ name, cc }) {
  const j = await getJson(`https://api.ror.org/v2/organizations?affiliation=${encodeURIComponent(name)}`);
  const hit = (j.items || []).find((x) => x.chosen);
  const g = hit?.organization?.locations?.[0]?.geonames_details;
  if (!g || g.lat == null) return null;
  if (cc && g.country_code && g.country_code.toUpperCase() !== cc) return null;
  return { lat: g.lat, lon: g.lng, city: g.name, cc: g.country_code, src: "ror" };
}
async function city({ name, cc }) {
  const j = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json${cc ? "&countryCode=" + cc : ""}`);
  const r = (j.results || [])[0];
  return r ? { lat: r.latitude, lon: r.longitude, city: r.name, cc: r.country_code, src: "city" } : null;
}

// Collect what needs looking up.
const jobs = new Map();
const want = (type, q) => { if (!q) return null; const k = keyOf(type, q.name, q.cc); if (!jobs.has(k)) jobs.set(k, { type, q }); return k; };
const keys = new Map();
for (const it of feed.items) {
  if (!["job", "course", "event"].includes(it.kind)) continue;
  keys.set(it.id, [want("ror", orgOf(it)), want("city", cityOf(it))].filter(Boolean));
}
const todo = [...jobs.entries()].filter(([k]) => !cache[k] || (cache[k].miss && now - Date.parse(cache[k].t) > RETRY_MS)).slice(0, MAX_LOOKUPS);
let ok = 0, fail = 0;
for (let i = 0; i < todo.length; i += 4) {
  await Promise.all(todo.slice(i, i + 4).map(async ([k, { type, q }]) => {
    try { const r = await (type === "ror" ? ror(q) : city(q)); cache[k] = r ? { ...r, t: new Date().toISOString() } : { miss: true, t: new Date().toISOString() }; ok++; }
    catch (e) { fail++; if (fail <= 3) console.log("lookup failed:", k, e.message); }
  }));
  await sleep(150);
}
console.log(`geocode: ${todo.length} lookups, ${ok} answered, ${fail} failed, cache ${Object.keys(cache).length}`);

// Write coordinates onto items (institution first, then city).
let tagged = 0;
for (const it of feed.items) {
  delete it.geo;
  for (const k of keys.get(it.id) || []) { const c = cache[k]; if (c && !c.miss) { it.geo = [Math.round(c.lat * 1e4) / 1e4, Math.round(c.lon * 1e4) / 1e4, c.city, c.cc]; tagged++; break; } }
}
const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(CACHE, JSON.stringify(sorted, null, 1) + "\n");
await writeFile(FEED, JSON.stringify(feed, null, 2) + "\n");
console.log(`geocode: ${tagged} of ${feed.items.length} items placed`);
