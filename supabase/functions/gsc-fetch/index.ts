// Google Search Console fetcher.
// Auth strategy: Service Account JSON stored as GSC_SERVICE_ACCOUNT_JSON secret.
// The service account must be added as a user (Full or Restricted) on the
// Search Console property the user wants to query.
//
// Returns: indexing coverage (URL inspection stats are limited via the API,
// so we surface analytics data + sitemap status), top queries, and recent
// errors / sitemap warnings.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

async function adminOnly(req: Request): Promise<boolean> {
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

// --- JWT signing with a Google service account (RS256) ---
function base64UrlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));
  const unsigned = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64UrlEncode(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`oauth token: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!(await adminOnly(req))) {
    return new Response(JSON.stringify({ error: 'admin required' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const saRaw = Deno.env.get('GSC_SERVICE_ACCOUNT_JSON');
    if (!saRaw) {
      return new Response(JSON.stringify({
        error: 'GSC_SERVICE_ACCOUNT_JSON not configured',
        hint: 'Create a service account in Google Cloud, enable Search Console API, share your GSC property with the service-account email, then add the JSON key as GSC_SERVICE_ACCOUNT_JSON secret.',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    let sa: any;
    try { sa = JSON.parse(saRaw); } catch {
      return new Response(JSON.stringify({ error: 'GSC_SERVICE_ACCOUNT_JSON is not valid JSON' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { siteUrl, days = 28, action = 'overview' } = await req.json().catch(() => ({}));
    if (!siteUrl) {
      return new Response(JSON.stringify({ error: 'siteUrl required (e.g. https://www.example.com/ or sc-domain:example.com)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = await getAccessToken(sa);
    const authH = { Authorization: `Bearer ${token}` };
    const encSite = encodeURIComponent(siteUrl);

    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    // List sites (sanity / discovery)
    if (action === 'list-sites') {
      const r = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', { headers: authH });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Search analytics: totals
    const totalsRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encSite}/searchAnalytics/query`,
      { method: 'POST', headers: { ...authH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startStr, endDate: endStr, dimensions: [], rowLimit: 1 }) }
    );
    const totals = totalsRes.ok ? await totalsRes.json() : { error: await totalsRes.text() };

    // Top queries
    const queriesRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encSite}/searchAnalytics/query`,
      { method: 'POST', headers: { ...authH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startStr, endDate: endStr, dimensions: ['query'], rowLimit: 25 }) }
    );
    const queries = queriesRes.ok ? await queriesRes.json() : { error: await queriesRes.text() };

    // Top pages
    const pagesRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encSite}/searchAnalytics/query`,
      { method: 'POST', headers: { ...authH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: startStr, endDate: endStr, dimensions: ['page'], rowLimit: 25 }) }
    );
    const pages = pagesRes.ok ? await pagesRes.json() : { error: await pagesRes.text() };

    // Sitemaps + their warnings/errors
    const sitemapsRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encSite}/sitemaps`,
      { headers: authH }
    );
    const sitemaps = sitemapsRes.ok ? await sitemapsRes.json() : { error: await sitemapsRes.text() };

    return new Response(JSON.stringify({
      ok: true,
      range: { startDate: startStr, endDate: endStr, days },
      totals: totals.rows?.[0] || null,
      topQueries: queries.rows || [],
      topPages: pages.rows || [],
      sitemaps: sitemaps.sitemap || [],
      queriesError: queries.error || null,
      pagesError: pages.error || null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
