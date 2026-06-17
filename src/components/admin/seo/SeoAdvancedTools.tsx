import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Download, Loader2, Search, Link2, BarChart3, Globe,
  RefreshCw, Activity, TrendingUp, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';

type Snapshot = {
  id: string;
  snapshot_date: string;
  source: string;
  on_page_score: number | null;
  checks: Array<{ label: string; status: string; detail?: string }> | null;
  sitemap_urls: number | null;
  sitemap_lastmod: string | null;
  robots_ok: boolean | null;
  structured_data_valid: boolean | null;
  verification_status: Record<string, boolean> | null;
  gsc_summary: any;
  notes: string | null;
};

/* ---------------- Scheduled Crawler & Weekly Reports ---------------- */
export function ScheduledCrawlerAndReports() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [baseUrl, setBaseUrl] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'https://www.nama-taiba.com'
  );

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['seo-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return ((data || []) as unknown) as Snapshot[];
    },
  });

  const runCrawl = async () => {
    setRunning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('seo-crawler', {
        body: { baseUrl, source: 'manual' },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (error) throw error;
      toast.success(t(`Crawl complete — score ${data?.onPageScore}`, `اكتمل الفحص — النتيجة ${data?.onPageScore}`));
      qc.invalidateQueries({ queryKey: ['seo-snapshots'] });
    } catch (e: any) {
      toast.error(e.message || 'crawl failed');
    } finally {
      setRunning(false);
    }
  };

  const latest = snapshots[0];
  const prev = snapshots[1];
  const delta = latest && prev && latest.on_page_score != null && prev.on_page_score != null
    ? latest.on_page_score - prev.on_page_score : null;

  const downloadCSV = () => {
    const rows = [
      ['date', 'source', 'on_page_score', 'sitemap_urls', 'robots_ok', 'structured_data_valid', 'google_verified', 'bing_verified', 'yandex_verified'],
      ...snapshots.map((s) => [
        s.snapshot_date, s.source, s.on_page_score ?? '', s.sitemap_urls ?? '',
        s.robots_ok ?? '', s.structured_data_valid ?? '',
        s.verification_status?.google ?? '', s.verification_status?.bing ?? '', s.verification_status?.yandex ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `seo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPDF = () => {
    if (!snapshots.length) { toast.error(t('No snapshots yet', 'لا توجد لقطات بعد')); return; }
    const doc = new jsPDF();
    const lh = 7;
    let y = 15;
    doc.setFontSize(16); doc.text('Weekly SEO Report', 14, y); y += lh + 2;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`, 14, y); y += lh;
    doc.text(`Site: ${baseUrl}`, 14, y); y += lh + 3;

    if (latest) {
      doc.setFontSize(12); doc.text('Latest snapshot', 14, y); y += lh;
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(latest.snapshot_date).toISOString().slice(0, 16).replace('T', ' ')}`, 14, y); y += lh;
      doc.text(`On-page score: ${latest.on_page_score ?? 'n/a'}${delta != null ? `  (Δ ${delta > 0 ? '+' : ''}${delta})` : ''}`, 14, y); y += lh;
      doc.text(`Sitemap URLs: ${latest.sitemap_urls ?? 'n/a'}`, 14, y); y += lh;
      doc.text(`Robots OK: ${latest.robots_ok}`, 14, y); y += lh;
      doc.text(`Structured data valid: ${latest.structured_data_valid}`, 14, y); y += lh;
      const v = latest.verification_status || {};
      doc.text(`Verification — Google: ${!!v.google}, Bing: ${!!v.bing}, Yandex: ${!!v.yandex}, Pinterest: ${!!v.pinterest}`, 14, y); y += lh + 3;

      doc.setFontSize(12); doc.text('On-page checks', 14, y); y += lh;
      doc.setFontSize(9);
      for (const c of latest.checks || []) {
        if (y > 280) { doc.addPage(); y = 15; }
        doc.text(`[${c.status.toUpperCase()}] ${c.label}${c.detail ? ' — ' + c.detail : ''}`.slice(0, 100), 14, y);
        y += 6;
      }
      y += 3;
    }

    if (snapshots.length > 1) {
      if (y > 250) { doc.addPage(); y = 15; }
      doc.setFontSize(12); doc.text('Score history (last 10)', 14, y); y += lh;
      doc.setFontSize(9);
      snapshots.slice(0, 10).forEach((s) => {
        doc.text(`${s.snapshot_date.slice(0, 10)}  score=${s.on_page_score ?? 'n/a'}  urls=${s.sitemap_urls ?? 'n/a'}  robots=${s.robots_ok}`, 14, y);
        y += 6;
      });
    }
    doc.save(`seo-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />{t('Scheduled Crawler & Weekly Reports', 'الزاحف المجدول والتقارير الأسبوعية')}</CardTitle>
        <CardDescription>
          {t(
            'Crawls sitemap, robots.txt and on-page SEO; stores snapshots you can export as PDF/CSV.',
            'يزحف للسايت ماب وروبوتس وفحوصات SEO، ويخزن لقطات قابلة للتصدير PDF/CSV.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} dir="ltr" placeholder="https://www.example.com" />
          <Button onClick={runCrawl} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {t('Run crawl now', 'شغّل الفحص الآن')}
          </Button>
        </div>

        {latest && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t('On-page score', 'نتيجة الصفحة')}</div>
              <div className="text-2xl font-bold">{latest.on_page_score}
                {delta != null && (
                  <span className={`text-xs ms-2 ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t('Sitemap URLs', 'روابط السايت ماب')}</div>
              <div className="text-2xl font-bold">{latest.sitemap_urls ?? '—'}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t('Robots', 'روبوتس')}</div>
              <div className="text-xl font-bold flex items-center gap-1">
                {latest.robots_ok ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-destructive" />}
                {latest.robots_ok ? 'OK' : 'FAIL'}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">{t('Structured data', 'البيانات المنظمة')}</div>
              <div className="text-xl font-bold flex items-center gap-1">
                {latest.structured_data_valid ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-destructive" />}
                {latest.structured_data_valid ? 'Valid' : 'Invalid'}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={downloadPDF} disabled={!snapshots.length}>
            <Download className="h-4 w-4 mr-2" />{t('Download PDF report', 'حمّل تقرير PDF')}
          </Button>
          <Button variant="outline" onClick={downloadCSV} disabled={!snapshots.length}>
            <FileText className="h-4 w-4 mr-2" />{t('Download CSV', 'حمّل CSV')}
          </Button>
        </div>

        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : snapshots.length > 0 ? (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-start p-2">{t('Date', 'التاريخ')}</th>
                  <th className="text-start p-2">{t('Source', 'المصدر')}</th>
                  <th className="text-start p-2">{t('Score', 'النتيجة')}</th>
                  <th className="text-start p-2">URLs</th>
                  <th className="text-start p-2">Robots</th>
                  <th className="text-start p-2">SD</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">{new Date(s.snapshot_date).toISOString().slice(0, 16).replace('T', ' ')}</td>
                    <td className="p-2"><Badge variant="outline">{s.source}</Badge></td>
                    <td className="p-2 font-mono">{s.on_page_score ?? '—'}</td>
                    <td className="p-2">{s.sitemap_urls ?? '—'}</td>
                    <td className="p-2">{s.robots_ok ? '✓' : '✗'}</td>
                    <td className="p-2">{s.structured_data_valid ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('No snapshots yet. Run a crawl to start tracking history.', 'لا توجد لقطات. شغّل فحصاً لبدء التتبع.')}</p>
        )}

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium">{t('Schedule weekly automatic crawls', 'جدولة فحوصات تلقائية أسبوعية')}</summary>
          <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-[10px]">{`-- Run in Supabase SQL editor (enable pg_cron + pg_net first):
select cron.schedule(
  'seo-weekly-crawl',
  '0 6 * * 1', -- every Monday 06:00 UTC
  $$ select net.http_post(
       url:='https://zqpptzorxufrfdgwgxxr.supabase.co/functions/v1/seo-crawler',
       headers:='{"Content-Type":"application/json","x-crawler-secret":"<CRAWLER_SECRET>"}'::jsonb,
       body:='{"baseUrl":"${baseUrl}","source":"cron"}'::jsonb
     ); $$
);`}</pre>
        </details>
      </CardContent>
    </Card>
  );
}

/* ---------------- Internal Linking Recommendations ---------------- */
function tokenize(s: string): Set<string> {
  return new Set(
    (s || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function InternalLinkingSuggestions() {
  const { t } = useLanguage();
  const [minScore, setMinScore] = useState(0.1);

  const { data, isLoading } = useQuery({
    queryKey: ['internal-linking'],
    queryFn: async () => {
      const [b, p] = await Promise.all([
        supabase.from('blogs').select('id,title_en,slug,keywords,meta_description_en').eq('is_published', true),
        supabase.from('products').select('id,name_en,keywords,description_en').eq('is_active', true),
      ]);
      if (b.error) throw b.error;
      if (p.error) throw p.error;
      return { blogs: b.data || [], products: p.data || [] };
    },
  });

  const suggestions = useMemo(() => {
    if (!data) return [];
    const out: Array<{ blogTitle: string; blogSlug: string; productName: string; productId: string; score: number; shared: string[]; anchor: string }> = [];
    for (const blog of data.blogs) {
      const bTokens = tokenize(`${blog.title_en} ${blog.keywords} ${blog.meta_description_en}`);
      for (const prod of data.products) {
        const pTokens = tokenize(`${prod.name_en} ${prod.keywords} ${prod.description_en}`);
        const score = jaccard(bTokens, pTokens);
        if (score >= minScore) {
          const shared = [...bTokens].filter((x) => pTokens.has(x)).slice(0, 6);
          // Suggested anchor text: prefer product name; fallback to top shared keywords.
          const anchor = (prod.name_en && prod.name_en.length <= 60)
            ? prod.name_en
            : shared.slice(0, 3).join(' ');
          out.push({
            blogTitle: blog.title_en || '',
            blogSlug: blog.slug || blog.id,
            productName: prod.name_en || '',
            productId: prod.id,
            score,
            shared,
            anchor,
          });
        }
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 50);
  }, [data, minScore]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />{t('Internal Linking Suggestions', 'اقتراحات الربط الداخلي')}</CardTitle>
        <CardDescription>{t('Keyword overlap between blog posts and products — add these links to boost topical authority.', 'تقاطع الكلمات المفتاحية بين المقالات والمنتجات — أضف هذه الروابط لتقوية السلطة الموضوعية.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs">{t('Min similarity', 'الحد الأدنى')}</Label>
          <Input type="number" step={0.05} min={0} max={1} value={minScore}
            onChange={(e) => setMinScore(parseFloat(e.target.value) || 0)}
            className="w-24" dir="ltr" />
          <span className="text-xs text-muted-foreground">{suggestions.length} {t('suggestions', 'اقتراحات')}</span>
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
         suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('No strong overlaps found. Add more keywords to your blogs/products.', 'لم يتم العثور على تقاطعات قوية. أضف كلمات مفتاحية أكثر.')}</p>
        ) : (
          <div className="rounded-lg border overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-start p-2">{t('Blog post', 'المقال')}</th>
                  <th className="text-start p-2">{t('Product', 'المنتج')}</th>
                  <th className="text-start p-2 w-40">{t('Relevance', 'الصلة')}</th>
                  <th className="text-start p-2">{t('Suggested anchor', 'النص المقترح')}</th>
                  <th className="text-start p-2">{t('Matched keywords', 'الكلمات المتطابقة')}</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s, i) => {
                  const pct = Math.round(s.score * 100);
                  const tone = pct >= 40 ? 'bg-green-600' : pct >= 20 ? 'bg-amber-500' : 'bg-muted-foreground';
                  return (
                    <tr key={i} className="border-t align-top">
                      <td className="p-2"><a href={`/blog/${s.blogSlug}`} target="_blank" rel="noopener" className="text-primary underline">{s.blogTitle}</a></td>
                      <td className="p-2">{s.productName}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded bg-muted overflow-hidden">
                            <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <span className="font-mono text-xs">{pct}%</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.shared.length} {t('matches', 'تطابق')}</div>
                      </td>
                      <td className="p-2 text-xs">
                        <code className="px-1.5 py-0.5 rounded bg-muted">{s.anchor}</code>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {s.shared.map((k) => (
                            <Badge key={k} variant="secondary" className="text-[10px] font-normal">{k}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Google Search Console ---------------- */
export function GoogleSearchConsolePanel() {
  const { t } = useLanguage();
  const [siteUrl, setSiteUrl] = useState(() => localStorage.getItem('gsc_site_url') || 'https://www.nama-taiba.com/');
  const [days, setDays] = useState(28);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [prevTotals, setPrevTotals] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('gsc_site_url', siteUrl); }, [siteUrl]);

  const call = async (action?: string) => {
    setLoading(true); setErr(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: res, error } = await supabase.functions.invoke('gsc-fetch', {
        body: { siteUrl, days, action },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (error) throw error;
      if (res?.error) { setErr(res.hint ? `${res.error} — ${res.hint}` : res.error); return; }
      setData(res);
      toast.success(t('GSC data loaded', 'تم تحميل بيانات GSC'));

      if (action !== 'list-sites' && res?.totals) {
        // Pull the previous GSC snapshot to compute trend deltas.
        const { data: prev } = await supabase
          .from('seo_snapshots')
          .select('gsc_summary')
          .not('gsc_summary', 'is', null)
          .order('snapshot_date', { ascending: false })
          .limit(1);
        const prevSummary: any = prev?.[0]?.gsc_summary;
        setPrevTotals(prevSummary?.totals || null);

        // Persist current GSC snapshot for trend history & weekly reports.
        await supabase.from('seo_snapshots').insert({
          source: 'gsc',
          gsc_summary: {
            range: res.range,
            totals: res.totals,
            topQueries: (res.topQueries || []).slice(0, 10),
            sitemapsCount: (res.sitemaps || []).length,
          },
          notes: `GSC fetch for ${siteUrl}`,
        });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  const trend = (curr: number | undefined, prev: number | undefined) => {
    if (curr == null || prev == null) return null;
    const d = curr - prev;
    if (!d) return <span className="text-xs text-muted-foreground ms-2">±0</span>;
    return (
      <span className={`text-xs ms-2 ${d > 0 ? 'text-green-600' : 'text-destructive'}`}>
        {d > 0 ? '▲ +' : '▼ '}{Math.abs(d).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('Google Search Console', 'Google Search Console')}</CardTitle>
        <CardDescription>{t('Top queries, top pages, sitemap status, and indexing coverage.', 'أهم الاستعلامات والصفحات وحالة السايت ماب والفهرسة.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-3 text-xs space-y-1">
          <p className="font-medium">{t('Setup (one-time):', 'الإعداد (مرة واحدة):')}</p>
          <ol className="list-decimal ms-5 space-y-1">
            <li>{t('Create a service account in Google Cloud → IAM → Service Accounts and create a JSON key.', 'أنشئ حساب خدمة في Google Cloud وأنشئ مفتاح JSON.')}</li>
            <li>{t('Enable the "Search Console API" for that project.', 'فعّل "Search Console API" للمشروع.')}</li>
            <li>{t('In Search Console → Settings → Users, add the service-account email with Full or Restricted access.', 'في Search Console أضف بريد حساب الخدمة كمستخدم.')}</li>
            <li>{t('Paste the entire JSON content of the key file into the GSC_SERVICE_ACCOUNT_JSON edge function secret.', 'الصق محتوى JSON كاملاً في سر الدالة GSC_SERVICE_ACCOUNT_JSON.')}</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
          <Input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} dir="ltr"
            placeholder="https://www.example.com/ or sc-domain:example.com" />
          <Input type="number" value={days} min={1} max={90} onChange={(e) => setDays(parseInt(e.target.value) || 28)} className="w-24" dir="ltr" />
          <Button onClick={() => call()} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t('Run GSC Sync now', 'مزامنة GSC الآن')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => call('list-sites')} disabled={loading}>
            {t('List my verified sites', 'اعرض المواقع الموثقة')}
          </Button>
          {data?.range && (
            <span className="text-xs text-muted-foreground self-center">
              {t('Last sync range', 'آخر مزامنة')}: {data.range.startDate} → {data.range.endDate}
            </span>
          )}
        </div>

        {err && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <pre className="whitespace-pre-wrap break-words">{err}</pre>
          </div>
        )}

        {data?.totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label={t('Clicks', 'النقرات')} value={data.totals.clicks?.toLocaleString() ?? '—'} trend={trend(data.totals.clicks, prevTotals?.clicks)} />
            <Stat label={t('Impressions', 'الظهور')} value={data.totals.impressions?.toLocaleString() ?? '—'} trend={trend(data.totals.impressions, prevTotals?.impressions)} />
            <Stat label={t('CTR', 'نسبة النقر')} value={data.totals.ctr ? (data.totals.ctr * 100).toFixed(2) + '%' : '—'} trend={trend(data.totals.ctr, prevTotals?.ctr)} />
            <Stat label={t('Avg position', 'متوسط الترتيب')} value={data.totals.position ? data.totals.position.toFixed(1) : '—'} trend={trend(data.totals.position, prevTotals?.position)} />
          </div>
        )}

        {data?.topQueries?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><TrendingUp className="h-4 w-4" />{t('Top queries', 'أهم الاستعلامات')}</h4>
            <div className="rounded-lg border overflow-x-auto max-h-72">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0"><tr>
                  <th className="text-start p-2">{t('Query', 'الاستعلام')}</th>
                  <th className="text-start p-2">Clicks</th><th className="text-start p-2">Impr.</th>
                  <th className="text-start p-2">CTR</th><th className="text-start p-2">Pos.</th>
                </tr></thead>
                <tbody>
                  {data.topQueries.map((q: any, i: number) => (
                    <tr key={i} className="border-t"><td className="p-2">{q.keys?.[0]}</td>
                      <td className="p-2 font-mono">{q.clicks}</td><td className="p-2 font-mono">{q.impressions}</td>
                      <td className="p-2 font-mono">{(q.ctr * 100).toFixed(1)}%</td><td className="p-2 font-mono">{q.position?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data?.sitemaps?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><Globe className="h-4 w-4" />{t('Sitemaps & errors', 'السايت ماب والأخطاء')}</h4>
            <div className="space-y-2">
              {data.sitemaps.map((sm: any, i: number) => (
                <div key={i} className="rounded border p-2 text-xs">
                  <div className="font-mono truncate">{sm.path}</div>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>{t('Submitted', 'تم الإرسال')}: {sm.lastSubmitted?.slice(0, 10) || '—'}</span>
                    <span>{t('Last downloaded', 'آخر تحميل')}: {sm.lastDownloaded?.slice(0, 10) || '—'}</span>
                    <span className={sm.errors > 0 ? 'text-destructive font-semibold' : ''}>errors: {sm.errors ?? 0}</span>
                    <span className={sm.warnings > 0 ? 'text-amber-600 font-semibold' : ''}>warnings: {sm.warnings ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, trend }: { label: string; value: string | number; trend?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}{trend}</div>
    </div>
  );
}
