/**
 * CI guard: fails the build when any PWA icon / splash / manifest asset
 * referenced by index.html or manifest.webmanifest is missing (non-200).
 *
 * Runs against the built output (dist/) when present, otherwise against the
 * source (index.html + public/), so it works both in CI and locally.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const useDist = existsSync(path.join(DIST, "index.html"));

const baseDir = useDist ? DIST : ROOT;
const assetDir = useDist ? DIST : path.join(ROOT, "public");
const htmlPath = path.join(baseDir, "index.html");

if (!existsSync(htmlPath)) {
  console.error(`[pwa-assets] index.html not found at ${htmlPath}`);
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");

type Ref = { url: string; source: string };
const refs: Ref[] = [];

const attrRe = /<(?:link|meta)\b[^>]*>/gi;
for (const tag of html.match(attrRe) ?? []) {
  const url =
    /\bhref\s*=\s*"([^"]+)"/i.exec(tag)?.[1] ??
    /\bcontent\s*=\s*"([^"]+)"/i.exec(tag)?.[1];
  if (!url) continue;
  const isAsset =
    /rel\s*=\s*"(icon|apple-touch-icon|apple-touch-startup-image|manifest)"/i.test(tag) ||
    /name\s*=\s*"msapplication-TileImage"/i.test(tag);
  if (isAsset) refs.push({ url, source: "index.html" });
}

// Manifest icons
const manifestRef = refs.find((r) => r.url.endsWith(".webmanifest") || r.url.endsWith("manifest.json"));
if (manifestRef) {
  const manifestFile = path.join(assetDir, manifestRef.url.replace(/^\//, ""));
  if (existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
      for (const icon of manifest.icons ?? []) {
        if (icon?.src) refs.push({ url: icon.src, source: "manifest.webmanifest" });
      }
      if (manifest.start_url) {
        // start_url is a route, not a file — skip file existence check.
      }
    } catch (err) {
      console.error(`[pwa-assets] manifest is not valid JSON: ${manifestFile}`);
      process.exit(1);
    }
  }
}

const failures: string[] = [];
const checked = new Set<string>();

for (const { url, source } of refs) {
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) continue; // external / inline
  const key = url;
  if (checked.has(key)) continue;
  checked.add(key);

  const file = path.join(assetDir, url.split("?")[0].replace(/^\//, ""));
  if (!existsSync(file) || !statSync(file).isFile()) {
    failures.push(`404  ${url}  (referenced by ${source})`);
    continue;
  }
  if (statSync(file).size === 0) {
    failures.push(`EMPTY ${url}  (referenced by ${source})`);
  }
}

console.log(`[pwa-assets] checked ${checked.size} asset(s) in ${path.relative(ROOT, assetDir) || "."}`);

if (failures.length) {
  console.error("[pwa-assets] FAILED — missing or empty PWA assets:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log("[pwa-assets] OK — all manifest/meta PWA assets resolve.");
