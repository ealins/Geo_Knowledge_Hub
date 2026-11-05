// ---------- researcher profile (metrics and links live here, not on the cards) ----------
function openProfile(id) {
  const P = PEOPLE, r = P.researchers.find(x => x.id === id); if (!r) return;
  let d = $("pdlg"); if (!d) { d = document.createElement("dialog"); d.id = "pdlg"; document.body.appendChild(d); d.addEventListener("click", e => { if (e.target === d) d.close(); }); }
  const fIdxOf = f => P.fields.findIndex(x => x.id === f) * 47 + 215;
  const fn = Object.fromEntries(P.fields.map(f => [f.id, f.name.split(" and ")[0]]));
  const where = [r.institution, r.country && REGION ? REGION.of(r.country) : r.country].filter(Boolean).join(", ");
  const links = [...(r.links || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name || "Website")}</a>`),
    `<a href="https://openalex.org/${esc(r.id)}" target="_blank" rel="noopener noreferrer">Publications</a>`,
    r.orcid ? `<a href="${esc(r.orcid)}" target="_blank" rel="noopener noreferrer">ORCID</a>` : "",
    r.collab?.length ? `<button type="button" data-net="${esc(r.id)}" id="pnetbtn">Co-author network</button>` : ""].join("");
  d.innerHTML = `<button class="pclose" type="button" id="pclose">Close</button><h3>${esc(r.name)}</h3>${r.position ? `<p class="pr">${esc(r.position)}</p>` : ""}<p class="pi">${esc([r.department, where].filter(Boolean).join(", "))}</p>
    <div class="pmet"><div><b>${r.h_index}</b><span>h-index</span></div><div><b>${compact(r.cited_by)}</b><span>citations</span></div><div><b>${compact(r.works)}</b><span>works</span></div></div>
    <h4>Fields</h4><div class="pl">${r.fields.map(f => `<span class="pf" style="--ph:${fIdxOf(f)}">${esc(fn[f])}</span>`).join("")}</div>
    <h4>Expertise</h4><p class="pi" style="color:var(--text)">${r.expertise.map(esc).join(" · ")}</p>
    <h4>Find them</h4><div class="pl">${links}</div>
    <p class="pnote">Metrics come from OpenAlex and are indicators, not a ranking. Job titles and web links come from the researcher's own public ORCID record. To contact them, use the institution page or ORCID: this site does not collect email addresses.</p>`;
  $("pclose").onclick = () => d.close();
  if (!d.open) d.showModal();
}
document.addEventListener("click", e => { if (e.target.closest("a,button")) return; const c = e.target.closest("[data-prof]"); if (c) openProfile(c.dataset.prof); });
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.("[data-prof]")) openProfile(e.target.dataset.prof); });

