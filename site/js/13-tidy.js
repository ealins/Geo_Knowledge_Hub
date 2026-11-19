// ---------- plain wording and the domain slider ----------
// Plain-language names for the analysis field (the domain id stays "geoai", so saved links keep working).
(() => {
  const d = DOM.geoai;
  d.name = "Automated data analysis";
  d.blurb = "Computer methods that find patterns in imagery and spatial data: classification, detection and mapping at scale.";
  const rename = { "Deep learning": "Pattern recognition", "Foundation models": "Large-scale methods" };
  d.subs.forEach(s => { if (rename[s[0]]) s[0] = rename[s[0]]; });
  KIND_INFO.resource[1] = "Open datasets and code.";
})();
// Source names that still use the old wording.
{
  const baseClassify = classify;
  classify = it => { if (it.source_name) it.source_name = it.source_name.replace(/GeoAI/g, "data analysis"); baseClassify(it); };
}
// Radar view labels are drawn from a local table, so fix the one old word after each draw.
{
  const radar = document.getElementById("radar");
  if (radar && window.MutationObserver) {
    const fix = () => radar.querySelectorAll("text").forEach(t => { if (t.textContent === "GeoAI") t.textContent = "Data analysis"; });
    new MutationObserver(fix).observe(radar, { childList: true, subtree: true });
  }
}

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
