// Quick safety net for the split site: builds, loads the page in a headless browser, clicks through every tab
// and the main dialogs, and fails on any page error. Usage: node scripts/smoke.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

execSync("node scripts/build.mjs", { stdio: "inherit" });
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const MIME = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const f = path.join("dist", decodeURIComponent(req.url.split("?")[0]) === "/" ? "index.html" : decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(f, (e, b) => e ? (res.writeHead(404), res.end()) : (res.writeHead(200, { "content-type": MIME[path.extname(f)] || "text/plain" }), res.end(b)));
}).listen(0);
const url = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [], notes = [];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", (e) => errors.push(`${w}px: ${e.message}`));
  await p.goto(url); await p.waitForTimeout(1200);
  const kinds = await p.$$eval("#stats [data-k]", (b) => b.map((x) => x.dataset.k));
  for (const k of kinds) { await p.click(`#stats [data-k="${k}"]`); await p.waitForTimeout(150); }
  notes.push(`${w}px: ${kinds.length} tabs, ${await p.$$eval("#tree .tnode", (n) => n.length)} domains`);
  if (kinds.includes("people")) {
    await p.click('#stats [data-k="people"]'); await p.waitForTimeout(200);
    await p.click(".person h3 >> nth=0"); await p.waitForTimeout(150);
    if (!(await p.evaluate(() => document.getElementById("pdlg")?.open))) errors.push(`${w}px: profile dialog did not open`);
    await p.keyboard.press("Escape");
  }
  await p.click("#support"); await p.waitForTimeout(150);
  if (!(await p.evaluate(() => document.getElementById("spdlg")?.open))) errors.push(`${w}px: sponsor dialog did not open`);
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push(`${w}px: sideways scroll`);
  await p.close();
}
await browser.close(); server.close();
console.log(notes.join("\n"));
if (errors.length) { console.error("SMOKE FAILED\n" + errors.join("\n")); process.exit(1); }
console.log("smoke ok");
