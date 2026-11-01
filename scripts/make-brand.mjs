// Renders brand images from site/brand/mark.svg with Playwright:
// og.png (1200x630), apple-touch-icon.png (180), icon-512.png.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.resolve(".");
const mark = fs.readFileSync("site/brand/mark.svg", "utf8");
const font = (f) => "file://" + path.join(root, "site/fonts", f);
const contours = (() => {
  let p = "";
  for (let i = 0; i < 22; i++) {
    const r = 40 + i * 24, ph = i * 0.42; let d = "";
    for (let a = 0; a <= 90; a++) {
      const t = (a / 90) * Math.PI * 2;
      const rr = r * (1 + 0.1 * Math.sin(2 * t + ph) + 0.06 * Math.sin(3 * t - ph * 1.7) + 0.035 * Math.sin(5 * t + ph));
      d += (a ? "L" : "M") + (860 + rr * 1.2 * Math.cos(t)).toFixed(1) + " " + (300 + rr * 0.82 * Math.sin(t)).toFixed(1);
    }
    p += `<path d="${d}Z" opacity="${(0.25 + (i % 5 === 0 ? 0.5 : 0)).toFixed(2)}" stroke-width="${i % 5 === 0 ? 2 : 1.2}"/>`;
  }
  return p;
})();
const og = `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:F;src:url(${font("fraunces.woff2")});font-weight:100 900}
@font-face{font-family:I;src:url(${font("inter.woff2")});font-weight:100 900}
body{margin:0;width:1200px;height:630px;background:radial-gradient(90% 120% at 15% 0,#12293b,#08111a 70%);position:relative;overflow:hidden;font-family:I;color:#eaf2f7}
svg.map{position:absolute;inset:0;width:1200px;height:630px;fill:none;stroke:url(#g)}
.sweep{position:absolute;left:860px;top:300px;width:900px;height:900px;margin:-450px 0 0 -450px;background:conic-gradient(from 300deg,rgba(95,224,201,0) 0deg,rgba(95,224,201,.22) 50deg,rgba(95,224,201,0) 51deg);border-radius:50%}
.m{position:absolute;left:72px;top:64px;width:84px;height:84px}
h1{position:absolute;left:72px;top:210px;margin:0;font:500 148px/1 F;font-variation-settings:"opsz" 144;letter-spacing:-.02em}
p{position:absolute;left:76px;top:392px;margin:0;width:640px;font:500 34px/1.3 F;font-variation-settings:"opsz" 36;color:#cfe0ea}
.u{position:absolute;left:76px;bottom:56px;font:600 26px I;color:#8fa5b4}
.dot{position:absolute;left:820px;top:200px;width:26px;height:26px;border-radius:50%;background:#ffb454;box-shadow:0 0 0 10px rgba(255,180,84,.2),0 0 40px rgba(255,180,84,.7)}
.d2{left:1000px;top:360px;background:#c58bff;box-shadow:0 0 0 8px rgba(197,139,255,.2),0 0 30px rgba(197,139,255,.6);width:20px;height:20px}
.d3{left:700px;top:430px;background:#4fd1c5;box-shadow:0 0 0 8px rgba(79,209,197,.2),0 0 30px rgba(79,209,197,.6);width:18px;height:18px}
</style>
<svg class=map viewBox="0 0 1200 630"><defs><linearGradient id=g x1=0 y1=0 x2=1 y2=1><stop offset=0 stop-color="#5fe0c9"/><stop offset=.6 stop-color="#6ea8ff"/><stop offset=1 stop-color="#c58bff"/></linearGradient></defs>${contours}</svg>
<div class=sweep></div><div class="dot"></div><div class="dot d2"></div><div class="dot d3"></div>
<div class=m>${mark}</div><h1>Geo Radar</h1><p>Open deadlines in photogrammetry, remote sensing and geoinformatics.</p><div class=u>geoacademic.app</div>`;
fs.writeFileSync("/tmp/og.html", og);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
await pg.goto("file:///tmp/og.html"); await pg.waitForTimeout(500);
await pg.screenshot({ path: "site/brand/og.png" });
for (const [size, name] of [[180, "apple-touch-icon.png"], [512, "icon-512.png"]]) {
  const p2 = await b.newPage({ viewport: { width: size, height: size } });
  await p2.setContent(`<style>body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${mark}`);
  await p2.screenshot({ path: "site/brand/" + name, omitBackground: true }); await p2.close();
}
await b.close();
console.log("brand images written to site/brand");
