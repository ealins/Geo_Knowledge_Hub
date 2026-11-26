// Parsers for scripts/events-feeds.mjs. Each returns
// [{ title, url, starts, ends, deadline, host, location }] for events still ahead.

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const termRegex = (terms) => new RegExp(`(?<!\\p{L})(?:${terms.map(esc).join("|")})(?!\\p{L})`, "iu");

const decode = (s = "") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, "&");
const strip = (s = "") => decode(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ahead = (ends, now) => Date.parse(ends) + 864e5 >= now.getTime();

// OpenStreetMap Calendar: a flat JSON list. Most entries are local mapping
// meetups, so only titles that look like a conference-type event or name a
// topic of the field are kept.
export function parseOsmcal(body, { topic, keep, now }) {
  const out = [];
  for (const e of JSON.parse(body)) {
    const title = (e.name || "").trim();
    if (!title || !e.url || !e.date?.start) continue;
    if (!topic.test(title) && !keep.test(title)) continue;
    const starts = new Date(e.date.start).toISOString();
    const ends = new Date(e.date.end || e.date.start).toISOString();
    if (!ahead(ends, now)) continue;
    out.push({ title, url: e.url, starts, ends, deadline: "", host: "osmcal.org", location: e.location?.short || "" });
  }
  return out;
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const day = (s) => {
  const m = /([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(s || "");
  return m && MONTHS[m[1].toLowerCase()] != null ? new Date(Date.UTC(+m[3], MONTHS[m[1].toLowerCase()], +m[2])).toISOString() : null;
};

// WikiCFP RSS: <item><title>ACR 2027 : Full name</title><link>..</link>
// <description>Full name [City, Country] [Mon d, yyyy - Mon d, yyyy]</description></item>
export function parseWikicfp(body, { topic, now, exclude = [] }) {
  const out = [];
  for (const m of body.matchAll(/<item\b[\s\S]*?<\/item>/gi)) {
    const block = m[0];
    const title = strip(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(block)?.[1]);
    const link = strip(/<link[^>]*>([\s\S]*?)<\/link>/i.exec(block)?.[1]);
    const desc = strip(/<description[^>]*>([\s\S]*?)<\/description>/i.exec(block)?.[1]);
    const brackets = [...desc.matchAll(/\[([^\]]*)\]/g)].map((b) => b[1]);
    const when = brackets.at(-1) || "";
    const [a, b] = when.split(/\s+-\s+/);
    const starts = day(a);
    const ends = day(b) || starts;
    if (!title || !link || !starts || !ahead(ends, now)) continue;
    const full = desc.replace(/\s*\[[^\]]*\]/g, "").trim() || title;
    if (!topic.test(`${title} ${full}`) || exclude.some((re) => re.test(`${title} ${full}`))) continue;
    out.push({ title: full.slice(0, 160), url: link.replace(/&copyownerid=\d+/, ""), starts, ends, deadline: "", host: "wikicfp.com", location: brackets.length > 1 ? brackets[0] : "" });
  }
  return out;
}

// The Events Calendar (WordPress) REST API, e.g. grss-ieee.org.
export function parseTribe(body, { host, now }) {
  const out = [];
  for (const e of body.events ?? []) {
    const title = strip(e.title);
    const starts = e.utc_start_date ? new Date(e.utc_start_date.replace(" ", "T") + "Z").toISOString() : null;
    const ends = e.utc_end_date ? new Date(e.utc_end_date.replace(" ", "T") + "Z").toISOString() : starts;
    if (!title || !e.url || !starts || !ahead(ends, now)) continue;
    const v = Array.isArray(e.venue) ? null : e.venue;
    const location = v?.venue ? [v.venue, v.country].filter(Boolean).join(", ") : "";
    out.push({ title, url: e.url, starts, ends, deadline: "", host, location });
  }
  return out;
}
