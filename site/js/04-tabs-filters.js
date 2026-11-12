function renderStats() {
  queueMicrotask(() => { const a = document.querySelector("#stats .tab[aria-pressed=true]"); const box = $("stats"); if (a && box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: Math.max(0, a.offsetLeft - 16), behavior: "smooth" }); });
  const pool = filtered(true);
  $("stats").innerHTML = KINDS.map(([k, label]) => {
    const items = k === "all" ? pool : pool.filter(i => i.kind === k);
    const fresh = items.filter(isNew).length;
    return `<button class="tab" data-k="${k}" aria-pressed="${st.kind === k}"><span class="tab-n">${items.length}</span><span class="tab-l">${label}</span>${fresh && fresh < items.length ? `<span class="tab-new" title="${fresh} new this week">${fresh} new</span>` : ""}</button>`;
  }).join("") + (PEOPLE ? `<button class="tab" data-k="people" aria-pressed="${st.kind === "people"}"><span class="tab-n">${PEOPLE.researchers.length}</span><span class="tab-l">Researchers</span></button>` : "");
}

function renderTree() {
  const pool = filtered(true, true);
  const subPool = st.domain ? filtered(true, false, true) : [];
  $("tree").innerHTML = `<button class="tnode" data-dom="" aria-pressed="${!st.domain}"><i class="d" style="--dc:var(--faint)"></i>All domains<em>${pool.length}</em></button>` +
    DOMAINS.map(d => {
      const n = pool.filter(it => it._d.has(d.id)).length;
      if (!n && st.domain !== d.id) return "";
      let subs = "";
      if (st.domain === d.id && d.subs.length) subs = '<div class="subs">' + d.subs.map(([l]) => {
        const c = subPool.filter(it => it._s.has(d.id + ":" + l)).length;
        return c || st.sub === l ? `<button class="snode" data-sub="${esc(l)}" aria-pressed="${st.sub === l}">${esc(l)}<em>${c}</em></button>` : "";
      }).join("") + "</div>";
      return `<button class="tnode" data-dom="${d.id}" style="--dc:${d.color}" aria-pressed="${st.domain === d.id}"><i class="d"></i>${esc(d.name.replace(" and ", " & "))}<em>${n}</em></button>${subs}`;
    }).join("");
}

function setDomain(id, sub) {
  st.domain = id; st.sub = sub || ""; if (id || st.kind !== "job") st.kind = "all"; st.shown = PAGE;
  try { history.replaceState(null, "", id ? "#d=" + id + (sub ? "&s=" + encodeURIComponent(sub) : "") : location.pathname); } catch {}
  render(); window.scrollTo({ top: Math.max(0, document.querySelector(".tabs").offsetTop - 1), behavior: "smooth" }); swap();
}

function renderOverview() {
  const pool = filtered(true, true);
  const tiles = DOMAINS.map(d => {
    const its = pool.filter(it => it._d.has(d.id));
    if (!its.length) return "";
    const by = k => its.filter(i => i.kind === k).length;
    const open = its.filter(i => NEEDS_DEADLINE.has(i.kind)).length;
    const nxt = its.filter(i => NEEDS_DEADLINE.has(i.kind) && i.deadline && Date.parse(i.deadline) >= Date.now() - 864e5).sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline))[0];
    const days = nxt ? Math.max(0, dayLeft(nxt.deadline)) : 0;
    return `<button class="tile" data-dom="${d.id}" style="--dc:${d.color}">
      <span class="tn">${esc(d.name)}</span><span class="tb">${esc(d.blurb)}</span>
      <span class="tbig"><b>${open}</b>open now</span>
      <span class="tk">${[["job", "Positions"], ["course", "Programmes"], ["event", "Events"], ["paper", "Papers"]].map(([k, l]) => by(k) ? `<span style="--k:var(--${k})">${by(k)} ${by(k) === 1 ? ({ job: "position", course: "programme", event: "event", paper: "paper" })[k] : l.toLowerCase()}</span>` : "").join("")}</span>
      ${nxt ? `<span class="tnext"><b>${days === 0 ? "Today" : days + (days === 1 ? " day" : " days")}</b> · ${esc(nxt.title)}</span>` : '<span class="tnext">No dated deadline right now</span>'}
    </button>`;
  }).join("");
  $("overview").innerHTML = `<section class="panel"><h2 class="sect">Browse by domain<small>${pool.length} live items across ${DOMAINS.length - 1} fields</small></h2><div class="tiles">${tiles}</div></section>`;
}

