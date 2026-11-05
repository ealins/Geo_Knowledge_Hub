const KINDS = [["all","All"],["job","Positions"],["paper","Papers"],["course","Programmes"],["event","Events"],["funding","Funding"],["resource","Resources"],["news","News"]];
const STORE = { saved: "geo-radar-saved", theme: "geo-radar-theme", profile: "geo-radar-profile", group: "geo-radar-group" };
const PRESETS = ["Photogrammetry", "LiDAR", "Point clouds", "Remote sensing", "SAR", "InSAR", "GIS", "Python", "Deep learning", "GNSS", "Geodesy", "CityGML", "BIM", "UAV", "Hyperspectral"];
const LEVELS = [["PhD", /\bphd\b|doctoral|doktorand|promotion/], ["Postdoc", /postdoc|post-doc|research (associate|fellow)|wissenschaftliche/], ["Master or thesis", /\bmaster|\bmsc\b|thesis|abschlussarbeit/], ["Industry", /engineer|consultant|gmbh|\bag\b|specialist|fachkraft|developer|analyst|manager/], ["Internship", /intern|praktik|werkstudent|student assistant/]];
let profile = { skills: [], levels: [], where: "" };
const SYN = { "point clouds": "point cloud", "deep learning": "deep learning|neural|machine learning", "uav": "uav|drone|unmanned", "gis": "\\bgis\\b|geoinformat", "geodesy": "geodes|geodät|vermessung|surveying", "remote sensing": "remote sensing|fernerkundung|earth observation", "photogrammetry": "photogramm" };
function skillRe(s) { const k = s.toLowerCase().trim(); return new RegExp(SYN[k] || k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
function matchScore(it) {
  if (!profile.skills.length || !(it.kind === "job" || it.kind === "course")) return null;
  const title = it.title.toLowerCase(), body = [it.summary, (it.matched || []).join(" "), it.location, it.source_name].join(" ").toLowerCase();
  let s = 0;
  for (const k of profile.skills) { const r = skillRe(k); s += r.test(title) ? 1 : r.test(body) ? 0.6 : 0; }
  if (!s) return 0;
  let score = 0.55 * Math.min(1, s) + 0.45 * (s / profile.skills.length);
  if (profile.levels.length) score += LEVELS.some(([l, r]) => profile.levels.includes(l) && r.test(title + " " + body)) ? 0.2 : -0.2;
  if (profile.where.trim()) score += profile.where.toLowerCase().split(/[,\s]+/).filter(Boolean).some(w => (it.location || "").toLowerCase().includes(w) || title.includes(w)) ? 0.15 : 0;
  return Math.max(0, Math.min(1, score));
}
const PAGE = 40;
const NEEDS_DEADLINE = new Set(["job", "course", "event", "funding"]);
const isCall = it => it.kind === "paper" && it.call;
const upcoming = it => it.kind === "event" && it.ends && Date.parse(it.ends) + 864e5 >= Date.now();
const when = it => Date.parse(it.deadline || it.starts || 0) || 0;
let PEOPLE = null;
const st = { pfield: "", continent: "", country: "", domain: "", sub: "", kind: "all", ptype: "", group: "", topic: "", source: "", q: "", sort: "auto", newOnly: false, unlisted: false, savedOnly: false, shown: PAGE };
let feed = { items: [] }, status = {}, saved = new Set();

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = iso => iso ? new Date(iso).toLocaleDateString(undefined, {day:"numeric", month:"short", year:"numeric"}) : "";
const age = it => Date.now() - Date.parse(it.first_seen);
const isNew = it => age(it) < 7 * 864e5;
const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function applyTheme(t) {
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  $("theme").textContent = "Theme: " + t;
}

