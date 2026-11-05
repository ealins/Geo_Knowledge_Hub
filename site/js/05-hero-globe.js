// ---------- hero views: globe (where) and deadline radar (when) ----------
const hero = { viz: "globe", radarIdle: null, globeIdle: null };
function heroIdle() { (hero.viz === "globe" ? hero.globeIdle : hero.radarIdle)?.(); }
function setViz(v) {
  hero.viz = v; write("geo-radar-viz", v);
  document.querySelectorAll(".viz-tabs [data-viz]").forEach(b => b.setAttribute("aria-selected", b.dataset.viz === v));
  $("gbox").toggleAttribute("hidden", v !== "globe"); $("radar").toggleAttribute("hidden", v !== "radar");
  heroIdle(); globe.wake?.();
}

// Places: known cities and campuses first, else the country's centre with a little scatter (a placeholder, not an address).
const CITY = [
  [/berlin/, 52.52, 13.40], [/münchen|munich|garching|oberpfaffenhofen|wessling/, 48.14, 11.58], [/hamburg/, 53.55, 9.99], [/köln|cologne/, 50.94, 6.96], [/frankfurt/, 50.11, 8.68],
  [/stuttgart/, 48.78, 9.18], [/karlsruhe/, 49.01, 8.40], [/darmstadt/, 49.87, 8.65], [/potsdam/, 52.39, 13.06], [/hannover|hanover/, 52.37, 9.73], [/braunschweig/, 52.27, 10.52],
  [/dresden/, 51.05, 13.74], [/bonn/, 50.73, 7.10], [/münster/, 51.96, 7.63], [/freiburg/, 47.99, 7.85], [/heidelberg/, 49.40, 8.67], [/aachen/, 50.78, 6.08], [/bremen/, 53.08, 8.80],
  [/kiel/, 54.32, 10.14], [/leipzig/, 51.34, 12.37], [/jena/, 50.93, 11.59], [/dortmund/, 51.51, 7.47], [/magdeburg/, 52.12, 11.63], [/wiesbaden/, 50.08, 8.24], [/bielefeld/, 52.02, 8.53],
  [/osnabrück/, 52.28, 8.05], [/weimar/, 50.98, 11.33], [/bremerhaven/, 53.54, 8.58], [/leeds/, 53.80, -1.55], [/london/, 51.51, -0.13], [/edinburgh/, 55.95, -3.19], [/cardiff/, 51.48, -3.18],
  [/manchester/, 53.48, -2.24], [/southampton/, 50.91, -1.40], [/exeter/, 50.72, -3.53], [/norwich/, 52.63, 1.30], [/oxford/, 51.75, -1.26], [/cambridge, uk|university of cambridge/, 52.21, 0.12],
  [/glasgow/, 55.86, -4.25], [/nottingham/, 52.95, -1.15], [/bristol/, 51.45, -2.59], [/newcastle/, 54.98, -1.61], [/reading/, 51.45, -0.97], [/zürich|zurich|eth /, 47.38, 8.54],
  [/lausanne|epfl/, 46.52, 6.57], [/bern\b/, 46.95, 7.45], [/basel/, 47.56, 7.59], [/geneva|genève/, 46.20, 6.14], [/wien|vienna|tu wien/, 48.21, 16.37], [/graz/, 47.07, 15.44],
  [/salzburg/, 47.81, 13.06], [/innsbruck/, 47.27, 11.39], [/delft/, 52.01, 4.36], [/enschede|twente|\bitc\b/, 52.22, 6.89], [/rotterdam/, 51.92, 4.48], [/amsterdam/, 52.37, 4.90],
  [/utrecht/, 52.09, 5.12], [/wageningen/, 51.97, 5.67], [/eindhoven/, 51.44, 5.47], [/'s-hertogenbosch/, 51.69, 5.30], [/assen/, 52.99, 6.56], [/groningen/, 53.22, 6.57],
  [/espoo|aalto/, 60.21, 24.66], [/helsinki/, 60.17, 24.94], [/stockholm|\bkth\b/, 59.33, 18.07], [/uppsala|swedish university of agricultural/, 59.86, 17.64], [/lund\b/, 55.70, 13.19],
  [/gothenburg|göteborg/, 57.71, 11.97], [/copenhagen|københavn|\bdtu\b|lyngby/, 55.68, 12.57], [/oslo/, 59.91, 10.75], [/trondheim|ntnu/, 63.43, 10.40], [/bergen/, 60.39, 5.32],
  [/paris/, 48.86, 2.35], [/toulouse/, 43.60, 1.44], [/barcelona/, 41.39, 2.17], [/madrid/, 40.42, -3.70], [/milan/, 45.46, 9.19], [/rome|roma/, 41.90, 12.50], [/lisbon|lisboa/, 38.72, -9.14],
  [/dublin/, 53.35, -6.26], [/brussels|bruxelles/, 50.85, 4.35], [/leuven/, 50.88, 4.70], [/ghent|gent\b/, 51.05, 3.72], [/warsaw|warszawa/, 52.23, 21.01], [/prague|praha/, 50.08, 14.44],
  [/pennsylvania state|penn state|state college/, 40.80, -77.86], [/purdue|west lafayette/, 40.43, -86.91], [/university of arizona|tucson/, 32.23, -110.95], [/university of maine|orono/, 44.90, -68.67],
  [/university of florida|gainesville/, 29.65, -82.32], [/university of maryland|college park/, 38.99, -76.94], [/british columbia|vancouver/, 49.26, -123.25], [/calgary/, 51.08, -114.13],
  [/toronto/, 43.66, -79.40], [/boston|mit\b/, 42.36, -71.06], [/seattle/, 47.61, -122.33], [/denver|boulder/, 40.01, -105.27], [/blantyre/, -15.79, 35.01], [/nairobi/, -1.29, 36.82],
  [/sydney/, -33.87, 151.21], [/melbourne/, -37.81, 144.96], [/brisbane/, -27.47, 153.03], [/auckland/, -36.85, 174.76], [/kathmandu/, 27.72, 85.32], [/beijing/, 39.90, 116.40],
  [/wuhan/, 30.59, 114.31], [/tokyo/, 35.68, 139.69], [/singapore/, 1.35, 103.82],
];
const CENTROID = { "Germany": [51.2, 10.4], "United Kingdom": [53.5, -2.2], "Netherlands": [52.2, 5.5], "Switzerland": [46.8, 8.2], "Austria": [47.6, 14.1], "Sweden": [60.5, 15.5],
  "Norway": [60.5, 9], "Finland": [62.5, 25.5], "Denmark": [56, 9.5], "Belgium": [50.6, 4.6], "France": [46.6, 2.4], "Spain": [40.3, -3.7], "Italy": [42.8, 12.5], "Poland": [52, 19.4],
  "Portugal": [39.6, -8], "Ireland": [53.3, -8], "Iceland": [64.9, -18.6], "Czechia": [49.8, 15.5], "Hungary": [47.2, 19.4], "Greece": [39, 22], "Bulgaria": [42.7, 25.5], "Romania": [45.9, 25],
  "Croatia": [45.1, 15.2], "Slovenia": [46.1, 14.8], "Slovakia": [48.7, 19.5], "Estonia": [58.6, 25], "Latvia": [56.9, 24.6], "Lithuania": [55.2, 23.9], "Luxembourg": [49.8, 6.1],
  "Serbia": [44, 21], "Türkiye": [39, 35], "China": [33, 108], "India": [22, 79], "Japan": [36.5, 138.5], "South Korea": [36.5, 127.8], "Singapore": [1.35, 103.8], "Malaysia": [4, 102],
  "Thailand": [15, 101], "Indonesia": [-2, 118], "Vietnam": [16, 107], "Philippines": [12.9, 122], "Pakistan": [30, 70], "Bangladesh": [23.7, 90.3], "Nepal": [28.2, 84], "Sri Lanka": [7.9, 80.7],
  "Iran": [32.4, 53.7], "Israel": [31, 35], "Saudi Arabia": [24, 45], "United Arab Emirates": [24, 54], "Qatar": [25.3, 51.2], "Kazakhstan": [48, 67], "United States": [39.5, -97],
  "Canada": [53, -100], "Mexico": [23.6, -102.5], "Brazil": [-12, -50], "Chile": [-33, -71], "Argentina": [-35, -64], "Colombia": [4.6, -74], "Peru": [-9.2, -75], "Ecuador": [-1.8, -78.2],
  "South Africa": [-30.6, 24], "Nigeria": [9.1, 8.7], "Kenya": [0.2, 37.9], "Egypt": [26.8, 30.8], "Ghana": [7.9, -1], "Morocco": [31.8, -7.1], "Tanzania": [-6.4, 34.9], "Ethiopia": [9.1, 40.5],
  "Rwanda": [-1.9, 29.9], "Uganda": [1.4, 32.3], "Senegal": [14.5, -14.5], "Tunisia": [34, 9.5], "Australia": [-25.3, 134], "New Zealand": [-41, 174], "Fiji": [-17.7, 178] };
const SPREAD = { "United States": 7, "Canada": 6, "China": 6, "Australia": 6, "Brazil": 6, "India": 4, "Kazakhstan": 4, "Mexico": 3.5, "Argentina": 4, "Saudi Arabia": 3, "Iran": 3, "Germany": 1.6, "United Kingdom": 1.4, "France": 1.8, "Spain": 1.6, "Sweden": 1.8, "Norway": 1.6, "Finland": 1.6 };
const hashN = (s, k) => { let h = 2166136261 ^ k; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 5000 - 1; };
function coordOf(it) {
  if (it._ll !== undefined) return it._ll;
  const p = placeOf(it); if (!p) return (it._ll = null);
  if (Array.isArray(it.geo) && it.geo[0] != null) return (it._ll = [it.geo[1] + hashN(it.id, 1) * 0.05, it.geo[0] + hashN(it.id, 2) * 0.035]); // institution or city from the geocoder
  const loc = (it.location || "").toLowerCase();
  const city = CITY.find(([re]) => re.test(loc));
  const [la, lo, s] = city ? [city[1], city[2], 0.18] : CENTROID[p[1]] ? [...CENTROID[p[1]], SPREAD[p[1]] || 1] : [null];
  if (la == null) return (it._ll = null);
  return (it._ll = [lo + hashN(it.id, 1) * s, la + hashN(it.id, 2) * s * 0.65]);
}

const globe = { pts: [], land: null, rot: [-12, -42, 0], wake: null, zoom: 1 };
function renderGlobe(open) {
  const cv = $("globe");
  if (!window.d3?.geoOrthographic) { setViz("radar"); document.querySelector(".viz-tabs").hidden = true; return; }
  const KC = { job: "#ffb454", course: "#cfa3ff", event: "#5cc8e8" }, KN = { job: "Position", course: "Programme", event: "Event" };
  globe.pts = open.map(it => ({ it, ll: coordOf(it) })).filter(p => p.ll).concat((globe.sup || []).map(s => ({ sup: s, ll: [s.lon, s.lat] })));
  const countries = new Set(globe.pts.filter(p => p.it).map(p => countryOf(p.it))).size;
  const cap = $("radarcap");
  const legend = `<div class="rlegend">${["job", "course", "event"].map(k => `<span><i style="--c:${KC[k]}"></i>${KN[k]}s ${globe.pts.filter(p => p.it && p.it.kind === k).length}</span>`).join("")}</div>`;
  hero.globeIdle = () => cap.innerHTML = `Picking up <b>${globe.pts.filter(p => p.it).length}</b> pulses in <b>${countries}</b> countries. Drag to turn the globe.${legend}`;
  heroIdle();
  if (globe.started) { globe.wake?.(); return; }
  globe.started = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = cv.getContext("2d");
  const proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const path = d3.geoPath(proj, ctx), grat = d3.geoGraticule10();
  let W = 0, dpr = 1, raf = 0, last = 0, visible = true, hover = null, drag = null, t0 = performance.now();
  function size() { const w = cv.clientWidth || 440; dpr = Math.min(2, devicePixelRatio || 1); W = w; cv.width = w * dpr; cv.height = w * dpr; proj.scale((w / 2 - 6) * globe.zoom).translate([w / 2, w / 2]); }
  function frame(now) {
    raf = 0; const dt = Math.min(64, now - (last || now)); last = now;
    if (!drag && !hover && !reduce) globe.rot[0] += dt * 0.004;
    proj.rotate(globe.rot);
    const c = W / 2, r = (W / 2 - 6) * globe.zoom, sweep = reduce ? -Math.PI / 2 : ((now - t0) / 4200) * Math.PI * 2 - Math.PI / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    const g = ctx.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
    g.addColorStop(0, "#16324a"); g.addColorStop(1, "#0a1722");
    ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); path(grat); ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 0.6; ctx.stroke();
    if (globe.land) { ctx.beginPath(); path(globe.land); ctx.fillStyle = "rgba(143,186,206,.16)"; ctx.fill(); ctx.strokeStyle = "rgba(195,215,228,.30)"; ctx.lineWidth = 0.6; ctx.stroke(); }
    if (!reduce) { // radar sweep across the visible face
      ctx.save(); ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.clip();
      const cg = ctx.createConicGradient ? ctx.createConicGradient(sweep - 0.9, c, c) : null;
      if (cg) { cg.addColorStop(0, "rgba(95,224,201,0)"); cg.addColorStop(0.143, "rgba(95,224,201,.16)"); cg.addColorStop(0.1431, "rgba(95,224,201,0)"); cg.addColorStop(1, "rgba(95,224,201,0)");
        ctx.fillStyle = cg; ctx.fillRect(0, 0, W, W); }
      ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + r * Math.cos(sweep), c + r * Math.sin(sweep)); ctx.strokeStyle = "rgba(95,224,201,.55)"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    }
    ctx.beginPath(); path({ type: "Sphere" }); ctx.strokeStyle = "rgba(95,224,201,.35)"; ctx.lineWidth = 1; ctx.stroke();
    const center = [-globe.rot[0], -globe.rot[1]]; globe.vis = [];
    for (const p of globe.pts) {
      if (d3.geoDistance(p.ll, center) > Math.PI / 2 - 0.02) continue;
      const [x, y] = proj(p.ll); globe.vis.push([x, y, p]);
      const col = p.sup ? "#ffc247" : KC[p.it.kind];
      if (!reduce) { // the sweep "picks up" each pulse as it passes
        let d = (sweep - Math.atan2(y - c, x - c)) % (Math.PI * 2); if (d < 0) d += Math.PI * 2;
        if (d < 1.6) { const k = 1 - d / 1.6; ctx.beginPath(); ctx.arc(x, y, 3 + 13 * (1 - k), 0, Math.PI * 2); ctx.strokeStyle = col; ctx.globalAlpha = k * 0.85; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 1; }
      }
      ctx.beginPath(); ctx.arc(x, y, (p === hover ? 5 : p.sup ? 3.8 : 2.6) * Math.max(1, Math.sqrt(W / 480)), 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      if (p === hover) { ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke(); }
    }
    if (!reduce && visible && !document.hidden && hero.viz === "globe") raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf && hero.viz === "globe") raf = requestAnimationFrame(frame); };
  globe.wake = wake;
  function pick(e) {
    const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; let best = null, bd = 12;
    for (const [px, py, p] of globe.vis || []) { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = p; } }
    return best;
  }
  let lastZoom = 0;
  const setZoom = z => { lastZoom = performance.now(); globe.zoom = Math.max(1, Math.min(8, z)); size(); cv.style.touchAction = globe.zoom > 1 ? "none" : "";
    $("gzreset").hidden = globe.zoom === 1; $("gzin").disabled = globe.zoom >= 8; $("gzout").disabled = globe.zoom <= 1; wake(); if (reduce) frame(performance.now()); };
  $("gzin").onclick = () => setZoom(globe.zoom * 1.6); $("gzout").onclick = () => setZoom(globe.zoom / 1.6);
  $("gzreset").onclick = () => { globe.rot[1] = -30; setZoom(1); };
  $("gzout").disabled = true;
  cv.addEventListener("wheel", e => { if (!(e.ctrlKey || e.metaKey || globe.zoom > 1)) return; e.preventDefault(); setZoom(globe.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
  const ptrs = new Map(); let pinch0 = null;
  cv.addEventListener("pointerdown", e => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: globe.zoom }; drag = null; } });
  cv.addEventListener("pointermove", e => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch0 && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; setZoom(pinch0.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0.d); } });
  const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null; };
  cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
  cv.addEventListener("pointerdown", e => { if (pinch0) return; drag = { x: e.clientX, y: e.clientY, r: [...globe.rot], moved: false }; cv.setPointerCapture(e.pointerId); cv.classList.add("drag"); });
  cv.addEventListener("pointermove", e => {
    if (pinch0) return;
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      const k = 0.32 / Math.sqrt(globe.zoom); globe.rot = [drag.r[0] + dx * k, Math.max(-75, Math.min(75, drag.r[1] - dy * k)), 0]; wake(); if (reduce) frame(performance.now()); return; }
    const p = pick(e); if (p !== hover) { hover = p; cv.classList.toggle("hit", !!p);
      if (p && p.sup) cap.innerHTML = `Supported by <b>${esc(p.sup.name)}</b>, ${esc(p.sup.city)}. Thank you.`;
      else if (p) { const d = p.it.deadline && Date.parse(p.it.deadline) >= Date.now() - 864e5 ? Math.max(0, dayLeft(p.it.deadline)) : null;
        cap.innerHTML = `<a href="${esc(p.it.url)}" target="_blank" rel="noopener noreferrer">${esc(p.it.title.length > 110 ? p.it.title.slice(0, 108) + "…" : p.it.title)}</a><br>${KN[p.it.kind]} in ${esc(countryOf(p.it))}${d != null ? `, closes ${fmt(p.it.deadline)}` : p.it.open_posting ? ", open posting" : ""}`; }
      else heroIdle();
      wake(); if (reduce) frame(performance.now()); }
  });
  cv.addEventListener("pointerup", e => { const moved = drag?.moved; drag = null; cv.classList.remove("drag"); if (!moved && performance.now() - lastZoom > 500) { const p = pick(e); const u = p && (p.sup ? p.sup.url : p.it.url); if (u) window.open(u, "_blank", "noopener"); } });
  cv.addEventListener("pointerleave", () => { if (!drag && hover) { hover = null; cv.classList.remove("hit"); heroIdle(); wake(); } });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }).observe(cv);
  document.addEventListener("visibilitychange", wake);
  addEventListener("resize", () => { size(); wake(); if (reduce) frame(performance.now()); });
  size(); frame(performance.now());
  fetch("data/supporters.json").then(r => r.ok ? r.json() : null).then(j => { const s = (j?.supporters || []).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lon) && x.name); globe.sup = s; if (s.length) { globe.pts = globe.pts.filter(p => p.it).concat(s.map(x => ({ sup: x, ll: [x.lon, x.lat] }))); frame(performance.now()); } }).catch(() => {});
  fetch("vendor/land-110m.json").then(r => r.json()).then(j => { globe.land = j; frame(performance.now()); }).catch(() => {});
}