function renderJobsOverview() {
  const save = st.ptype; st.ptype = "";
  const pool = filtered(false, true, true).filter(it => it.kind === "job");
  st.ptype = save;
  const SHORT = { "PhD": "PhD", "Postdoc": "Postdoc", "Student and thesis": "Student", "Internship": "Intern", "Industry and other": "Industry" };
  const tiles = PTYPES.map(tp => {
    const its = pool.filter(it => ptypeOf(it) === tp);
    const sc = SECTORS.map(s => its.filter(it => sectorOf(it) === s).length);
    const n = its.length || 1;
    return `<button class="ptile" data-pt="${esc(tp)}" aria-pressed="${st.ptype === tp}">
      <span class="pn">${esc(tp)}</span><span class="pc">${its.length}<small>open</small></span>
      <span class="ps">${sc.map((c, i) => c ? `<i class="${SEC_CLASS[i]}" style="width:${(c / n * 100).toFixed(1)}%"></i>` : "").join("")}</span>
      <span class="pl">${sc.map((c, i) => c ? `${c} at ${["universities", "research centres or public bodies", "companies"][i]}` : "").filter(Boolean).join(", ") || "None open right now"}</span></button>`;
  }).join("");
  const rows = DOMAINS.map(d => ({ d, its: pool.filter(it => it._d.has(d.id)) })).filter(r => r.its.length);
  const cells = rows.flatMap(r => PTYPES.map(tp => r.its.filter(it => ptypeOf(it) === tp).length));
  const max = Math.max(1, ...cells);
  const table = `<table class="mx"><thead><tr><th class="f">Field</th>${PTYPES.map(tp => `<th><button data-mxd="" data-mxp="${esc(tp)}">${esc(SHORT[tp])}</button></th>`).join("")}<th>All</th></tr></thead><tbody>` +
    rows.map(r => `<tr><th class="f" style="--dc:${r.d.color}"><button data-mxd="${r.d.id}" data-mxp=""><i></i>${esc(r.d.name)}</button></th>` +
      PTYPES.map(tp => { const c = r.its.filter(it => ptypeOf(it) === tp).length;
        return `<td>${c ? `<button data-mxd="${r.d.id}" data-mxp="${esc(tp)}" style="--a:${(0.12 + 0.88 * c / max).toFixed(2)}" title="${c} ${esc(tp)} in ${esc(r.d.name)}">${c}</button>` : '<button class="z" style="--a:0" tabindex="-1">·</button>'}</td>`; }).join("") +
      `<td class="tot"><button data-mxd="${r.d.id}" data-mxp="" style="--a:0">${r.its.length}</button></td></tr>`).join("") + "</tbody></table>";
  return `<section class="panel"><h2 class="sect">Positions by type<small>Tap a type to open it.</small></h2>
    <div class="slegend">${SECTORS.map((s, i) => `<span><i class="${SEC_CLASS[i]}"></i>${esc(s)}</span>`).join("")}</div>
    <div class="ptiles">${tiles}</div></section>
    <section class="panel"><h2 class="sect">Field × type<small>Tap a number to see those positions.</small></h2>
    <div class="tablewrap">${table}</div><p class="mxnote">A position can belong to more than one field.</p></section>`;
}
function groupBar() {
  return `<div class="gbar"><span class="wlabel">Group by</span>${GROUPS.map(([k, l]) => `<button class="wpill" data-group="${k}" aria-pressed="${st.group === k}">${l}</button>`).join("")}</div>`;
}

function renderDomainHead() {
  const d = DOM[st.domain];
  const subPool = filtered(true, false, true);
  $("dhead").innerHTML = !d.subs.length ? "" : `<div class="panel dhead" style="--dc:${d.color}"><h2 class="sect">Topics in ${esc(d.name)}<small>Tap one to narrow the list.</small></h2>
    ${d.subs.length ? `<div class="subchips"><button class="chip" data-sub="" aria-pressed="${!st.sub}">All<i>${subPool.length}</i></button>` + d.subs.map(([l]) => {
      const c = subPool.filter(it => it._s.has(d.id + ":" + l)).length;
      return c || st.sub === l ? `<button class="chip" data-sub="${esc(l)}" aria-pressed="${st.sub === l}">${esc(l)}<i>${c}</i></button>` : "";
    }).join("") + "</div>" : ""}</div>`;
}

function renderBoard() {
  const COLS = [["job", "Positions"], ["course", "Programmes"], ["event", "Events"], ["paper", "Papers"]];
  const all = sorted(filtered(false));
  $("board").innerHTML = '<div class="board">' + COLS.map(([k, l]) => {
    const its = all.filter(i => i.kind === k);
    return `<section class="col" style="--k:var(--${k})"><div class="chead"><i></i>${l}<em>${its.length}</em></div>` +
      (its.length ? its.slice(0, 6).map(card).join("") + (its.length > 6 ? `<button class="colmore" data-k="${k}">See all ${its.length} ${l.toLowerCase()}</button>` : "") : `<div class="colempty">Nothing open in this area right now.</div>`) + "</section>";
  }).join("") + "</div>";
}

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function dayLeft(iso) { return Math.ceil((Date.parse(iso) - Date.now()) / 864e5); }
function tone(d) { return d <= 7 ? "hot" : d <= 30 ? "warm" : "calm"; }

