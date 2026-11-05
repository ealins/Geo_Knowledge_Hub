function sorted(items) {
  const d = (x, k) => Date.parse(x[k] || 0) || 0;
  if (st.sort === "auto") {
    const rank = it => SECTIONS.indexOf(section(it));
    return items.sort((a, b) => rank(a) - rank(b)
      || (a.kind === "paper" && b.kind === "paper" && !a.call && !b.call ? (b.impact || 0) - (a.impact || 0)
        : a.open_posting && !a.deadline ? d(b, "published") - d(a, "published")
        : NEEDS_DEADLINE.has(a.kind) ? when(a) - when(b) : d(b, "first_seen") - d(a, "first_seen")));
  }
  if (st.sort === "match") return items.sort((a, b) => (matchScore(b) ?? -1) - (matchScore(a) ?? -1) || when(a) - when(b));
  if (st.sort === "published") return items.sort((a, b) => d(b, "published") - d(a, "published"));
  if (st.sort === "title") return items.sort((a, b) => a.title.localeCompare(b.title));
  return items.sort((a, b) => d(b, "first_seen") - d(a, "first_seen"));
}

function bucket(it) {
  const days = age(it) / 864e5;
  return days < 1 ? "Today" : days < 7 ? "This week" : days < 30 ? "This month" : "Earlier";
}

function paperLabel(it) {
  const bits = [];
  if (it.top_venue) bits.push("Top venue");
  if (it.venue) bits.push(esc(it.venue));
  bits.push(it.cited_by ? `cited ${it.cited_by}×` : "not yet cited");
  if (it.fwci != null) bits.push(`FWCI ${it.fwci}`);
  return `<span class="deadline">${bits.join(" · ")}</span>`;
}

function eventLabel(it) {
  const bits = [];
  if (it.deadline && Date.parse(it.deadline) >= Date.now()) {
    const days = Math.ceil((Date.parse(it.deadline) - Date.now()) / 864e5);
    bits.push(`<span class="deadline">Open · ${days <= 0 ? "closes today" : days === 1 ? "1 day left" : days + " days left"} · deadline ${fmt(it.deadline)}</span>`);
  }
  if (it.starts) bits.push(`<span>${it.ends && it.ends !== it.starts ? fmt(it.starts) + " – " + fmt(it.ends) : fmt(it.starts)}</span>`);
  return bits.join("") || '<span class="muted-tag">Date not listed</span>';
}

function openLabel(it) {
  if (it.kind === "paper" && !it.call) return it.impact ? paperLabel(it) : "";
  if (it.kind === "event") return eventLabel(it);
  if (it.deadline) {
    const days = Math.ceil((Date.parse(it.deadline) - Date.now()) / 864e5);
    const left = days <= 0 ? "closes today" : days === 1 ? "1 day left" : days + " days left";
    return `<span class="deadline">${it.call ? "Call for papers" : "Open"} · ${esc(left)} · deadline ${fmt(it.deadline)}</span>`;
  }
  if (it.open_posting) {
    const days = Math.max(0, Math.floor((Date.now() - Date.parse(it.published || it.first_seen)) / 864e5));
    return `<span class="deadline">Open posting · posted ${days === 0 ? "today" : days === 1 ? "1 day ago" : days + " days ago"} · no closing date</span>`;
  }
  if (it.apply_closed) return '<span class="muted-tag">Current intake closed</span>';
  return ["job", "course", "event", "funding"].includes(it.kind) ? '<span class="muted-tag">Deadline not listed</span>' : "";
}

