$("stats").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { st.kind = b.dataset.k; reset(); swap(); } });
document.addEventListener("click", e => {
  const vz = e.target.closest("[data-viz]");
  if (vz) { setViz(vz.dataset.viz); return; }
  const cl = e.target.closest("[data-clear]");
  if (cl) { clearFilter(cl.dataset.clear); return; }
  if (e.target.closest("[data-stat-new]")) { st.newOnly = !st.newOnly; $("newOnly").checked = st.newOnly; reset(); return; }
  const wt = e.target.closest("[data-pt]");
  if (wt) { const tile = wt.classList.contains("ptile"); st.ptype = tile && st.ptype === wt.dataset.pt ? "" : wt.dataset.pt; st.shown = PAGE; render(); if (tile) { toView(); swap(); } return; }
  const mx = e.target.closest("[data-mxd]");
  if (mx) { st.domain = mx.dataset.mxd; st.sub = ""; st.ptype = mx.dataset.mxp; st.shown = PAGE; render(); window.scrollTo({ top: Math.max(0, $("vhead").getBoundingClientRect().top + scrollY - 70), behavior: "smooth" }); return; }
  const gp = e.target.closest("[data-group]");
  if (gp) { st.group = gp.dataset.group; write(STORE.group, st.group); st.shown = PAGE; render(); return; }
  const go = e.target.closest("[data-gopen]");
  if (go) { const k = go.dataset.gopen; openGroups.has(k) ? openGroups.delete(k) : openGroups.add(k); render(); return; }
  const wc = e.target.closest("[data-cont]");
  if (wc) { st.continent = wc.dataset.cont; st.country = ""; reset(); return; }
  const wy = e.target.closest("[data-country]");
  if (wy) { st.country = wy.dataset.country; reset(); return; }
  const pr = e.target.closest("[data-preset]");
  if (pr) { const p = pr.dataset.preset, i = profile.skills.findIndex(s => s.toLowerCase() === p.toLowerCase()); i >= 0 ? profile.skills.splice(i, 1) : profile.skills.push(p); saveProfile(); render(); return; }
  const lv = e.target.closest("[data-level]");
  if (lv) { const l = lv.dataset.level; profile.levels = profile.levels.includes(l) ? profile.levels.filter(x => x !== l) : [...profile.levels, l]; saveProfile(); render(); return; }
  if (e.target.closest("[data-showmatch]")) { e.preventDefault(); st.domain = ""; st.sub = ""; st.kind = "job"; st.sort = "match"; $("sort").value = "match"; st.shown = PAGE; render(); window.scrollTo({ top: document.querySelector(".tabs").offsetTop - 1, behavior: "smooth" }); return; }
  const dm = e.target.closest("[data-dom]");
  if (dm) { setDomain(dm.dataset.dom); return; }
  const sb = e.target.closest("[data-sub]");
  if (sb) { st.sub = st.sub === sb.dataset.sub ? "" : sb.dataset.sub; reset(); return; }
  const kk = e.target.closest(".colmore");
  if (kk) { st.kind = kk.dataset.k; st.shown = PAGE; render(); window.scrollTo({ top: document.querySelector(".tabs").offsetTop - 1, behavior: "smooth" }); return; }
  const t = e.target.closest("[data-t]");
  if (t) { st.topic = st.topic === t.dataset.t ? "" : t.dataset.t; reset(); return; }
  const sv = e.target.closest("[data-save]");
  if (sv) { const id = sv.dataset.save; saved.has(id) ? saved.delete(id) : saved.add(id); write(STORE.saved, JSON.stringify([...saved])); render(); return; }
  const cp = e.target.closest("[data-copy]");
  if (cp) { navigator.clipboard?.writeText(cp.dataset.copy).then(() => { cp.textContent = "Copied"; setTimeout(() => cp.textContent = "Copy link", 1200); }).catch(() => {}); }
});
$("q").addEventListener("input", e => { st.q = e.target.value; reset(); });
$("mskills").addEventListener("input", e => { profile.skills = e.target.value.split(",").map(s => s.trim()).filter(Boolean); saveProfile(); render(); });
$("mwhere").addEventListener("input", e => { profile.where = e.target.value; saveProfile(); render(); });
$("mclear").addEventListener("click", () => { profile = { skills: [], levels: [], where: "" }; saveProfile(); $("mskills").value = ""; $("mwhere").value = ""; if (st.sort === "match") { st.sort = "auto"; $("sort").value = "auto"; } render(); });
$("sort").addEventListener("change", e => { st.sort = e.target.value; reset(); });
$("source").addEventListener("change", e => { st.source = e.target.value; reset(); });
$("newOnly").addEventListener("change", e => { st.newOnly = e.target.checked; reset(); });
$("unlisted").addEventListener("change", e => { st.unlisted = e.target.checked; reset(); });
$("savedOnly").addEventListener("change", e => { st.savedOnly = e.target.checked; reset(); });
$("more").addEventListener("click", () => { st.shown += PAGE; render(); });
$("theme").addEventListener("click", () => {
  const order = ["auto", "light", "dark"];
  const next = order[(order.indexOf(read(STORE.theme, "auto")) + 1) % 3];
  write(STORE.theme, next); applyTheme(next);
});
document.addEventListener("keydown", e => {
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $("q").focus(); }
});