function gauge(it) {
  if (it.kind === "resource") return { big: "Open", small: "data or tool", frac: 0, tone: "calm" };
  if (it.kind === "paper" && !it.call) {
    const v = Math.round(it.impact || 0);
    return { big: v || "–", small: v ? "impact" : "new", frac: Math.min(1, v / 100), tone: "ink" };
  }
  if (it.deadline && Date.parse(it.deadline) >= Date.now() - 864e5) {
    const d = Math.max(0, dayLeft(it.deadline));
    return { big: d === 0 ? "Today" : d, small: d === 1 ? "day left" : d === 0 ? "closes" : "days left", frac: Math.min(1, d / 60), tone: tone(d) };
  }
  if (it.kind === "event" && it.starts) {
    const s = new Date(it.starts);
    if (s < Date.now() && it.ends) { const e = new Date(it.ends); return { big: "Now", small: "until " + e.getDate() + " " + MON[e.getMonth()], frac: 0, tone: "event" }; }
    return { big: s.getDate(), small: MON[s.getMonth()] + " " + s.getFullYear(), frac: 0, tone: "event" };
  }
  if (it.open_posting) {
    const days = Math.max(0, Math.floor((Date.now() - Date.parse(it.published || it.first_seen)) / 864e5));
    return { big: "Open", small: days === 0 ? "posted today" : "posted " + days + "d ago", frac: Math.max(0, 1 - days / 45), tone: "calm" };
  }
  return { big: "–", small: it.apply_closed ? "intake closed" : "no deadline", frac: 0, tone: "none" };
}

function details(it) {
  const bits = [];
  if ((it.kind !== "paper" || it.call) && it.deadline && Date.parse(it.deadline) >= Date.now() - 864e5) bits.push(`<span class="strong">${it.kind === "event" || it.call ? "Call closes" : it.kind === "funding" ? "Apply by" : "Apply by"} ${fmt(it.deadline)}</span>`);
  if (it.call) bits.push("<span>Call for papers</span>");
  if (it.kind === "event" && it.starts) bits.push(`<span class="strong">${it.ends && it.ends !== it.starts ? fmt(it.starts) + " to " + fmt(it.ends) : fmt(it.starts)}</span>`);
  if (it.kind === "paper" && !it.call) {
    if (it.top_venue) bits.push('<span class="strong">Top venue</span>');
    if (it.venue) bits.push(`<span>${esc(it.venue)}</span>`);
    bits.push(`<span>${it.cited_by ? it.cited_by + (it.cited_by === 1 ? " citation" : " citations") : "Not cited yet"}</span>`);
    if (it.fwci != null) bits.push(`<span title="Field-weighted citation impact: 1.0 is the world average for papers of the same field and age">FWCI ${esc(it.fwci)}</span>`);
  }
  if (it.apply_closed) bits.push("<span>Current intake closed</span>");
  bits.push(progChips(it));
  if (it.location) bits.push(`<span>${esc(it.location)}</span>`);
  return bits.join("");
}

function card(it) {
  const s = saved.has(it.id), g = gauge(it);
  const kindName = (KINDS.find(k => k[0] === it.kind) || [, it.kind])[1];
  return `<article class="row" style="--k:var(--${esc(it.kind)})">
    <div class="gauge t-${g.tone}" aria-label="${esc(g.big + " " + g.small)}">
      <div class="ring" style="--f:${(g.frac * 100).toFixed(0)}%"><b class="${String(g.big).length > 3 ? "w" : ""}">${esc(g.big)}</b></div>
      <span>${esc(g.small)}</span>
    </div>
    <div class="body">
      <h3><a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h3>
      <div class="meta">
        ${st.kind === "all" ? `<span class="kind">${esc(kindName)}</span>` : ""}
        ${(() => { const m = matchScore(it); return m == null || m < 0.15 ? "" : `<span class="match${m < 0.5 ? " mid" : ""}">${Math.round(m * 100)}% match</span>`; })()}
        ${isNew(it) ? '<span class="new">New</span>' : ""}
        ${details(it)}
        ${/^Papers:/.test(it.source_name || "") ? "" : `<span class="src">${esc(it.source_name)}</span>`}
      </div>
      <div class="foot">
        ${(it.matched || []).filter(t => t !== "event").slice(0, 4).filter(t => t !== "event").map(t => `<button class="term" data-t="${esc(t)}">${esc(t)}</button>`).join("")}
        <span class="actions">
          <button class="act" data-copy="${esc(it.url)}">Copy link</button>
          <button class="act" data-save="${esc(it.id)}" aria-pressed="${s}">${s ? "Saved" : "Save"}</button>
        </span>
      </div>
    </div>
  </article>`;
}

const SECTIONS = ["Closing within a week", "Closing within a month", "Open for longer", "Upcoming events", "Open postings without a closing date", "Papers with the most impact", "Recent papers", "Open data and tools", "News", "Other"];
function section(it) {
  if (it.kind === "paper" && !it.call) return (it.impact || 0) >= 50 ? "Papers with the most impact" : "Recent papers";
  if (it.kind === "resource") return "Open data and tools";
  if (it.kind === "news") return "News";
  if (it.deadline && Date.parse(it.deadline) >= Date.now() - 864e5) {
    const d = dayLeft(it.deadline);
    return d <= 7 ? "Closing within a week" : d <= 30 ? "Closing within a month" : "Open for longer";
  }
  if (it.kind === "event" && upcoming(it)) return "Upcoming events";
  if (it.open_posting) return "Open postings without a closing date";
  return "Other";
}

