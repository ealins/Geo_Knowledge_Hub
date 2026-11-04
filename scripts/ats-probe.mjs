import fs from "node:fs";
const FEEDS = {
  "gim-international": "https://www.gim-international.com/rss",
  "geoweeknews": "https://www.geoweeknews.com/rss.xml",
  "directionsmag": "https://www.directionsmag.com/rss",
  "esa-observing-earth": "https://www.esa.int/rssfeed/Our_Activities/Observing_the_Earth",
  "nasa-earth-observatory": "https://earthobservatory.nasa.gov/feeds/earth-observatory.rss",
  "xyht": "https://www.xyht.com/feed/",
  "gpsworld": "https://www.gpsworld.com/feed/",
  "geospatialworld": "https://www.geospatialworld.net/feed/",
  "lidarmag": "https://lidarmag.com/feed/",
  "insidegnss": "https://insidegnss.com/feed/",
  "gislounge": "https://www.gislounge.com/feed/",
  "spatialsource": "https://www.spatialsource.com.au/feed",
  "eos": "https://eos.org/feed",
  "sentinelhub-medium": "https://medium.com/feed/sentinel-hub",
  "copernicus-news": "https://www.copernicus.eu/en/rss.xml",
  "esri-news": "https://www.esri.com/about/newsroom/feed/",
  "mapscaping": "https://mapscaping.com/feed/",
  "geoawesome": "https://geoawesome.com/feed/",
  "usgs-news": "https://www.usgs.gov/news/rss",
  "eumetsat-news": "https://www.eumetsat.int/rss.xml",
  "dlr-news": "https://www.dlr.de/en/latest/news/@@rss",
  "planet-pulse": "https://www.planet.com/pulse/rss.xml",
};
const out = {};
await Promise.all(Object.entries(FEEDS).map(async ([id, url]) => {
  try {
    const r = await fetch(url, { headers: { "user-agent": "GeoRadarBot/1.0 (+https://geoacademic.app)", accept: "application/rss+xml,application/atom+xml,*/*" }, signal: AbortSignal.timeout(20000), redirect: "follow" });
    const t = await r.text();
    const items = [...t.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)];
    const dates = items.map(m => (m[0].match(/<(pubDate|published|updated|dc:date)>([^<]+)</i) || [])[2]).filter(Boolean).map(d => Date.parse(d)).filter(Boolean).sort((a, b) => b - a);
    const titles = items.slice(0, 3).map(m => (m[0].match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim().slice(0, 70));
    out[id] = { status: r.status, finalUrl: r.url, items: items.length, newest: dates[0] ? new Date(dates[0]).toISOString().slice(0, 10) : null, last30d: dates.filter(d => Date.now() - d < 30 * 864e5).length, titles };
  } catch (e) { out[id] = { error: e.message }; }
}));
fs.mkdirSync("diagout", { recursive: true }); fs.writeFileSync("diagout/news.json", JSON.stringify(out, null, 1));
