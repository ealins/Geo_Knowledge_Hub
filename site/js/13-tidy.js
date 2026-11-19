// ---------- domain slider ----------
// Horizontal domain slider pinned under the tabs, so the domain can be changed from anywhere on the page.
{
  const nav = document.querySelector("nav.tabs");
  const box = document.createElement("div");
  box.className = "domslide"; box.id = "domslide"; box.setAttribute("role", "group"); box.setAttribute("aria-label", "Browse by domain");
  nav.appendChild(box);
  const render = () => {
    const people = st.kind === "people";
    box.hidden = people;
    if (people) return;
    const pool = filtered(true, true), prev = box.scrollLeft;
    box.innerHTML = `<button class="dchip" data-dom="" aria-pressed="${!st.domain}"><i class="d" style="--dc:var(--faint)"></i>All domains</button>` +
      DOMAINS.map(x => {
        const n = pool.filter(it => it._d.has(x.id)).length;
        if (!n && st.domain !== x.id) return "";
        return `<button class="dchip" data-dom="${x.id}" style="--dc:${x.color}" aria-pressed="${st.domain === x.id}"><i class="d"></i>${esc(x.name.replace(" and ", " & "))}<em>${n}</em></button>`;
      }).join("");
    box.scrollLeft = prev;
    const a = box.querySelector('.dchip[aria-pressed="true"]');
    if (a) queueMicrotask(() => {
      const l = a.offsetLeft - 16, r = a.offsetLeft + a.offsetWidth + 16;
      if (l < box.scrollLeft || r > box.scrollLeft + box.clientWidth) box.scrollTo({ left: Math.max(0, l), behavior: calmMotion ? "auto" : "smooth" });
    });
  };
  const baseTree = renderTree;
  renderTree = () => { baseTree(); render(); };
}

// Shorter notes on the researcher pages: no data-source details.
{
  const note = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };
  const basePeople = renderPeople;
  renderPeople = () => {
    basePeople();
    note("#overview .mxnote", `Ranked by papers since ${PEOPLE.since} and citation record. Updated ${new Date(PEOPLE.generated_at).toLocaleDateString([], { dateStyle: "medium" })}.`);
  };
  const baseProfile = openProfile;
  openProfile = id => { baseProfile(id); note("#pdlg .pnote", "Metrics are indicators, not a ranking. To contact them, use the institution page or ORCID: this site does not collect email addresses."); };
  const baseNet = openNet;
  openNet = id => { baseNet(id); const el = document.querySelector("#netdlg .netnote"); if (el) el.textContent = el.textContent.replace(/\s*Source: OpenAlex\.?$/, ""); };
}