function renderHero() {
  const now = Date.now(), H = 60;
  const open = feed.items.filter(it => NEEDS_DEADLINE.has(it.kind) && ((it.deadline && Date.parse(it.deadline) >= now - 864e5) || it.open_posting || upcoming(it)));
  const dated = open.filter(it => it.deadline && Date.parse(it.deadline) >= now - 864e5)
    .map(it => ({ it, d: Math.max(0, (Date.parse(it.deadline) - now) / 864e5) }))
    .filter(x => x.d <= H).sort((a, b) => a.d - b.d);
  const HK = { job: "var(--h-job)", course: "var(--h-course)", event: "var(--h-event)" };
  const KN = { job: "Position", course: "Programme", event: "Event" };
  const soon = dated.filter(x => x.d <= 14).length;
  $("pulse").innerHTML = `<b>${open.length}</b> open positions, programmes and events${soon ? `. <b>${soon}</b> close within two weeks` : ""}.`;
  const left = d => d <= 0 ? "Today" : d === 1 ? "1 day" : d + " days";
  const urg = d => d <= 7 ? "var(--h-hot)" : d <= 30 ? "var(--h-warm)" : "var(--h-calm)";
  const short = s => s.length > 110 ? s.slice(0, 108) + "…" : s;
  $("next").innerHTML = dated.slice(0, 5).map(x => { const d = Math.max(0, dayLeft(x.it.deadline));
    return `<li><span class="nd" style="--c:${urg(d)}">${left(d)}</span><a href="${esc(x.it.url)}" target="_blank" rel="noopener noreferrer"><i class="kd" style="--k:${HK[x.it.kind]}" aria-hidden="true"></i><span class="sr">${KN[x.it.kind]}: </span>${esc(short(x.it.title))}</a></li>`; }).join("")
    || '<li class="none">No dated deadlines in the next 60 days.</li>';

  // Polar deadline radar: distance from the centre is time left (sqrt scale, so the next weeks get room), each wedge is a field.
  const C = 230, R = 168, R0 = 14, n = DOMAINS.length, span = 360 / n, SWEEP = 2.8;
  const rad = d => R0 + (R - R0) * Math.sqrt(Math.min(d, H) / H);
  const pt = (r, a) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)];
  const LABEL = { photo: "Photogrammetry", lidar: "LiDAR", rs: "Remote sensing", sar: "SAR, InSAR", geodesy: "Geodesy, GNSS", gis: "GIS", geoai: "GeoAI", city: "3D city, BIM", general: "General" };
  const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  let g = `<defs><radialGradient id="rbg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5fe0c9" stop-opacity=".10"/><stop offset="1" stop-color="#5fe0c9" stop-opacity="0"/></radialGradient>
    <linearGradient id="rsg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fe0c9" stop-opacity="0"/><stop offset="1" stop-color="#5fe0c9" stop-opacity=".32"/></linearGradient></defs>
    <circle cx="${C}" cy="${C}" r="${R}" fill="url(#rbg)"/>`;
  for (let i = 0; i < n; i++) { const [x, y] = pt(R, i * span); g += `<line class="spoke" x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }
  [[7, "7 days"], [14, "2 weeks"], [30, "1 month"], [60, "2 months"]].forEach(([d, l]) => {
    g += `<circle class="ring${d === 60 ? " r60" : ""}" cx="${C}" cy="${C}" r="${rad(d).toFixed(1)}"/><text class="rl" x="${C + 5}" y="${(C - rad(d) + 13).toFixed(1)}">${l}</text>`;
  });
  DOMAINS.forEach((dm, i) => {
    const a = i * span + span / 2, [x, y] = pt(R + 22, a);
    const anchor = Math.abs(Math.sin(a * Math.PI / 180)) < 0.25 ? "middle" : Math.sin(a * Math.PI / 180) > 0 ? "start" : "end";
    g += `<text class="sl" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${esc(LABEL[dm.id] || dm.name)}</text>`;
  });
  const wedge = (() => { const [x1, y1] = pt(R, -38); return `M${C} ${C} L${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 1 ${C} ${C - R} Z`; })();
  g += `<g class="rsweep"><path d="${wedge}" fill="url(#rsg)" transform="rotate(0 ${C} ${C})"/><line x1="${C}" y1="${C}" x2="${C}" y2="${C - R}"/></g>`;
  dated.forEach((x, i) => {
    const si = DOMAINS.findIndex(d => d.id === fieldOf(x.it));
    const a = si * span + span * (0.16 + 0.68 * ((hash(x.it.id) % 1000) / 1000));
    const [px, py] = pt(rad(x.d), a);
    g += `<a href="${esc(x.it.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true" data-i="${i}"><circle class="blip" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${HK[x.it.kind]}" style="--d:${(a / 360 * SWEEP).toFixed(2)}s"/></a>`;
  });
  g += `<circle class="core" cx="${C}" cy="${C}" r="2.5"/>`;
  const svg = $("radar"); svg.innerHTML = svg.querySelector("title").outerHTML + g;
  const cap = $("radarcap");
  const legend = `<div class="rlegend">${["job", "course", "event"].map(k => `<span><i style="--c:${HK[k]}"></i>${KN[k]}s ${dated.filter(x => x.it.kind === k).length}</span>`).join("")}</div>`;
  hero.radarIdle = () => cap.innerHTML = `Distance from the centre is time left; each wedge is a field.${legend}`;
  const idle = () => heroIdle();
  idle();
  svg.addEventListener("mouseover", e => { const el = e.target.closest("[data-i]"); if (!el) return; const x = dated[+el.dataset.i];
    cap.innerHTML = `<a href="${esc(x.it.url)}" target="_blank" rel="noopener noreferrer">${esc(short(x.it.title))}</a><br>${KN[x.it.kind]}, closes ${fmt(x.it.deadline)} (${left(Math.max(0, dayLeft(x.it.deadline))).toLowerCase()} left)`; });
  svg.addEventListener("mouseleave", idle);
  renderGlobe(open);
}

