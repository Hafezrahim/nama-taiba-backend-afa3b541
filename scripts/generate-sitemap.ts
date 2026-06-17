// Generates public/sitemap.xml at predev/prebuild time.
// Fetches published products, projects, and blog posts from Supabase
// and merges them with the static routes.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.nama-taiba.com";
const SUPABASE_URL = "https://zqpptzorxufrfdgwgxxr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxcHB0em9yeHVmcmZkZ3dneHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDYzMDAsImV4cCI6MjA3NTg4MjMwMH0.KUEkK5-6_de8vPUOtkA6IjEFMvn3qbCR4AkzXN5Ykwg";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const today = new Date().toISOString().slice(0, 10);

const staticEntries: SitemapEntry[] = [
  { path: "/", lastmod: today, changefreq: "daily", priority: "1.0" },
  { path: "/products", lastmod: today, changefreq: "daily", priority: "0.9" },
  { path: "/projects", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/services", lastmod: today, changefreq: "monthly", priority: "0.8" },
  { path: "/about", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/contact", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/blog", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/offers", lastmod: today, changefreq: "daily", priority: "0.9" },
  { path: "/partners", lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/quality", lastmod: today, changefreq: "monthly", priority: "0.6" },
  { path: "/install", lastmod: today, changefreq: "yearly", priority: "0.3" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function fetchRest(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] ${path} → ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (e) {
    console.warn(`[sitemap] fetch failed for ${path}:`, e);
    return [];
  }
}

async function getDynamicEntries(): Promise<SitemapEntry[]> {
  const [products, projects, blogs] = await Promise.all([
    fetchRest("products?select=name_en,updated_at&is_active=eq.true"),
    fetchRest("projects?select=title_en,updated_at&is_active=eq.true"),
    fetchRest("blogs?select=slug,title_en,updated_at&is_published=eq.true"),
  ]);

  const entries: SitemapEntry[] = [];

  for (const p of products) {
    const slug = slugify(p.name_en || "");
    if (!slug) continue;
    entries.push({
      path: `/products/${slug}`,
      lastmod: (p.updated_at || today).slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  for (const p of projects) {
    const slug = slugify(p.title_en || "");
    if (!slug) continue;
    entries.push({
      path: `/projects/${slug}`,
      lastmod: (p.updated_at || today).slice(0, 10),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  for (const b of blogs) {
    const slug = b.slug || slugify(b.title_en || "");
    if (!slug) continue;
    entries.push({
      path: `/blog/${slug}`,
      lastmod: (b.updated_at || today).slice(0, 10),
      changefreq: "weekly",
      priority: "0.6",
    });
  }

  return entries;
}

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

async function pingIndexNow(entries: SitemapEntry[]) {
  // Auto-submit to Bing/Yandex IndexNow after regenerating the sitemap.
  // Skipped unless INDEXNOW_AUTO_SUBMIT=1 (typically set in CI / build env).
  if (process.env.INDEXNOW_AUTO_SUBMIT !== "1") return;
  try {
    const urls = entries.map((e) => `${BASE_URL}${e.path}`);
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/indexnow-submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.INDEXNOW_TRIGGER_SECRET
            ? { "x-indexnow-secret": process.env.INDEXNOW_TRIGGER_SECRET }
            : {}),
        },
        body: JSON.stringify({ urls }),
      },
    );
    console.log(`[indexnow] auto-submit → HTTP ${res.status}`);
  } catch (e) {
    console.warn("[indexnow] auto-submit failed:", e);
  }
}

async function main() {
  const dynamic = await getDynamicEntries();
  const entries = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), renderSitemap(entries));
  console.log(
    `sitemap.xml written (${entries.length} entries: ${staticEntries.length} static + ${dynamic.length} dynamic)`,
  );
  await pingIndexNow(entries);
}

main();
