// ---------- Sponsor a pulse ----------
// Payment happens on Revolut / PayPal's own pages; this site never sees card data. The claim only stores name, city and a code.
const PAY = { revolut: "https://revolut.me/ealins", paypal: "https://www.paypal.com/donate/?business=QJ7QV7SEW87WU&currency_code=EUR&item_name=Geo+Radar+pulse" };
$("support").addEventListener("click", () => {
  let d = $("spdlg"); if (!d) { d = document.createElement("dialog"); d.id = "spdlg"; document.body.appendChild(d); d.addEventListener("click", e => { if (e.target === d) d.close(); }); }
  d.innerHTML = `<h3>Sponsor a pulse</h3><p>Geo Radar is free for everyone. Support it with any amount you like and your own gold pulse lights up on the globe, with your name and city.</p>
    <form id="spform"><label for="spn">Name or lab</label><input id="spn" maxlength="60" required autocomplete="off">
    <label for="spc">City, country</label><input id="spc" maxlength="60" required autocomplete="off">
    <label for="spu">Link (optional)</label><input id="spu" type="url" maxlength="200" placeholder="https://" autocomplete="off">
    <input class="hp" id="sph" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="spbtns"><button class="spbtn spgo" type="submit">Continue</button><button class="spbtn spalt" type="button" id="spx">Cancel</button></div></form>`;
  $("spx").onclick = () => d.close();
  $("spform").onsubmit = async e => {
    e.preventDefault(); const btn = e.submitter; btn.disabled = true;
    try {
      const r = await fetch("/api/pulse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: $("spn").value, city: $("spc").value, url: $("spu").value, hp: $("sph").value }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "failed");
      d.innerHTML = `<h3>Almost there</h3><p>Pay on either page below and put this code in the payment note, so I can match it to your pulse. I add new pulses by hand, usually within a day or two.</p>
        <div class="spcode">${esc(j.code)}</div><div class="spbtns"><a class="spbtn spgo" href="${PAY.revolut}" target="_blank" rel="noopener noreferrer">Pay with Revolut</a><a class="spbtn spalt" href="${PAY.paypal}" target="_blank" rel="noopener noreferrer">Pay with PayPal</a><button class="spbtn spalt" type="button" id="spx2">Close</button></div>`;
      $("spx2").onclick = () => d.close();
    } catch (err) { btn.disabled = false; alert("Could not save the claim. Please try again later."); }
  };
  d.showModal();
});