// Hero background: a LiDAR-style point cloud of a terrain, seen in perspective, coloured by elevation.
function drawCloud() {
  const cv = $("cloud"); if (!cv) return;
  const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  const wide = w > 900;
  // Height field: two peaks, a valley and ridged detail, all deterministic.
  const hgt = (x, z) => 2.5 * Math.exp(-((x - 4.8) ** 2 / 4.5 + (z - 8.5) ** 2 / 5)) + 1.9 * Math.exp(-((x + 5.5) ** 2 / 6 + (z - 10.5) ** 2 / 7))
    + 1.3 * Math.exp(-((x - 0.5) ** 2 / 3 + (z - 12.5) ** 2 / 4)) + 0.9 * Math.exp(-((x - 9.5) ** 2 / 5 + (z - 6) ** 2 / 4))
    + 0.28 * Math.sin(x * 1.1 + z * 0.5) * Math.cos(z * 0.8) + 0.12 * Math.sin(x * 3.3 - z * 2.1) + 0.06 * Math.sin(x * 7.1 + z * 5.3)
    + 0.35 * Math.abs(Math.sin(x * 0.7 + z * 1.6)) * Math.exp(-((z - 9) ** 2) / 10);
  const camH = 2.3, horizon = h * (wide ? 0.40 : 0.36), f = Math.max(w, 700) * (wide ? 0.6 : 0.95), cx = wide ? w * 0.6 : w * 0.5, relief = 0.95;
  const stops = [[0, [95, 224, 201]], [0.5, [110, 168, 255]], [1, [197, 139, 255]]];
  const col = v => { v = Math.max(0, Math.min(1, v)); const i = v < stops[1][0] ? 0 : 1; const [a0, c0] = stops[i], [a1, c1] = stops[i + 1]; const k = (v - a0) / (a1 - a0);
    return c0.map((c, j) => Math.round(c + (c1[j] - c) * k)); };
  // Back to front so near points draw on top.
  for (let z = 16; z >= 1.4; z -= 0.08 * Math.max(1, z / 4)) {
    const near = 1 - (z - 1.4) / 14.6, step = 0.11 * (z / 4) ** 0.6;
    for (let x = -12; x <= 12; x += step) {
      const y = hgt(x, z), sx = cx + f * x / z, sy = horizon + f * (camH - y * relief) / z * 0.55;
      if (sx < -4 || sx > w + 4 || sy < -4 || sy > h + 4) continue;
      const [r, g, b] = col(y / 2.4);
      ctx.fillStyle = `rgba(${r},${g},${b},${(0.2 + 0.6 * near ** 1.2 + 0.18 * Math.min(1, y / 2)).toFixed(3)})`;
      const s = 0.7 + 1.6 * near ** 2; ctx.fillRect(sx, sy, s, s);
    }
  }
}

