const DOMAINS = [
  { id: "photo", name: "Photogrammetry and 3D reconstruction", color: "#ff9f6b", blurb: "Image-based measurement, UAV mapping, orientation and dense reconstruction.",
    re: /photogramm|3d reconstruction|structure.from.motion|\bsfm\b|dense matching|\buav\b|drone|bundle adjust|oblique|nerf|gaussian splat/,
    subs: [["UAV and drones", /uav|drone|unmanned/], ["3D reconstruction", /reconstruction|structure.from|dense matching|nerf|gaussian splat/], ["Orientation and calibration", /orientation|calibrat|bundle/], ["Close-range and metrology", /close.range|metrology|industrial/]] },
  { id: "lidar", name: "LiDAR and point clouds", color: "#4fd1c5", blurb: "Laser scanning from air, ground and vehicles, and everything done with point clouds.",
    re: /lidar|point cloud|laser scan|\bals\b|\btls\b|punktwolke|slam/,
    subs: [["Airborne", /airborne|\bals\b|bathymetr/], ["Terrestrial and mobile", /terrestrial|mobile mapping|\btls\b|slam/], ["Point cloud processing", /classification|segmentation|registration|processing|filtering/]] },
  { id: "rs", name: "Remote sensing and Earth observation", color: "#6ea8ff", blurb: "Satellite and airborne imagery: optical, multispectral, hyperspectral, Copernicus.",
    re: /remote sensing|earth observation|satellite|sentinel|landsat|hyperspectral|multispectral|copernicus|fernerkundung|\beo\b|imagery|modis|earth system/,
    subs: [["Optical and multispectral", /optical|multispectral|landsat|sentinel-2|planet/], ["Hyperspectral", /hyperspectral|enmap/], ["Copernicus and Sentinel", /copernicus|sentinel/], ["Land cover and vegetation", /land cover|vegetation|forest|crop|agricultur|land use/], ["Climate and environment", /climate|\\bice\\b|glacier|ocean|coast|environment|disaster|flood|landslide/]] },
  { id: "sar", name: "SAR and InSAR", color: "#c58bff", blurb: "Radar imaging and interferometry for deformation, hazards and surface change.",
    re: /\bsar\b|insar|dinsar|radar|interferom|sentinel-1|subsidence/,
    subs: [["InSAR and deformation", /insar|interferom|deformation|subsidence/], ["SAR processing", /polarimetr|processing|speckle|\bsar\b/], ["Hazards", /landslide|earthquake|volcan|flood/]] },
  { id: "geodesy", name: "Geodesy and GNSS", color: "#f2c14e", blurb: "Positioning, reference frames, gravity, surveying and geodetic measurement.",
    re: /geodes|geodät|geodetic|gnss|\bgps\b|gravimet|positioning|reference frame|surveying|vermessung|height system|geoid/,
    subs: [["GNSS and positioning", /gnss|gps|positioning|navigation/], ["Gravity and geoid", /gravi|geoid|height/], ["Surveying", /surveying|vermessung|cadastr/], ["Reference frames", /reference frame|itrf|datum/]] },
  { id: "gis", name: "GIS and geoinformatics", color: "#7bd88f", blurb: "Spatial data, analysis, cartography, web mapping and spatial data infrastructure.",
    re: /\bgis\b|geoinformat|geospatial|geomatic|spatial data|cartograph|geovisual|mapping|\bmaps?\b|webgis|qgis|openstreetmap|spatial analysis|sdi\b|geodata/,
    subs: [["Cartography and visualisation", /cartograph|visuali|map design|\bmaps?\b/], ["Spatial data and SDI", /spatial data|sdi\b|open data|openstreetmap|geodata|inspire/], ["Spatial analysis", /spatial analysis|statistic|model+ing|analysis/], ["Web and open source", /web|open.?source|qgis|postgis|python/]] },
  { id: "geoai", name: "GeoAI and machine learning", color: "#ff7eb6", blurb: "Deep learning, foundation models and AI applied to geodata and imagery.",
    re: /geoai|geo-ai|machine learning|deep learning|neural|foundation model|\bai\b|artificial intelligence|\bllm\b|transformer/,
    subs: [["Deep learning", /deep learning|neural|cnn|transformer/], ["Foundation models", /foundation|llm|vision.language|gpt/], ["Segmentation and detection", /segmentation|detection|classification/]] },
  { id: "city", name: "3D city models and BIM", color: "#9aa7ff", blurb: "CityGML, IFC, BIM, digital twins and urban information models.",
    re: /citygml|\bifc\b|\bbim\b|digital twin|3d city|city model|smart city|building information|\blod ?\d|cityjson/,
    subs: [["CityGML and 3D city models", /citygml|cityjson|3d city|city model|\blod/], ["BIM and IFC", /\bbim\b|\bifc\b|building information/], ["Digital twins and urban", /digital twin|smart city|urban/]] },
  { id: "infra", name: "Infrastructure and surveying", color: "#e0925a", blurb: "Structural and deformation monitoring, surveying, cadastre and land administration.",
    re: /infrastructure|structural health|deformation monitoring|surveying|cadastr|land administration|land registry|bridge|railway|road network|hydrograph|topograph/,
    subs: [["Monitoring", /monitoring|deformation|structural/], ["Surveying and cadastre", /surveying|cadastr|land admin/], ["Roads, rail, bridges", /road|rail|bridge/]] },
  { id: "urban", name: "Urban planning and smart cities", color: "#6fc3d8", blurb: "Spatial planning, urban analytics, land use and smart-city data.",
    re: /urban plan|spatial plan|urban analytic|land use|smart cit|urban heat|urban growth|urban morpholog|mobility/,
    subs: [["Planning", /plan/], ["Urban analytics", /analytic|growth|morpholog|heat/], ["Mobility", /mobility|transport/]] },
  { id: "env", name: "Environment and climate", color: "#5fb98a", blurb: "Climate and environmental monitoring, ecosystems, water and coasts from space and air.",
    re: /climate|environmental monitor|ecosystem|biodiversity|carbon|water (quality|resources)|coastal|glacier|ice sheet|sea level|forest inventory|deforestation|wetland/,
    subs: [["Climate", /climate|carbon|sea level|ice|glacier/], ["Ecosystems and forests", /ecosystem|biodiversity|forest|wetland|deforest/], ["Water and coasts", /water|coastal|wetland|sea level/]] },
  { id: "agri", name: "Agriculture and forestry", color: "#b7c94a", blurb: "Crop and soil monitoring, precision agriculture and forest mapping.",
    re: /agricultur|crop|precision farming|soil moisture|irrigation|yield|vegetation index|forestry|forest monitor|orchard/,
    subs: [["Crops and yield", /crop|yield|irrigation|orchard/], ["Soil and vegetation", /soil|vegetation index|ndvi/], ["Forestry", /forest/]] },
  { id: "disaster", name: "Disaster response", color: "#f0716b", blurb: "Floods, landslides, earthquakes, fires and emergency mapping.",
    re: /disaster|flood|landslide|earthquake|wildfire|volcan|emergency mapping|humanitarian|hazard|tsunami|drought/,
    subs: [["Floods and drought", /flood|drought/], ["Landslides and earthquakes", /landslide|earthquake|volcan|tsunami/], ["Emergency and humanitarian", /emergency|humanitarian|response/], ["Fires", /wildfire|fire/]] },
  { id: "archaeo", name: "Archaeology and heritage", color: "#c9a27a", blurb: "Remote sensing, LiDAR and 3D documentation of archaeological and cultural heritage sites.",
    re: /archaeolog|cultural heritage|heritage|historic building|excavation/,
    subs: [["Archaeological prospection", /archaeolog|prospection|excavation/], ["Heritage documentation", /heritage|documentation|historic/]] },
  { id: "general", name: "General geospatial and societies", color: "#9aa8b5", blurb: "Conferences, societies and openings that span several fields.", re: /$^/, subs: [] },
];
const DOM = Object.fromEntries(DOMAINS.map(d => [d.id, d]));
function classify(it) {
  if (it._d) return;
  const txt = (it.title + " " + (it.matched || []).join(" ") + " " + (it.summary || "")).toLowerCase();
  it._d = new Set(); it._s = new Set();
  for (const d of DOMAINS) if (d.re.test(txt)) { it._d.add(d.id); for (const [l, r] of d.subs) if (r.test(txt)) it._s.add(d.id + ":" + l); }
  if (!it._d.size) it._d.add("general");
}

