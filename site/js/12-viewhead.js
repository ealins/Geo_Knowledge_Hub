// ---------- view header: title, back control, removable filter chips and headline numbers for the open tab ----------
const KIND_INFO = {
  all: ["Everything", "Positions, programmes, events, papers, funding and tools in one place."],
  job: ["Positions", "PhD, postdoc, student and industry openings, refreshed every hour."],
  paper: ["Papers", "New publications and open calls for papers."],
  course: ["Programmes", "Degree programmes, summer schools and courses."],
  event: ["Events", "Conferences, workshops and challenges with their deadlines."],
  funding: ["Funding", "Open grants and calls for proposals."],
  resource: ["Resources", "Open datasets, code and models."],
  news: ["News", "Announcements from agencies, societies and labs."],
  people: ["Researchers", "Active researchers in each field, listed alphabetically."],
};
function activeFilters() {
  if (st.kind === "people") return st.pfield && PEOPLE ? [["pfield", (PEOPLE.fields.find(f => f.id === st.pfield) || {}).name || st.pfield]] : [];
  return [["domain", st.domain && DOM[st.domain].name], ["sub", st.sub], ["ptype", st.ptype], ["topic", st.topic && `Topic: ${st.topic}`], ["continent", st.continent], ["country", st.country],
    ["source", st.source], ["newOnly", st.newOnly && "New this week"], ["savedOnly", st.savedOnly && "Saved"], ["q", st.q.trim() && `“${st.q.trim()}”`]].filter(f => f[1]);
}
function toView() { window.scrollTo({ top: Math.max(0, document.querySelector(".tabs").offsetTop - 1), behavior: calmMotion ? "auto" : "smooth" }); }
function clearFilter(key) {
  const keys = key === "*" ? ["domain", "sub", "ptype", "topic", "continent", "country", "source", "newOnly", "savedOnly", "q", "pfield"] : key === "domain" ? ["domain", "sub"] : key === "continent" ? ["continent", "country"] : [key];
  for (const k of keys) st[k] = typeof st[k] === "boolean" ? false : "";
  $("q").value = st.q; $("source").value = st.source; $("newOnly").checked = st.newOnly; $("savedOnly").checked = st.savedOnly;
  if (keys.includes("domain")) { try { history.replaceState(null, "", location.pathname); } catch {} }
  reset(); if (key === "*") toView(); swap();
}
function renderViewHead(items) {
  const people = st.kind === "people", info = KIND_INFO[st.kind] || KIND_INFO.all, d = !people && st.domain ? DOM[st.domain] : null;
  const pt = !people && st.kind === "job" ? st.ptype : "";
  const fl = activeFilters(), week = Date.now() + 7 * 864e5;
  let stats;
  if (people) stats = [[items.length, items.length === 1 ? "researcher" : "researchers"], [PEOPLE.fields.length, "fields"], [new Set(items.map(r => r.institution).filter(Boolean)).size, "institutions"]];
  else {
    const dated = items.filter(i => NEEDS_DEADLINE.has(i.kind)), closing = dated.filter(i => i.deadline && Date.parse(i.deadline) >= Date.now() && Date.parse(i.deadline) <= week).length;
    const countries = new Set(items.map(countryOf).filter(Boolean)).size, fresh = items.filter(isNew).length;
    stats = [[items.length, st.kind === "job" ? "open positions" : items.length === 1 ? "item" : "items"]];
    if (dated.length) stats.push([closing, "closing in 7 days"]);
    stats.push([fresh, "new this week", "new"]);
    stats.push(countries > 1 ? [countries, "countries"] : [new Set(items.map(i => i.source_name || i.source)).size, "sources"]);
  }
  const all = people ? "All researchers" : st.kind === "all" ? "Overview" : "All " + info[0].toLowerCase();
  $("vhead").innerHTML = `<div class="vhead" style="--k:${d ? d.color : people ? "var(--accent)" : st.kind === "all" ? "var(--accent)" : `var(--${st.kind})`}">
    <div class="vh-l">
      ${fl.length ? `<button class="vback" data-clear="*"><span aria-hidden="true">←</span> ${esc(all)}</button>` : `<span class="vkick">${people || st.kind === "all" ? "Geo Radar" : "Browse"}</span>`}
      <h2 class="vtitle"><i></i>${esc(d ? d.name : pt || info[0])}${(d || pt) && st.kind !== "all" ? `<em>${esc(info[0])}</em>` : ""}</h2>
      <p class="vsub">${esc(d ? d.blurb : info[1])}</p>
      ${fl.length ? `<div class="vchips"><span class="wlabel">Filtered by</span>${fl.map(([k, l]) => `<button class="vchip" data-clear="${k}" aria-label="Remove filter ${esc(l)}">${esc(l)}<span aria-hidden="true">×</span></button>`).join("")}${fl.length > 1 ? '<button class="vclear" data-clear="*">Clear all</button>' : ""}</div>` : ""}
    </div>
    <div class="vh-r">${stats.map(([n, l, act]) => act ? `<button class="vstat" data-stat-new aria-pressed="${st.newOnly}" title="Show only items new this week"><b>${n}</b><span>${l}</span></button>` : `<div class="vstat"><b>${n}</b><span>${l}</span></div>`).join("")}</div>
  </div>`;
}
