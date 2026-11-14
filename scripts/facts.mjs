// Programme facts read straight from a programme's own page: degree, teaching language,
// duration, ECTS and tuition. Only what the text states is returned; anything else stays empty.
// Rules are deliberately strict (a fact is wrong more often than it is missing when guessed).

const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, eins: 1, zwei: 2, drei: 3, vier: 4, "fünf": 5, sechs: 6 };
const LANGS = {
  english: "English", englisch: "English", german: "German", deutsch: "German", french: "French", "français": "French", francais: "French",
  spanish: "Spanish", "español": "Spanish", italian: "Italian", italiano: "Italian", dutch: "Dutch", nederlands: "Dutch",
  swedish: "Swedish", svenska: "Swedish", danish: "Danish", dansk: "Danish", finnish: "Finnish", suomi: "Finnish", portuguese: "Portuguese", polish: "Polish",
};
const CUR = "(?:€|EUR|USD|US\\$|\\$|£|GBP|CHF|SEK|DKK|NOK|CAD|AUD|NZD)";

export const textOf = (html) =>
  html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ").replace(/&euro;/g, "€").replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "-")
    .replace(/\s+/g, " ")
    .trim();

export function degreeOf(title = "", url = "") {
  const t = `${title} ${url}`;
  if (/\b(ph\.?\s?d|doctoral|doctorate|doktor)\b/i.test(t)) return "PhD";
  if (/certificate|zertifikat|(?<![a-z])cert(?![a-z])/i.test(t)) return "Certificate";
  if (/\b(m\.?\s?sc\.?|msc|m\.?\s?eng|master of science|master of engineering)\b/i.test(t)) return "MSc";
  if (/\bmaster/i.test(t)) return "Master";
  if (/\b(b\.?\s?sc\.?|bsc|bachelor|undergraduate)\b/i.test(t) || /(?<![a-z])b\.s\.?(?![a-z])/i.test(t)) return "BSc";
  return "";
}

export function languageOf(text) {
  const found = [];
  const re = /(language of instruction|languages of instruction|teaching language|medium of instruction|instruction language|course language|taught in|unterrichtssprache|studiensprache|lehrsprache|unterrichtet in|sprache des studiengangs|undervisningssprog)\s*(?:is|are|:|-|–|will be)?\s*([^.;|\n]{0,70})/gi;
  for (const m of text.matchAll(re)) {
    for (const w of m[2].toLowerCase().split(/[^\p{L}]+/u)) if (LANGS[w] && !found.includes(LANGS[w])) found.push(LANGS[w]);
    if (found.length) break;
  }
  return found.slice(0, 3).join(" and ").replace(/ and ([^ ]+) and /, ", $1 and ");
}

const unitOf = (u, n) => {
  u = u.toLowerCase();
  const base = /^(year|jahr)/.test(u) ? "year" : /^(semester)/.test(u) ? "semester" : /^(month|monat)/.test(u) ? "month" : /^(term|trimester|quarter)/.test(u) ? u.replace(/s$/, "") : "";
  return base ? `${n} ${base}${n === 1 ? "" : "s"}` : "";
};
export function durationOf(text) {
  const val = (s) => NUM[s.toLowerCase()] ?? Number(s.replace(",", "."));
  let m = text.match(/(?:duration|length of (?:the )?(?:programme|program|course|study|degree)|study duration|programme length|program length|dauer|regelstudienzeit|studiendauer|standard period of study|period of study|nominal duration|takes?|lasts?)[^.]{0,50}?(\d+(?:[.,]\d)?|one|two|three|four|five|six|eins|zwei|drei|vier|fünf|sechs)[\s-]*(years?|semesters?|terms?|months?|jahre?n?|semestern?|monate?n?|trimesters?|quarters?)/i);
  if (!m) m = text.match(/\b(\d+(?:[.,]\d)?|one|two|three|four|five|six)[\s-]*(years?|semesters?)[\s-]*(?:full-time |part-time )?(?:master|programme|program|course|degree|msc|bachelor|study)/i);
  if (!m) return "";
  const n = val(m[1]);
  return n > 0 && n <= (/^(month|monat)/i.test(m[2]) ? 60 : 12) ? unitOf(m[2].replace(/(jahre|jahren)$/i, "year").replace(/semestern$/i, "semester").replace(/monate[n]?$/i, "month"), n) : "";
}

export function ectsOf(text) {
  const vals = [...text.matchAll(/(\d{2,3})\s*(?:ECTS|credit points|leistungspunkte|\bLP\b|\bCP\b)/gi)].map((m) => Number(m[1])).filter((n) => n >= 30 && n <= 360);
  return vals.length ? Math.max(...vals) : 0;
}

export function tuitionOf(text) {
  if (/(no tuition fees?|tuition[- ]free|free of (?:tuition )?charge|no tuition|keine studiengeb[üu]hren|studiengeb[üu]hrenfrei)/i.test(text)) return "No tuition fees";
  const re = new RegExp(`(tuition(?: fees?)?|course fees?|programme fees?|program fees?|studiengeb[üu]hr(?:en)?)([^.]{0,80}?)((?:${CUR})\\s?\\d[\\d.,' ]*|\\d[\\d.,' ]*\\s?${CUR})(?:\\s*(?:per|/|a|each)\\s*(academic year|year|semester|credit hour|credit|term|month))?`, "gi");
  for (const m of text.matchAll(re)) {
    if (/application|bewerbung|registration|admin|deposit|late/i.test(m[0])) continue;
    const amount = m[3].replace(/\s+/g, " ").replace(/[.,' ]+$/, "").trim();
    return `${amount}${m[4] ? " per " + m[4] : ""}`.slice(0, 40);
  }
  return "";
}

export function extractFacts(html, { title = "", url = "" } = {}) {
  const text = textOf(html);
  const out = { degree: degreeOf(title, url), language: languageOf(text), duration: durationOf(text), ects: ectsOf(text), tuition: tuitionOf(text) };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v));
}
