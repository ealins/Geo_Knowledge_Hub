import fs from "node:fs";
const j = await (await fetch("https://geoacademic.app/api/collected")).json();
const KW = /geo|earth|environment|spatial|sensing|mapping|\bmap\b|climate|satellite|surveying|civil|infrastructure|urban|computer vision|machine learning|\bai\b|data science|\b3d\b|remote|hydro|atmos|ocean|forest|terrain|navigation|lidar|photogramm|\bgis\b|radar|\bsar\b/i;
const JOBISH = /phd|postdoc|doctoral|research associate|research assistant|researcher|scientist|engineer|position|vacanc|wissenschaft|professor|lecturer|doctorate|fellow|developer|stelle/i;
const out = []; let total = 0, jobish = 0;
for (const p of j.pages) for (const l of p.links) { total++; const jb = JOBISH.test(l.t); if (jb) jobish++; if (KW.test(l.t) && jb) out.push(p.id + " | " + l.t.slice(0, 140)); }
fs.mkdirSync("diagout", { recursive: true }); fs.writeFileSync("diagout/collected2.json", JSON.stringify({ total, jobish, geoJobish: out.length, list: out }, null, 1));
