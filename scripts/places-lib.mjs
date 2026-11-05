// Helpers for scripts/geocode.mjs: which institution or city does a feed item belong to?
const ORG_WORDS = /univers|hochschule|institut|college|fraunhofer|\bdlr\b|max[- ]planck|helmholtz|\beth\b|\btu\b|\bkit\b|research cent|laborator|academy|school of|observatory|survey/i;
const GENERIC_PLACE = /^(remote|hybrid|home ?office|deutschland|germany|united kingdom|uk|usa|united states|canada|netherlands|nederland|switzerland|schweiz|austria|österreich|australia|france|europe|worldwide|bundesweit|not stated)$/i;

const US_STATES = new Set("AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "));
const TRUSTED_CC = /^(adzuna|discovered-programmes|jobsac)/; // these sources end the location with an ISO country code
const DISTRICT = /^(altstadt|neustadt|innenstadt|stadtmitte|mitte|zentrum|nord|süd|ost|west|city centre|city center)$/i;

export function ccOf(location = "", source = "") {
  const last = location.split(",").pop().trim();
  if (!/^[A-Za-z]{2}$/.test(last)) return null;
  if (TRUSTED_CC.test(source)) return last.toUpperCase().replace(/^UK$/, "GB");
  return US_STATES.has(last.toUpperCase()) ? "US" : last.toUpperCase().replace(/^UK$/, "GB");
}

export function orgOf(it) {
  const loc = it.location || "";
  if (it.kind === "course" && it.source === "discovered-programmes") {
    // The whole location names the campus ("University of California, Los Angeles"), so keep it all but the country code.
    const cc = ccOf(loc, it.source);
    const name = (cc ? loc.replace(/,\s*[A-Za-z]{2}\s*$/, "") : loc).trim();
    return name.length > 3 ? { name, cc } : null;
  }
  if (it.kind === "job") {
    const name = (it.summary || "").split(/\.\s/)[0].trim();
    if (name.length > 3 && name.length < 90 && (/^jobsac/.test(it.source || "") || ORG_WORDS.test(name))) return { name, cc: ccOf(loc, it.source) };
  }
  return null;
}

export function cityOf(it) {
  const loc = it.location || "";
  if (!loc || it.kind === "paper" || it.kind === "news" || it.source === "collected") return null; // collected items carry the page name, not a place
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  const cc = ccOf(loc, it.source);
  const usable = parts.filter((p) => !GENERIC_PLACE.test(p) && !/^[A-Za-z]{2}$/.test(p));
  const name = DISTRICT.test(usable[0] || "") && usable[1] ? usable[1] : usable[0]; // "Altstadt, Weimar" means Weimar
  return name && name.length > 2 ? { name, cc } : null;
}

export const keyOf = (type, name, cc) => `${type}|${name.toLowerCase().replace(/\s+/g, " ")}|${cc || ""}`;