function renderWhere() {
  const pool = filtered(false, false, false, true).filter(it => contOf(it));
  const ORDER = ["Europe", "North America", "Asia", "Oceania", "Africa", "South America", "Not stated"];
  const by = {}; for (const it of pool) { const c = contOf(it); by[c] = (by[c] || 0) + 1; }
  let h = `<div class="wrow"><span class="wlabel">Where</span><button class="wpill" data-cont="" aria-pressed="${!st.continent}">Anywhere<i>${pool.length}</i></button>` +
    ORDER.filter(c => by[c] || st.continent === c).map(c => `<button class="wpill" data-cont="${esc(c)}" aria-pressed="${st.continent === c}">${esc(c)}<i>${by[c] || 0}</i></button>`).join("") + "</div>";
  if (st.continent && st.continent !== "Not stated") {
    const cc = {}; for (const it of pool) if (contOf(it) === st.continent) { const k = countryOf(it); if (k) cc[k] = (cc[k] || 0) + 1; }
    const names = Object.entries(cc).sort((a, b) => b[1] - a[1]);
    if (names.length > 1 || st.country) h += `<div class="wrow"><span class="wlabel">Country</span><button class="wpill c" data-country="" aria-pressed="${!st.country}">All<i>${pool.filter(it => contOf(it) === st.continent).length}</i></button>` +
      names.map(([n, c]) => `<button class="wpill c" data-country="${esc(n)}" aria-pressed="${st.country === n}">${esc(n)}<i>${c}</i></button>`).join("") + "</div>";
  }
  if (st.kind === "job") {
    const save = st.ptype; st.ptype = "";
    const base = filtered(false, false, false, false).filter(it => it.kind === "job"); st.ptype = save;
    const bt = {}; for (const it of base) { const k = ptypeOf(it); bt[k] = (bt[k] || 0) + 1; }
    h += `<div class="wrow"><span class="wlabel">Type</span><button class="wpill" data-pt="" aria-pressed="${!st.ptype}">Any<i>${base.length}</i></button>` +
      PTYPES.filter(k => bt[k] || st.ptype === k).map(k => `<button class="wpill" data-pt="${esc(k)}" aria-pressed="${st.ptype === k}">${esc(k)}<i>${bt[k] || 0}</i></button>`).join("") + "</div>";
  }
  if (st.continent && st.kind === "all") h += '<div class="wnote">The place filter applies to positions, programmes and events. Papers and news have no location and stay visible.</div>';
  $("where").innerHTML = h;
}

