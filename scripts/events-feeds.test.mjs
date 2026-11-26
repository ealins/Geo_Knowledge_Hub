import test from "node:test";
import assert from "node:assert/strict";
import { parseOsmcal, parseWikicfp, parseTribe, termRegex } from "./events-feeds-lib.mjs";

const now = new Date("2026-11-15T06:00:00Z");
const topic = termRegex(["remote sensing", "GIS", "geospatial", "LiDAR"]);

test("osmcal keeps conference-type and on-topic events that are still ahead", () => {
  const body = JSON.stringify([
    { name: "State of the Map Europe 2027", url: "https://osmcal.org/event/1/", date: { start: "2027-07-01T09:00:00+00:00", end: "2027-07-03T18:00:00+00:00" }, location: { short: "Lisbon, Portugal" } },
    { name: "Mapping party Ostring", url: "https://osmcal.org/event/2/", date: { start: "2027-01-01T09:00:00+00:00", end: "2027-01-01T12:00:00+00:00" } },
    { name: "OSM Geospatial workshop", url: "https://osmcal.org/event/3/", date: { start: "2026-10-01T09:00:00+00:00", end: "2026-10-02T12:00:00+00:00" } },
  ]);
  const r = parseOsmcal(body, { topic, keep: /state of the map|conference/i, now });
  assert.deepEqual(r.map((e) => e.url), ["https://osmcal.org/event/1/"]);
  assert.equal(r[0].location, "Lisbon, Portugal");
});

test("wikicfp reads title, place and dates from RSS items", () => {
  const rss = `<rss><channel>
  <item><title>GISTAM 2027 : 13th Conference on GIS Theory</title><link>http://www.wikicfp.com/cfp/servlet/event.showcfp?eventid=201734&amp;copyownerid=45217</link>
  <description>13th Conference on GIS Theory [Rome, Italy] [Apr 20, 2027 - Apr 22, 2027]</description></item>
  <item><title>Old 2026 : Remote Sensing Past</title><link>http://x/1</link><description>Remote Sensing Past [Xi'an, China] [Jul 10, 2026 - Jul 12, 2026]</description></item>
  <item><title>Cooking 2027 : Food</title><link>http://x/2</link><description>Food [Paris] [Mar 1, 2027 - Mar 2, 2027]</description></item>
  </channel></rss>`;
  const r = parseWikicfp(rss, { topic, now });
  assert.equal(r.length, 1);
  assert.equal(r[0].starts, "2027-04-20T00:00:00.000Z");
  assert.equal(r[0].ends, "2027-04-22T00:00:00.000Z");
  assert.equal(r[0].location, "Rome, Italy");
  assert.ok(!r[0].url.includes("copyownerid"));
});

test("tribe events use UTC times and the venue", () => {
  const body = { events: [
    { title: "Webinar &#8211; SAR", url: "https://g/e/1", utc_start_date: "2026-11-18 20:00:00", utc_end_date: "2026-11-18 21:30:00", venue: [] },
    { title: "WHISPERS", url: "https://g/e/2", utc_start_date: "2026-11-17 04:00:00", utc_end_date: "2026-11-20 03:59:59", venue: { venue: "Glasgow, Scotland", country: "UK" } },
    { title: "Past", url: "https://g/e/3", utc_start_date: "2026-01-01 00:00:00", utc_end_date: "2026-01-02 00:00:00", venue: [] },
  ] };
  const r = parseTribe(body, { host: "g", now });
  assert.equal(r.length, 2);
  assert.equal(r[0].title, "Webinar – SAR");
  assert.equal(r[1].location, "Glasgow, Scotland, UK");
});
