import { writeFile, mkdir } from "node:fs/promises";
await mkdir("diagout", { recursive: true });
const UA = "Mozilla/5.0 (compatible; GeoRadarProbe/1.0)";
const out = [];
const get = async (u, opt = {}) => { try { const r = await fetch(u, { headers: { "user-agent": UA, accept: "*/*" }, redirect: "follow", signal: AbortSignal.timeout(15000), ...opt }); return { s: r.status, t: await r.text(), ct: r.headers.get("content-type") || "" }; } catch (e) { return { s: 0, t: "", e: e.message }; } };
const feeds = `https://www.gislounge.com/feed/
https://www.geoweeknews.com/rss
https://www.geoweeknews.com/feed
https://www.geoweeknews.com/rss.xml
https://www.directionsmag.com/rss
https://www.directionsmag.com/feed
https://www.geoawesome.com/feed/
https://gogeomatics.ca/feed/
https://www.geospatialworld.net/feed/
https://www.esri.com/arcgis-blog/feed/
https://www.esri.com/about/newsroom/feed/
https://www.usgs.gov/news/rss.xml
https://www.usgs.gov/news/all/rss
https://landsat.gsfc.nasa.gov/feed/
https://science.nasa.gov/earth/feed/
https://www.planet.com/pulse/feed/
https://www.asprs.org/feed
https://www.ucgis.org/feed/
https://www.aag.org/feed/
https://www.spar3d.com/feed/
https://www.gpsworld.com/feed/
https://www.ogc.org/feed
https://medium.com/feed/radiant-earth-insights
https://www.earthdata.nasa.gov/news/feed
https://www.nesdis.noaa.gov/news/rss.xml
https://www.nature.com/subjects/remote-sensing.rss
https://www.positionmag.com.au/feed
https://www.ga.gov.au/rss/news
https://geospatialworld.net/feed
https://www.maxar.com/blog/rss.xml
https://vantor.com/feed
https://www.skywatch.com/blog/rss.xml
https://www.bluemarble.... 
https://www.sciencedaily.com/rss/earth_climate/remote_sensing.xml
https://phys.org/rss-feed/earth-news/earth-sciences/
https://www.canada.ca/en/natural-resources-canada/news/feed.rss
https://www.thegeospatialnetwork.com/feed
https://eijournal.com/feed
https://www.hexagon.com/company/newsroom/rss
https://www.pix4d.com/blog/feed
https://www.nv5.com/feed`.split("\n").filter((u) => u.startsWith("http") && !u.includes("..."));
const jobs = `https://careers.insidehighered.com/jobs/rss/?keywords=remote+sensing
https://careers.insidehighered.com/jobs/rss/?keywords=GIS
https://jobs.aag.org/jobs/rss/?keywords=GIS
https://jobs.agu.org/jobs/rss/?keywords=remote+sensing
https://careers.asprs.org/jobs/rss/?keywords=remote+sensing
https://www.earthworks-jobs.com/
https://www.gjc.org/
https://www.gisjobs.com/
https://www.gogeomatics.ca/jobs
https://www.higheredjobs.com/
https://academicjobsonline.org/ajo
https://www.academicpositions.com/find-jobs/remote-sensing
https://www.academicpositions.com/find-jobs/geoinformatics
https://www.mitacs.ca/en/programs/research-training
https://www.usajobs.gov/Search/Results?k=remote+sensing
https://jobs.nasa.gov/
https://www.nature.com/naturecareers/
https://jobs.spiedigitallibrary.org/
https://www.eurosdr.net/
https://jobs.sciencecareers.org/jobs/remote-sensing/
https://www.uavcoach.com/jobs/`.split("\n");
const ats = {
  greenhouse: "nearmap eagleview matterport ouster luminar luminartech blacksky satellogic capellaspace capella umbra descarteslabs earthdaily cesium carto felt wherobots regrow orbitalinsight skywatch muonspace pachama overstory sentera dronedeploy propeller kespry ursaspace spaceknow terraformation zendar arbe hover cyngn aeye innoviz maxar vantor nv5 geospatial".split(" "),
  lever: "luminar blacksky satellogic skywatch umbra dronedeploy kespry cesium descarteslabs orbitalinsight cyngn innoviz aeye ouster geoslam sensat cyclomedia hexagon trimble".split(" "),
  ashby: "umbra capella wherobots felt muon-space muonspace regrow satellogic pixxel albedo earthdaily terraformation sylvera kayrros overstory sust-global carbon-mapper foursquare cesium nearmap eagleview vantor".split(" "),
  workable: "sensat reconstruct geoslam terra-drone airinov nearmap scanlabs gaiasoft".split(" "),
};
const A = {
  greenhouse: (s) => [`https://boards-api.greenhouse.io/v1/boards/${s}/jobs`, (j) => j.jobs?.map((x) => x.title)],
  lever: (s) => [`https://api.lever.co/v0/postings/${s}?mode=json`, (j) => Array.isArray(j) ? j.map((x) => x.text) : null],
  ashby: (s) => [`https://api.ashbyhq.com/posting-api/job-board/${s}`, (j) => j.jobs?.map((x) => x.title)],
  workable: (s) => [`https://apply.workable.com/api/v1/widget/accounts/${s}`, (j) => j.jobs?.map((x) => x.title)],
};
await Promise.all([
  ...feeds.map(async (u) => { const r = await get(u); const n = (r.t.match(/<item[ >]|<entry[ >]/g) || []).length; const t = (r.t.match(/<item[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([^<\]]*)/) || r.t.match(/<entry[\s\S]*?<title[^>]*>(?:<!\[CDATA\[)?([^<\]]*)/) || [])[1]; const d = (r.t.match(/<(?:pubDate|updated|published)>([^<]+)/) || [])[1]; out.push(`FEED ${r.s} items=${n} ${u} | ${(t || "").trim().slice(0, 70)} | ${d || ""}${r.e ? " ERR " + r.e : ""}`); }),
  ...jobs.map(async (u) => { const r = await get(u); const n = (r.t.match(/<item[ >]/g) || []).length; out.push(`PAGE ${r.s} len=${r.t.length} rssitems=${n} ${u}`); }),
  ...Object.entries(ats).flatMap(([k, list]) => list.map(async (s) => { const [u, f] = A[k](s); const r = await get(u); let titles = null; try { titles = f(JSON.parse(r.t)); } catch {} out.push(`ATS ${k}/${s} ${r.s} ${titles ? titles.length + " jobs; " + titles.filter((t) => /photogramm|remote sensing|earth observation|geospatial|geoinformat|geomatic|\bgis\b|lidar|point cloud|\bsar\b|geodes|gnss|computer vision|perception|mapping|3d reconstruction/i.test(t)).slice(0, 4).join(" / ") : ""}`); })),
]);
out.sort();
await writeFile("diagout/probe4.txt", out.join("\n") + "\n");
console.log(out.join("\n"));