function renderMatcher() {
  const has = new Set(profile.skills.map(s => s.toLowerCase()));
  $("mpresets").innerHTML = PRESETS.map(p => `<button class="chip" data-preset="${esc(p)}" aria-pressed="${has.has(p.toLowerCase())}">${esc(p)}</button>`).join("");
  $("mlevels").innerHTML = LEVELS.map(([l]) => `<button class="chip" data-level="${esc(l)}" aria-pressed="${profile.levels.includes(l)}">${esc(l)}</button>`).join("");
  if (document.activeElement !== $("mskills")) $("mskills").value = profile.skills.join(", ");
  if (document.activeElement !== $("mwhere")) $("mwhere").value = profile.where;
  if (!profile.skills.length) { $("mtop").innerHTML = '<div class="none">Pick a few skills to see your best fits.</div>'; return; }
  const top = feed.items.filter(it => NEEDS_DEADLINE.has(it.kind) && (it.deadline ? Date.parse(it.deadline) >= Date.now() - 864e5 : it.open_posting))
    .map(it => [matchScore(it), it]).filter(([m]) => m != null && m >= 0.3).sort((a, b) => b[0] - a[0]).slice(0, 5);
  $("mtop").innerHTML = top.length ? top.map(([m, it]) => `<a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer"><b>${Math.round(m * 100)}%</b><span>${esc(it.title.length > 70 ? it.title.slice(0, 68) + "…" : it.title)}</span></a>`).join("")
    + '<a href="#" data-showmatch="1" style="color:var(--accent)"><b></b><span>See all ranked by match</span></a>'
    : '<div class="none">No strong matches open right now. Try broader skills.</div>';
}
function saveProfile() { write(STORE.profile, JSON.stringify(profile)); }

const compact = n => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
const REGION = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; } })();
