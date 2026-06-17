// IndexNow submitter: forwards a list of URLs to Bing/Yandex/Seznam IndexNow.
// Public-callable (no JWT required) so the sitemap generator script can
// trigger it after content changes. Uses a shared secret header for abuse
// protection: set INDEXNOW_TRIGGER_SECRET in edge function secrets and pass
// it as `x-indexnow-secret`.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body {
  host?: string;
  key?: string;
  urls: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const secret = Deno.env.get('INDEXNOW_TRIGGER_SECRET');
    if (secret) {
      const provided = req.headers.get('x-indexnow-secret');
      if (provided !== secret) {
        return new Response(JSON.stringify({ error: 'forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = (await req.json()) as Body;
    const urls = (body.urls || []).map((u) => String(u).trim()).filter(Boolean);
    if (!urls.length) {
      return new Response(JSON.stringify({ error: 'no urls' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstUrl = new URL(urls[0]);
    const host = body.host || firstUrl.host;
    const key = body.key || Deno.env.get('INDEXNOW_KEY') || '';
    if (!key) {
      return new Response(JSON.stringify({ error: 'missing INDEXNOW_KEY' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const keyLocation = `${firstUrl.origin}/${key}.txt`;

    const endpoints = [
      'https://api.indexnow.org/IndexNow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow',
    ];

    const payload = JSON.stringify({ host, key, keyLocation, urlList: urls });
    const results = await Promise.allSettled(
      endpoints.map((ep) =>
        fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: payload,
        }).then((r) => ({ endpoint: ep, status: r.status }))
      )
    );

    return new Response(
      JSON.stringify({
        submitted: urls.length,
        host,
        results: results.map((r) => (r.status === 'fulfilled' ? r.value : { error: String((r as any).reason) })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
