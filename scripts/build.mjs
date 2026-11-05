// Assemble the static site into dist/ (index.html + data/). Node 20+, no deps.
// site/index.html is the page skeleton; site/css/*.css and site/js/*.js are inlined in file-name order,
// so the deployed page is still one self-contained index.html.
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = path.join(ROOT, "site");

async function inline(dir, ext) {
  const files = (await readdir(path.join(SITE, dir))).filter((f) => f.endsWith(ext)).sort();
  const parts = await Promise.all(files.map((f) => readFile(path.join(SITE, dir, f), "utf8")));
  return parts.join("").replace(/\n$/, "");
}

const css = await inline("css", ".css");
const js = await inline("js", ".js");
let html = await readFile(path.join(SITE, "index.html"), "utf8");
if (!html.includes("<!-- @css -->") || !html.includes("<!-- @js -->")) throw new Error("site/index.html lost its @css or @js marker");
html = html.replace("<!-- @css -->", () => `<style>\n${css}\n</style>`).replace("<!-- @js -->", () => `<script>\n${js}\n</script>`);

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });
await writeFile(path.join(DIST, "index.html"), html);
await cp(path.join(SITE, "favicon.svg"), path.join(DIST, "favicon.svg"));
await cp(path.join(SITE, "vendor"), path.join(DIST, "vendor"), { recursive: true });
await cp(path.join(SITE, "brand"), path.join(DIST, "brand"), { recursive: true });
await cp(path.join(SITE, "fonts"), path.join(DIST, "fonts"), { recursive: true });
await cp(path.join(ROOT, "data"), path.join(DIST, "data"), { recursive: true });
await writeFile(path.join(DIST, ".nojekyll"), "");
console.log(`built ${DIST}`);
