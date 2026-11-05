// Helpers for scripts/geocode.mjs: which institution or city does a feed item belong to?
const ORG_WORDS = /univers|hochschule|institut|college|fraunhofer|\bdlr\b|max[- ]planck|helmholtz|\beth\b|\btu\b|\bkit\b|research cent|laborator|academy|school of|observatory|survey/i;
const GENERIC_PLACE = /^(remote|hybrid|home ?office|deutschland|germany|united kingdom|uk|usa|united states|canada|netherlands|nederland|switzerland|schweiz|austria|österreich|australia|france|europe|worldwide|bundesweit|not stated)$/i;

export function ccOf(location = "") {
  const last = location.split(",").pop().trim();
  return /^[A-Za-z]{2}$/.test(last) ? last.toUpperCase().replace(/^UK$/, "GB") : null;
}

export function orgOf(it) {
  const loc = it.location || "";
  if (it.kind === "course" && it.source === "discovered-programmes") {
    const name = loc.split(",")[0].trim();
    return name.length > 3 ? { name, cc: ccOf(loc) } : null;
  }
  if (it.kind === "job") {
    const name = (it.summary || "").split(/\.\s/)[0].trim();
    if (name.length > 3 && name.length < 90 && (/^jobsac/.test(it.source || "") || ORG_WORDS.test(name))) return { name, cc: ccOf(loc) };
  }
  return null;
}

export function cityOf(it) {
  const loc = it.location || "";
  if (!loc || it.kind === "paper" || it.kind === "news") return null;
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  const cc = ccOf(loc);
  const name = parts.find((p) => !GENERIC_PLACE.test(p) && !/^[A-Za-z]{2}$/.test(p));
  return name && name.length > 2 ? { name, cc } : null;
}

export const keyOf = (type, name, cc) => `${type}|${name.toLowerCase().replace(/\s+/g, " ")}|${cc || ""}`;
