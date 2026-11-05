function renderPeople() {
  for (const id of ["where", "dhead", "board", "list"]) $(id).innerHTML = "";
  $("more").hidden = true;
  const P = PEOPLE, q = st.q.trim().toLowerCase();
  const fIdx = Object.fromEntries(P.fields.map((f, i) => [f.id, i]));
  const hue = id => fIdx[id] * 47 + 215;
  let ppl = P.researchers.filter(r => (!st.pfield || r.fields.includes(st.pfield)) &&
    (!q || [r.name, r.position || "", r.institution, r.country, REGION?.of(r.country) || "", ...r.expertise].join(" ").toLowerCase().includes(q)));
  const sur = n => n.trim().split(/\s+/).pop().toLowerCase();
  ppl = ppl.sort((a, b) => sur(a.name).localeCompare(sur(b.name)) || a.name.localeCompare(b.name)); // alphabetical by surname: no implied ranking
  const chips = `<div class="wrow"><span class="wlabel">Field</span><button class="wpill" data-pf="" aria-pressed="${!st.pfield}">All fields<i>${P.researchers.length}</i></button>` +
    P.fields.map(f => `<button class="wpill" data-pf="${f.id}" aria-pressed="${st.pfield === f.id}">${esc(f.name.split(" and ")[0])}<i>${P.researchers.filter(r => r.fields.includes(f.id)).length}</i></button>`).join("") + "</div>";
  const fb = st.pfield && P.fields.find(f => f.id === st.pfield);
  const cards = ppl.map(r => {
    const f0 = st.pfield || r.fields[0], ini = r.name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const where = [r.institution, REGION && r.country ? REGION.of(r.country) : r.country].filter(Boolean).join(", ");
    return `<article class="person" tabindex="0" data-prof="${esc(r.id)}" style="--ph:${hue(f0)}">
      <div class="pav" aria-hidden="true">${esc(ini)}</div>
      <div class="pbody">
        <h3>${esc(r.name)}</h3>
        ${r.position ? `<p class="prole">${esc(r.position)}</p>` : ""}
        <p class="pinst">${esc(where) || "Institution not listed"}</p>
        <div class="pfields">${r.fields.map(id => `<button class="pf" data-pf="${id}" style="--ph:${hue(id)}">${esc(P.fields[fIdx[id]].name.split(" and ")[0])}</button>`).join("")}</div>
        <p class="pexp">${r.expertise.map(esc).join(" · ")}</p>
        <div class="plinks">${r.collab?.length ? `<button class="pnet" data-net="${esc(r.id)}">Network</button>` : ""}<a href="https://openalex.org/${esc(r.id)}" target="_blank" rel="noopener noreferrer">Publications</a>${r.orcid ? `<a href="${esc(r.orcid)}" target="_blank" rel="noopener noreferrer">ORCID</a>` : ""}</div>
      </div></article>`;
  }).join("");
  $("overview").innerHTML = `<h2 class="sect">Researchers<small>${fb ? esc(fb.blurb) : "Researchers active in each field, listed alphabetically."}</small></h2>${chips}` +
    (cards ? `<div class="people">${cards}</div>` : '<div class="empty">No researchers match.</div>') +
    `<p class="mxnote">Ranked from OpenAlex by papers since ${P.since} and h-index. Public scholarly data only. Authors can be merged or split in OpenAlex, so check the profile. Updated ${new Date(P.generated_at).toLocaleDateString([], { dateStyle: "medium" })}.</p>`;
  $("count").textContent = `${ppl.length} researcher${ppl.length === 1 ? "" : "s"}${st.pfield ? " in " + P.fields[fIdx[st.pfield]].name : ""}`;
}

function render() {
  renderMatcher();
  renderWhere();
  renderStats();
  renderTree();
  if (st.kind === "people" && PEOPLE) { renderPeople(); return; }
  const board = st.domain && st.kind === "all" && !st.q.trim();
  const overview = !st.domain && st.kind === "all" && !st.q.trim();
  const items = sorted(filtered(false));
  const page = items.slice(0, st.shown);
  const filters = [st.continent, st.country, st.domain && DOM[st.domain].name, st.sub, st.topic && `topic “${st.topic}”`, st.source, st.newOnly && "new this week", st.savedOnly && "saved"].filter(Boolean);
  const nOpen = items.filter(i => NEEDS_DEADLINE.has(i.kind)).length;
  $("count").textContent = `${items.length} ${items.length === 1 ? "item" : "items"}${st.kind === "all" && nOpen && nOpen < items.length ? ` (${nOpen} to apply for, the rest papers and news)` : ""}${filters.length ? ", filtered by " + filters.join(", ") : ""}`;
  $("dhead").innerHTML = ""; $("overview").innerHTML = ""; $("board").innerHTML = "";
  if (st.domain) renderDomainHead();
  if (overview) renderOverview();
  const jobsView = st.kind === "job" && !st.q.trim();
  if (jobsView) $("overview").innerHTML = (!st.domain ? renderJobsOverview() : "") + groupBar();
  if (st.kind === "job" && st.group !== "time") {
    // Grouped positions: every group shows its first few, with "show all" per group.
    const count = {}, keys = new Set(), by = {};
    for (const it of items) { const k = groupKey(it, st.group); keys.add(k); count[k] = (count[k] || 0) + 1; (by[k] ||= []).push(it); }
    let gh = "";
    for (const k of groupOrder(st.group, keys, count)) {
      const its = by[k], open = openGroups.has(st.group + ":" + k);
      const dc = st.group === "field" ? (DOMAINS.find(d => d.name === k) || {}).color : "";
      gh += `<h2 class="group"${dc ? ` style="--dc:${dc}"` : ""}>${st.group === "field" ? '<i class="gdot"></i>' : ""}${esc(k)}<span>${its.length}</span></h2>` + (open ? its : its.slice(0, GROUP_N)).map(card).join("") +
        (its.length > GROUP_N ? `<button class="gmore" data-gopen="${esc(st.group + ":" + k)}">${open ? "Show fewer" : `Show all ${its.length}`}</button>` : "");
    }
    $("list").innerHTML = gh || '<div class="empty">Nothing matches these filters.</div>';
    $("more").hidden = true;
    return;
  }
  if (board) { renderBoard(); $("list").innerHTML = ""; $("more").hidden = true; return; }
  let html = "", last = "";
  for (const it of page) {
    const g = st.sort === "seen" ? bucket(it) : st.sort === "auto" ? section(it) : "";
    if (g && g !== last) { html += `<h2 class="group">${esc(g)}</h2>`; last = g; }
    html += card(it);
  }
  $("list").innerHTML = html || '<div class="empty">Nothing matches these filters.</div>';
  $("more").hidden = items.length <= st.shown;
}

function reset() { st.shown = PAGE; render(); }

document.addEventListener("click", e => { const b = e.target.closest("[data-pf]"); if (b) { st.pfield = b.dataset.pf; if (st.kind !== "people") st.kind = "people"; render(); } });

