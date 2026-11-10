// ---------- motion: pointer spotlight on cards, count-up on first paint, content swap, back-to-top ----------
const calmMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Re-run the short entrance on the content column after a tab or domain change.
function swap() { if (calmMotion) return; const el = document.querySelector(".main"); if (!el) return; el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
function countUp(el) {
  const to = parseInt(el.textContent.replace(/\D/g, ""), 10); if (!Number.isFinite(to) || to < 2) return;
  const t0 = performance.now(), ms = 900;
  const step = now => { const k = Math.min(1, (now - t0) / ms), e = 1 - (1 - k) ** 3; el.textContent = Math.round(to * e); if (k < 1 && el.isConnected) requestAnimationFrame(step); else if (el.isConnected) el.textContent = to; };
  requestAnimationFrame(step);
}
function motionInit() {
  if (!calmMotion) document.querySelectorAll("#pulse b, .tbig b").forEach(countUp);
  if (matchMedia("(hover:hover)").matches) document.addEventListener("pointermove", e => {
    const c = e.target.closest?.(".tile,.ptile,.person"); if (!c) return;
    const b = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - b.left) + "px"); c.style.setProperty("--my", (e.clientY - b.top) + "px");
  }, { passive: true });
  const top = document.createElement("button"); top.className = "totop"; top.type = "button"; top.setAttribute("aria-label", "Back to top"); top.textContent = "↑";
  top.onclick = () => scrollTo({ top: 0, behavior: calmMotion ? "auto" : "smooth" }); document.body.appendChild(top);
  const tabs = document.querySelector(".tabs"); let tick = 0;
  addEventListener("scroll", () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; top.classList.toggle("on", scrollY > tabs.offsetTop + 600); }); }, { passive: true });
}
