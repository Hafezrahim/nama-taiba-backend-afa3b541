// Scheduled SEO crawler: fetches the site root, sitemap.xml, robots.txt,
// runs lightweight on-page checks, and stores a snapshot row in seo_snapshots.
// Auth: admin JWT OR `x-crawler-secret` header matching CRAWLER_SECRET env.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Check { label: string; status: 'pass' | 'warn' | 'fail'; detail?: string }

async function authorize(req: Request): Promise<boolean> {
  const headerSecret = req.headers.get('x-crawler-secret');
  const envSecret = Deno.env.get('CRAWLER_SECRET');
  if (envSecret && headerSecret === envSecret) return true;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return false;
  const { data: roles } = await supabase
    .from('user_roles').select('role').eq('user_id', data.claims.sub).eq('role', 'admin').eq('is_approved', true);
  return !!(roles && roles.length);
}

function scorePct(checks: Check[]): number {
  if (!checks.length) return 0;
  const w = checks.reduce((acc, c) => acc + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  return Math.round((w / checks.length) * 100);
}

async function safeFetch(url: string) {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(id);
    const text = await r.text();
    return { ok: r.ok, status: r.status, text, headers: r.headers };
  } catch (e) {
    return { ok: false, status: 0, text: '', headers: new Headers(), error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!(await authorize(req))) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const baseUrl: string = body.baseUrl || 'https://www.nama-taiba.com';
    const source: string = body.source || 'cron';

    const checks: Check[] = [];

    // 1. Fetch home page
    const home = await safeFetch(baseUrl);
    checks.push({ label: 'Home reachable', status: home.ok ? 'pass' : 'fail', detail: `HTTP ${home.status}` });

    // Parse basic SEO tags via regex
    const titleMatch = home.text.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || '';
    checks.push({
      label: 'Title tag',
      status: title.length >= 30 && title.length <= 60 ? 'pass' : title ? 'warn' : 'fail',
      detail: `${title.length} chars`,
    });

    const descMatch = home.text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const desc = descMatch?.[1] || '';
    checks.push({
      label: 'Meta description',
      status: desc.length >= 70 && desc.length <= 160 ? 'pass' : desc ? 'warn' : 'fail',
      detail: `${desc.length} chars`,
    });

    const canonical = /<link[^>]+rel=["']canonical["']/i.test(home.text);
    checks.push({ label: 'Canonical', status: canonical ? 'pass' : 'fail' });

    const ogTitle = /<meta[^>]+property=["']og:title["']/i.test(home.text);
    const ogImage = /<meta[^>]+property=["']og:image["']/i.test(home.text);
    checks.push({ label: 'Open Graph', status: ogTitle && ogImage ? 'pass' : ogTitle ? 'warn' : 'fail' });

    // 2. Structured data validity (JSON-LD parseable)
    const ldMatches = [...home.text.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    let sdValid = ldMatches.length > 0;
    for (const m of ldMatches) {
      try { JSON.parse(m[1]); } catch { sdValid = false; break; }
    }
    checks.push({
      label: 'Structured data',
      status: ldMatches.length === 0 ? 'fail' : sdValid ? 'pass' : 'fail',
      detail: `${ldMatches.length} JSON-LD blocks${sdValid ? '' : ' (invalid)'}`,
    });

    // 3. Verification meta tags present
    const verification = {
      google: /name=["']google-site-verification["']/i.test(home.text),
      bing: /name=["']msvalidate\.01["']/i.test(home.text),
      yandex: /name=["']yandex-verification["']/i.test(home.text),
      pinterest: /name=["']p:domain_verify["']/i.test(home.text),
    };

    // 4. Sitemap
    const sitemap = await safeFetch(`${baseUrl}/sitemap.xml`);
    const urlCount = (sitemap.text.match(/<url>/g) || []).length;
    const lastmodMatch = sitemap.text.match(/<lastmod>([^<]+)<\/lastmod>/);
    checks.push({
      label: 'Sitemap',
      status: sitemap.ok && urlCount > 0 ? 'pass' : 'fail',
      detail: sitemap.ok ? `${urlCount} URLs` : `HTTP ${sitemap.status}`,
    });

    // 5. robots.txt
    const robots = await safeFetch(`${baseUrl}/robots.txt`);
    const robotsHasSitemap = /^sitemap:/im.test(robots.text);
    const robotsBlocksAll = /user-agent:\s*\*[\s\S]*?disallow:\s*\/$/im.test(robots.text);
    checks.push({
      label: 'robots.txt',
      status: robots.ok && !robotsBlocksAll ? 'pass' : robots.ok ? 'fail' : 'warn',
      detail: robots.ok ? (robotsHasSitemap ? 'sitemap directive present' : 'no sitemap directive') : `HTTP ${robots.status}`,
    });

    // 6. HTTPS
    checks.push({ label: 'HTTPS', status: baseUrl.startsWith('https://') ? 'pass' : 'fail' });

    // 7. Security headers
    const xfo = home.headers.get('x-frame-options');
    const csp = home.headers.get('content-security-policy');
    checks.push({
      label: 'Security headers',
      status: xfo && csp ? 'pass' : xfo || csp ? 'warn' : 'fail',
      detail: [xfo && 'XFO', csp && 'CSP'].filter(Boolean).join(', ') || 'missing',
    });

    const onPageScore = scorePct(checks);

    // Persist snapshot
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: inserted, error: insertErr } = await admin.from('seo_snapshots').insert({
      source,
      on_page_score: onPageScore,
      checks,
      sitemap_urls: urlCount,
      sitemap_lastmod: lastmodMatch?.[1] || null,
      robots_ok: robots.ok && !robotsBlocksAll,
      structured_data_valid: sdValid,
      verification_status: verification,
      notes: `Crawled ${baseUrl}`,
    }).select().single();

    if (insertErr) console.error('insert snapshot failed', insertErr);

    return new Response(JSON.stringify({
      ok: true, snapshot: inserted, onPageScore, urlCount, robotsOk: robots.ok,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
