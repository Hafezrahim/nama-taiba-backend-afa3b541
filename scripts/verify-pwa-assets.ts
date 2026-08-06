/**
 * CI guard for PWA / install branding.
 *
 * Fails the build when:
 *  1. Any icon / splash / manifest / shortcut asset referenced by index.html,
 *     manifest.webmanifest, or app source (install banner, install page) is
 *     missing or empty.
 *  2. Required installation meta tags are absent from index.html.
 *  3. Any branded icon does not visually match the Nama Taiba logo
 *     (perceptual hash comparison against public/uploads/logo.png).
 *  4. (Optional) A running dev/preview server does not serve every referenced
 *     URL with HTTP 200 — enabled by setting PWA_VERIFY_URL, e.g.
 *     PWA_VERIFY_URL=http://localhost:8080 bun run verify:pwa
 *
 * Runs against the built output (dist/) when present, otherwise against the
 * source (index.html + public/), so it works both in CI and locally.
 */
import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

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
const failures: string[] = [];

/* ------------------------------------------------------------------ *
 * 1. Required installation meta tags
 * ------------------------------------------------------------------ */
const requiredTags: { label: string; re: RegExp }[] = [
  { label: 'link rel="manifest"', re: /<link[^>]+rel\s*=\s*"manifest"[^>]*>/i },
  { label: 'link rel="icon"', re: /<link[^>]+rel\s*=\s*"icon"[^>]*>/i },
  { label: 'link rel="apple-touch-icon"', re: /<link[^>]+rel\s*=\s*"apple-touch-icon"[^>]*>/i },
  { label: 'meta name="theme-color"', re: /<meta[^>]+name\s*=\s*"theme-color"[^>]*>/i },
  { label: 'meta name="apple-mobile-web-app-capable"', re: /<meta[^>]+name\s*=\s*"apple-mobile-web-app-capable"[^>]*>/i },
  { label: 'meta name="apple-mobile-web-app-title"', re: /<meta[^>]+name\s*=\s*"apple-mobile-web-app-title"[^>]*>/i },
  { label: 'meta name="application-name"', re: /<meta[^>]+name\s*=\s*"application-name"[^>]*>/i },
];
for (const { label, re } of requiredTags) {
  if (!re.test(html)) failures.push(`META  missing required install meta tag: ${label}`);
}

/* ------------------------------------------------------------------ *
 * 2. Collect referenced assets
 * ------------------------------------------------------------------ */
type Ref = { url: string; source: string; brandIcon?: boolean };
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
  if (!isAsset) continue;
  const brandIcon = /rel\s*=\s*"(icon|apple-touch-icon)"/i.test(tag);
  refs.push({ url, source: "index.html", brandIcon });
}