const WORLD = {
  Europe: ["Germany|de|deutschland", "United Kingdom|gb|uk|england|scotland|wales|northern ireland|great britain", "Netherlands|nl|the netherlands|holland", "Switzerland|ch|schweiz", "Austria|at|österreich", "Sweden|se", "Norway|no", "Finland|fi", "Denmark|dk", "Belgium|be", "France|fr", "Spain|es", "Italy|it|italia", "Poland|pl", "Portugal|pt", "Ireland|ie", "Iceland|is", "Czechia|cz|czech republic", "Hungary|hu", "Greece|gr", "Bulgaria|bg", "Romania|ro", "Croatia|hr", "Slovenia|si", "Slovakia|sk", "Estonia|ee", "Latvia|lv", "Lithuania|lt", "Luxembourg|lu", "Serbia|rs", "Türkiye|tr|turkey|turkiye"],
  Asia: ["China|cn|chinese taipei|taiwan|hong kong", "India|in", "Japan|jp", "South Korea|kr|korea", "Singapore|sg", "Malaysia|my", "Thailand|th", "Indonesia|id", "Vietnam|vn", "Philippines|ph", "Pakistan|pk", "Bangladesh|bd", "Nepal|np", "Sri Lanka|lk", "Iran|ir", "Israel|il", "Saudi Arabia|sa", "United Arab Emirates|ae|uae|abu dhabi|dubai", "Qatar|qa", "Kazakhstan|kz"],
  "North America": ["United States|us|usa|united states of america", "Canada|ca", "Mexico|mx"],
  "South America": ["Brazil|br", "Chile|cl", "Argentina|ar", "Colombia|co", "Peru|pe", "Ecuador|ec"],
  Africa: ["South Africa|za", "Nigeria|ng", "Kenya|ke", "Egypt|eg", "Ghana|gh", "Morocco|ma", "Tanzania|tz", "Ethiopia|et", "Rwanda|rw", "Uganda|ug", "Senegal|sn", "Tunisia|tn"],
  Oceania: ["Australia|au", "New Zealand|nz", "Fiji|fj|fiji islands"],
};
const PLACE = new Map();
for (const [cont, list] of Object.entries(WORLD)) for (const row of list) { const [name, ...al] = row.split("|"); for (const a of [name.toLowerCase(), ...al]) PLACE.set(a, [cont, name]); }
const TLD = { de: "Germany", uk: "United Kingdom", nl: "Netherlands", ch: "Switzerland", at: "Austria", se: "Sweden", no: "Norway", fi: "Finland", dk: "Denmark", be: "Belgium", fr: "France", es: "Spain", it: "Italy", pl: "Poland", pt: "Portugal", ie: "Ireland", cn: "China", jp: "Japan", in: "India", au: "Australia", nz: "New Zealand", ca: "Canada", us: "United States", edu: "United States", br: "Brazil", za: "South Africa" };
function placeOf(it) {
  if (it._p !== undefined) return it._p;
  let r = null;
  if (it.kind === "job" || it.kind === "course" || it.kind === "event") {
    const loc = (it.location || "").toLowerCase().replace(/[()]/g, " ");
    const parts = loc.split(/,|\s-\s|\//).map(s => s.trim()).filter(Boolean);
    for (const part of [...parts].reverse()) { if (PLACE.has(part)) { r = PLACE.get(part); break; } }
    if (!r) { const words = loc.split(/[\s,]+/).filter(Boolean); for (let n = 3; n >= 1 && !r; n--) for (let i = 0; i + n <= words.length && !r; i++) { const g = words.slice(i, i + n).join(" "); if (g.length > 2 && PLACE.has(g)) r = PLACE.get(g); } }
    if (!r && /^jobsac/.test(it.source || "")) r = PLACE.get("united kingdom");
    if (!r && it.geo?.[3]) r = PLACE.get(String(it.geo[3]).toLowerCase()) || null;
    if (!r && /^(adzuna)/.test(it.source || "")) r = null;
    if (!r) { try { const tld = new URL(it.url).hostname.split(".").pop(); if (TLD[tld]) r = PLACE.get(TLD[tld].toLowerCase()); } catch {} }
  }
  return (it._p = r || (["paper", "news", "resource", "funding"].includes(it.kind) ? false : null));
}
const contOf = it => { const p = placeOf(it); return p ? p[0] : p === false ? "" : "Not stated"; };
const countryOf = it => { const p = placeOf(it); return p ? p[1] : ""; };

const PTYPES = ["PhD", "Postdoc", "Student and thesis", "Internship", "Industry and other"];
const AI_TYPES = { phd: "PhD", postdoc: "Postdoc", student: "Student and thesis", internship: "Internship", industry: "Industry and other", other: "Industry and other" };
let AI = {};
let PROG = {};
// Facts read from each programme's own page (degree, language, duration, ECTS, tuition), only when the page states them.
function progChips(it) {
  const p = it.kind === "course" && PROG[it.id]; if (!p || p.none) return "";
  const c = [p.degree, p.language, p.duration, p.ects ? p.ects + " ECTS" : "", p.tuition].filter(Boolean);
  return c.map(x => `<span class="pc">${esc(x)}</span>`).join("");
}
function ptypeOf(it) {
  if (it._t) return it._t;
  const a = AI[it.id]; if (a && AI_TYPES[a.type]) return (it._t = AI_TYPES[a.type]);
  const x = (it.title + " " + (it.summary || "")).toLowerCase();
  const tt = it.title.toLowerCase();
  return (it._t = /postdoc|post-doc|post doc|postdoctoral/.test(x) ? "Postdoc"
    : /\bph\.?d\b|doctoral|doktorand|promotion|dphil|research fellow.*phd|wissenschaftliche[rn]? mitarbeiter.*promo/.test(x) ? "PhD"
    : /intern(ship)?\b|praktik|trainee/.test(tt) ? "Internship"
    : /thesis|master'?s? (student|thesis)|abschlussarbeit|werkstudent|hiwi|student|studentische|bachelor|msc|master/.test(tt) ? "Student and thesis"
    : "Industry and other");
}
// Sector: who is hiring. Aggregator names (job boards, curated) say nothing, so they are ignored.
const SECTORS = ["University", "Research centre or public body", "Company"];
const SEC_CLASS = ["sec-u", "sec-r", "sec-c"];
const UNI_RE = /universit|universität|hochschule|\bcollege\b|institute of technology|\beth\b|epfl|\btu (berlin|wien|dresden|delft|darmstadt|münchen|munich)|\btum\b|\bkth\b|\bdtu\b|polytechn|école|jobs\.ac\.uk|\.ac\.uk|\.edu\b|\buni-|\buniv\b|faculty|fakultät/i;
const CO_RE = /\b(gmbh|ag|ltd|limited|inc|llc|plc|kg|oy|b\.v\.|s\.a\.|sarl|corp|corporation)\b/i;
const PUB_RE = /\bdlr\b|\bgfz\b|\bawi\b|\bufz\b|\besa\b|eumetsat|fraunhofer|helmholtz|max.planck|leibniz|institut\b|institute|research cent|forschungszentrum|\bagency\b|landesamt|bundesamt|ministr|\bbkg\b|usgs|\bjrc\b|\bvito\b|\btno\b|nasa|noaa|\bstadt\b|city of|municipal|behörde|landratsamt|landkreis|\bkreis\b|bundeswehr|government|council|deltares|met office|\bnerc\b|ggmbh/i;
const AGG = /^(Job boards|Company careers|Curated openings|University and agency careers)$/;
function sectorOf(it) {
  if (it._sec) return it._sec;
  const txt = [it.title, AGG.test(it.source_name || "") ? "" : it.source_name, it.url, (it.summary || "").slice(0, 160)].join(" ");
  return (it._sec = UNI_RE.test(txt) ? SECTORS[0] : CO_RE.test(txt) && !/ggmbh/i.test(txt) ? SECTORS[2] : PUB_RE.test(txt) ? SECTORS[1] : SECTORS[2]);
}
// Role family from the title: splits the large industry group into kinds of work.
const ROLES = [
  ["Research and teaching", /\bph\.?d\b|doctoral|doktorand|postdoc|post-doc|research (associate|assistant|fellow|scientist)|researcher|lecturer|professor|wissenschaftliche|scientist|studentship/i],
  ["Student, intern and trainee", /\bstudent|intern(ship)?\b|praktik|werkstudent|trainee|thesis|abschlussarbeit|ausbildung|azubi|anwärter|stagiair/i],
  ["Remote sensing and photogrammetry", /remote sensing|fernerkundung|photogramm|lidar|point cloud|punktwolke|laserscan|satellit|earth observation|\bsar\b|insar|image analyst|bildanaly|computer vision|perception|hyperspectral|drohne|drone|\buav\b/i],
  ["Surveying and geodesy", /vermess|surveyor|survey engineer|geodät|geodes|geodet|kataster|landmesser|gnss|geomatik|geomatics|geomatiker|liegenschaft/i],
  ["Software and data engineering", /developer|entwickler|software|programm|data engineer|data scien|devops|backend|frontend|full.?stack|machine learning|\bai\b|database|datenbank|\bcloud\b|python|product engineer|\bsdk\b|architect/i],
  ["Infrastructure and utilities", /netzausbau|\bnetz|leitungsdoku|kanal|tiefbau|wasserbau|bauingenieur|civil eng|infrastruktur|infrastructure|utilit|versorg|energie|energy|\bwind\b|gleis|\brail|\bbahn/i],
  ["GIS and geodata", /\bgis\b|geoinformat|geodaten|geodata|kartograph|cartograph|spatial|geospatial|mapping|webgis|arcgis|qgis/i],
  ["Management and coordination", /\blead\b|\bleiter|teamleit|abteilungsleit|projektleit|\bmanager|head of|koordinator|coordinator|director|referent/i],
  ["Engineering and technical", /engineer|ingenieur|techniker|technician|\bcad\b|bauzeichner|technical/i],
];
const ROLE_NAMES = [...ROLES.map(r => r[0]), "Other"];
function roleOf(it) { return it._r || (it._r = (ROLES.find(([, re]) => re.test(it.title)) || ["Other"])[0]); }
const fieldOf = it => { for (const d of DOMAINS) if (it._d.has(d.id)) return d.id; return "general"; };
const GROUPS = [["role", "Role"], ["type", "Type"], ["field", "Field"], ["sector", "Sector"], ["country", "Country"], ["time", "Deadline"]];
const GROUP_N = 6;
const openGroups = new Set();
function groupKey(it, g) {
  if (g === "role") return roleOf(it);
  if (g === "type") return ptypeOf(it);
  if (g === "field") return DOM[fieldOf(it)].name;
  if (g === "sector") return sectorOf(it);
  if (g === "country") return countryOf(it) || "Location not stated";
  return "";
}
function groupOrder(g, keys, count) {
  if (g === "role") return ROLE_NAMES.filter(k => keys.has(k));
  if (g === "type") return PTYPES.filter(k => keys.has(k));
  if (g === "sector") return SECTORS.filter(k => keys.has(k));
  if (g === "field") return DOMAINS.map(d => d.name).filter(k => keys.has(k));
  return [...keys].sort((a, b) => (a === "Location not stated") - (b === "Location not stated") || count[b] - count[a] || a.localeCompare(b));
}

function filtered(ignoreKind, ignoreDomain, ignoreSub, ignoreWhere) {
  const q = st.q.trim().toLowerCase();
  return feed.items.filter(it =>
    (ignoreKind || st.kind === "all" || it.kind === st.kind) &&
    (!st.topic || (it.matched || []).includes(st.topic)) &&
    (ignoreWhere || !st.continent || !contOf(it) || contOf(it) === st.continent) &&
    (ignoreWhere || !st.country || !contOf(it) || countryOf(it) === st.country) &&
    (ignoreDomain || !st.domain || it._d.has(st.domain)) &&
    (ignoreSub || ignoreDomain || !st.sub || it._s.has(st.domain + ":" + st.sub)) &&
    (!AI[it.id] || AI[it.id].relevance >= 3) &&
    (!st.ptype || it.kind !== "job" || ptypeOf(it) === st.ptype) &&
    (!st.source || it.source_name === st.source) &&
    (!st.newOnly || isNew(it)) &&
    (!NEEDS_DEADLINE.has(it.kind) || st.unlisted || (it.deadline && Date.parse(it.deadline) >= Date.now()) || upcoming(it) || it.open_posting) &&
    (!st.savedOnly || saved.has(it.id)) &&
    (!q || [it.title, it.source_name, (it.matched || []).join(" ")].join(" ").toLowerCase().includes(q)));
}

