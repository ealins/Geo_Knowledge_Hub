// ---------- co-author network (ego graph from the OpenAlex data in researchers.json) ----------
function openNet(id) {
  const P = PEOPLE, r = P.researchers.find(x => x.id === id); if (!r) return;
  const by = Object.fromEntries(P.researchers.map(x => [x.id, x]));
  let dlg = $("netdlg");
  if (!dlg) { dlg = document.createElement("dialog"); dlg.id = "netdlg"; document.body.appendChild(dlg); dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); }); }
  const fIdx = Object.fromEntries(P.fields.map((f, i) => [f.id, i])), hue = f => fIdx[f] * 47 + 215;
  const nodes = r.collab, W = 880, H = 560, cx = W / 2, cy = H / 2, max = Math.max(...nodes.map(n => n.n));
  const pos = nodes.map((n, i) => { const a = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2, rad = 150 + (1 - n.n / max) * 105, k = i % 2 ? 0.92 : 1;
    return { n, x: cx + Math.cos(a) * rad * 1.4 * k, y: cy + Math.sin(a) * rad * k }; });
  const cross = []; // links between co-authors that are also in the catalogue
  pos.forEach((a, i) => { const ra = by[a.n.id]; if (!ra?.collab) return; pos.forEach((b, j) => { if (j > i && ra.collab.some(c => c.id === b.n.id)) cross.push([a, b]); }); });
  const edge = (a, b, w, o) => `<line class="ne" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" style="stroke-width:${w};opacity:${o}"/>`;
  const me = { x: cx, y: cy };
  const svg = `<svg id="netsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Co-author network of ${esc(r.name)}">` +
    cross.map(([a, b]) => edge(a, b, 1.2, .3).replace('class="ne"', 'class="ne" stroke-dasharray="4 4"')).join("") +
    pos.map(p => edge(me, p, 1 + 5 * p.n.n / max, .4)).join("") +
    pos.map(p => { const c = by[p.n.id], col = c ? `hsl(${hue(c.fields[0])} 70% 55%)` : "var(--faint)", rad = 7 + 11 * p.n.n / max;
      const lab = p.n.name.length > 22 ? p.n.name.slice(0, 21) + "…" : p.n.name, right = p.x >= cx;
      return `<g class="nn" ${c ? `data-netgo="${esc(c.id)}" tabindex="0"` : `data-oa="${esc(p.n.id)}"`}><title>${esc(p.n.name)}: ${p.n.n} joint papers${c ? " (in this catalogue, click to open)" : ""}</title>
        <circle cx="${p.x}" cy="${p.y}" r="${rad}" fill="${col}" opacity="${c ? 1 : .55}"/><text x="${p.x + (right ? rad + 6 : -rad - 6)}" y="${p.y + 4}" text-anchor="${right ? "start" : "end"}">${esc(lab)}</text></g>`; }).join("") +
    `<circle cx="${cx}" cy="${cy}" r="30" fill="var(--accent)"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" style="font:700 15px var(--sans);fill:#fff">${esc(r.name.split(/\s+/).map(w => w[0]).slice(0, 2).join(""))}</text></svg>`;
  dlg.innerHTML = `<div class="nethead"><div><h3>${esc(r.name)}</h3><p>${esc([r.position, r.institution].filter(Boolean).join(", "))}</p></div><button class="netx" type="button" id="netclose">Close</button></div>` + svg +
    `<p class="netnote">Most frequent co-authors since ${P.since}. Line weight shows joint papers. Coloured dots are researchers in this catalogue (click to jump); grey dots are not. Dashed lines link co-authors who also publish together. Source: OpenAlex.</p>`;
  $("netclose").onclick = () => dlg.close();
  dlg.querySelectorAll("[data-netgo]").forEach(g => { const go = () => openNet(g.dataset.netgo); g.onclick = go; g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }; });
  dlg.querySelectorAll("[data-oa]").forEach(g => g.onclick = () => window.open("https://openalex.org/" + g.dataset.oa, "_blank", "noopener"));
  if (!dlg.open) dlg.showModal();
}
document.addEventListener("click", e => { const b = e.target.closest("[data-net]"); if (b) openNet(b.dataset.net); });