// Manifest icons, shortcut icons and screenshots
const manifestRef = refs.find((r) => r.url.endsWith(".webmanifest") || r.url.endsWith("manifest.json"));
if (manifestRef) {
  const manifestFile = path.join(assetDir, manifestRef.url.replace(/^\//, ""));
  if (existsSync(manifestFile)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
      for (const icon of manifest.icons ?? []) {
        if (icon?.src) refs.push({ url: icon.src, source: "manifest icons", brandIcon: true });
      }
      for (const shortcut of manifest.shortcuts ?? []) {
        for (const icon of shortcut?.icons ?? []) {
          if (icon?.src) refs.push({ url: icon.src, source: `manifest shortcut "${shortcut.name ?? "?"}"`, brandIcon: true });
        }
      }
      for (const shot of manifest.screenshots ?? []) {
        if (shot?.src) refs.push({ url: shot.src, source: "manifest screenshots" });
      }
    } catch {
      console.error(`[pwa-assets] manifest is not valid JSON: ${manifestFile}`);
      process.exit(1);
    }
  }
}

// Icon URLs referenced from app source (install banner, install page, etc.)
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const srcDir = path.join(ROOT, "src");
if (existsSync(srcDir)) {
  for (const file of walk(srcDir)) {
    const code = readFileSync(file, "utf8");
    for (const m of code.matchAll(/["'`](\/(?:icon|apple-touch-icon|favicon|splash\/)[^"'`]*\.(?:png|svg|ico))["'`]/g)) {
      refs.push({ url: m[1], source: path.relative(ROOT, file), brandIcon: true });
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Existence check
 * ------------------------------------------------------------------ */
const checked = new Set<string>();
const localFiles = new Map<string, string>();

for (const { url, source, brandIcon } of refs) {
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) continue;
  if (checked.has(url)) continue;
  checked.add(url);

  const file = path.join(assetDir, url.split("?")[0].replace(/^\//, ""));
  if (!existsSync(file) || !statSync(file).isFile()) {
    failures.push(`404  ${url}  (referenced by ${source})`);
    continue;
  }
  if (statSync(file).size === 0) {
    failures.push(`EMPTY ${url}  (referenced by ${source})`);
    continue;
  }
  if (brandIcon) localFiles.set(url, file);
}

/* ------------------------------------------------------------------ *
 * 4. Brand match — perceptual hash against the Nama Taiba logo
 * ------------------------------------------------------------------ */
function decodePng(buf: Buffer): { w: number; h: number; px: (x: number, y: number) => [number, number, number, number] } | null {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  let off = 8;
  let w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat: Buffer[] = [];
  let palette: Buffer | null = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === "PLTE") palette = Buffer.from(data);
    else if (type === "IDAT") idat.push(Buffer.from(data));
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (!w || !h || bitDepth !== 8 || interlace !== 0) return null;
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : colorType === 3 ? 1 : 0;
  if (!channels) return null;

  let raw: Buffer;
  try { raw = zlib.inflateSync(Buffer.concat(idat)); } catch { return null; }

  const stride = w * channels;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      const x = line[i];
      let v: number;
      switch (filter) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: return null;
      }
      cur[i] = v & 0xff;
    }
  }

  const px = (x: number, y: number): [number, number, number, number] => {
    const i = y * stride + x * channels;
    if (colorType === 6) return [out[i], out[i + 1], out[i + 2], out[i + 3]];
    if (colorType === 2) return [out[i], out[i + 1], out[i + 2], 255];
    if (colorType === 0) return [out[i], out[i], out[i], 255];
    if (colorType === 4) return [out[i], out[i], out[i], out[i + 1]];
    if (colorType === 3 && palette) {
      const p = out[i] * 3;
      return [palette[p], palette[p + 1], palette[p + 2], 255];
    }
    return [0, 0, 0, 255];
  };
  return { w, h, px };
}

const HASH = 8;
function phash(file: string): number[] | null {
  const img = decodePng(readFileSync(file));
  if (!img) return null;
  const cells: number[] = [];
  for (let gy = 0; gy < HASH; gy++) {
    for (let gx = 0; gx < HASH; gx++) {
      const x0 = Math.floor((gx * img.w) / HASH), x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * img.w) / HASH));
      const y0 = Math.floor((gy * img.h) / HASH), y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * img.h) / HASH));
      let sum = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const [r, g, b, a] = img.px(x, y);
          // Composite onto white so transparent and opaque variants compare alike.
          const al = a / 255;
          sum += (0.299 * r + 0.587 * g + 0.114 * b) * al + 255 * (1 - al);
          n++;
        }
      }
      cells.push(sum / n);
    }
  }
  const mean = cells.reduce((a, b) => a + b, 0) / cells.length;
  return cells.map((v) => (v >= mean ? 1 : 0));
}

const logoPath = [
  path.join(assetDir, "uploads/logo.png"),
  path.join(ROOT, "public/uploads/logo.png"),
].find(existsSync);

let brandChecked = 0;
if (!logoPath) {
  failures.push("BRAND missing reference logo at public/uploads/logo.png");
} else {
  const logoHash = phash(logoPath);
  if (!logoHash) {
    failures.push(`BRAND could not decode reference logo ${logoPath}`);
  } else {
    const MAX_DISTANCE = 22; // of 64 bits — tolerant of padding/background variants
    for (const [url, file] of localFiles) {
      if (!file.endsWith(".png")) continue;
      const h = phash(file);
      if (!h) { failures.push(`BRAND could not decode icon ${url}`); continue; }
      const distance = h.reduce((acc, bit, i) => acc + (bit === logoHash[i] ? 0 : 1), 0);
      brandChecked++;
      if (distance > MAX_DISTANCE) {
        failures.push(`BRAND ${url} does not match the Nama Taiba logo (hamming ${distance}/64 > ${MAX_DISTANCE})`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 5. Optional live HTTP 200 check (dev or production URL)
 * ------------------------------------------------------------------ */
const liveBase = process.env.PWA_VERIFY_URL?.replace(/\/$/, "");
async function checkLive() {
  if (!liveBase) return;
  for (const url of checked) {
    if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) continue;
    try {
      const res = await fetch(`${liveBase}${url}`, { redirect: "follow" });
      if (res.status !== 200) failures.push(`HTTP ${res.status}  ${liveBase}${url}`);
    } catch (err) {
      failures.push(`HTTP ERR ${liveBase}${url} — ${(err as Error).message}`);
    }
  }
  console.log(`[pwa-assets] live-checked ${checked.size} URL(s) against ${liveBase}`);
}

await checkLive();

console.log(
  `[pwa-assets] checked ${checked.size} asset(s) in ${path.relative(ROOT, assetDir) || "."}; ` +
    `${requiredTags.length} meta tag(s); ${brandChecked} branded icon(s) vs logo`,
);

if (failures.length) {
  console.error("[pwa-assets] FAILED:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}

console.log("[pwa-assets] OK — meta tags, asset URLs and logo branding all verified.");