try { saved = new Set(JSON.parse(read(STORE.saved, "[]"))); } catch { saved = new Set(); }
try { profile = { skills: [], levels: [], where: "", ...JSON.parse(read(STORE.profile, "{}")) }; } catch {}
applyTheme(read(STORE.theme, "auto"));
hero.viz = read("geo-radar-viz", "globe") === "radar" ? "radar" : "globe";
try { $("gbox").toggleAttribute("hidden", hero.viz !== "globe"); $("radar").toggleAttribute("hidden", hero.viz !== "radar"); document.querySelectorAll(".viz-tabs [data-viz]").forEach(b => b.setAttribute("aria-selected", b.dataset.viz === hero.viz)); } catch {}
st.group = GROUPS.some(([k]) => k === read(STORE.group, "")) ? read(STORE.group, "") : "role";
drawCloud();
let cloudT = 0; addEventListener("resize", () => { clearTimeout(cloudT); cloudT = setTimeout(drawCloud, 150); });
try { if (matchMedia("(max-width:860px)").matches) $("filters").open = false; } catch {}

Promise.all([
  fetch("data/feed.json", { cache: "no-store" }).then(r => r.json()),
  fetch("data/status.json", { cache: "no-store" }).then(r => r.json()).catch(() => ({})),
  fetch("/api/ai").then(r => r.ok ? r.json() : {}).catch(() => ({})),
  fetch("/api/prog").then(r => r.ok ? r.json() : {}).catch(() => ({})),
  fetch("data/researchers.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null),
]).then(([f, s, ai, prog, ppl]) => {
  PEOPLE = ppl && Array.isArray(ppl.researchers) && ppl.researchers.length ? ppl : null;
  feed = f; status = s; AI = ai && typeof ai === "object" ? ai : {}; PROG = prog && typeof prog === "object" ? prog : {};
  feed.items.forEach(it => { const a = AI[it.id]; if (a && a.summary && !it.summary) it.summary = a.summary; });
  feed.items.forEach(classify);
  try { const m = location.hash.match(/d=([a-z]+)(?:&s=([^&]+))?/); if (m && DOM[m[1]]) { st.domain = m[1]; st.sub = m[2] ? decodeURIComponent(m[2]) : ""; } } catch {}
  const names = [...new Set(feed.items.map(i => i.source_name))].sort();
  $("source").innerHTML += names.map(n => `<option>${esc(n)}</option>`).join("");
  $("meta").textContent = `${feed.items.length} live items, last updated ${new Date(feed.generated_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}. The radar refreshes every hour.`;
  renderHero(); render(); motionInit();
}).catch(() => { $("count").textContent = "Feed not available yet."; });
