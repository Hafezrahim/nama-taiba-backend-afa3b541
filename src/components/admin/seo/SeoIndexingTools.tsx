import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Activity, FileSearch, Send, Share2, Code2, ShieldCheck, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Copy, ExternalLink, RefreshCw,
} from 'lucide-react';
import {
  ScheduledCrawlerAndReports,
  InternalLinkingSuggestions,
  GoogleSearchConsolePanel,
} from './SeoAdvancedTools';

type Status = 'pass' | 'warn' | 'fail';
interface Check { label: string; status: Status; detail?: string }

const StatusIcon = ({ s }: { s: Status }) =>
  s === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
  s === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
  <XCircle className="h-4 w-4 text-destructive" />;

/* ---------------- 1. SEO Health Audit ---------------- */
function SeoHealthAudit() {
  const { t } = useLanguage();
  const [url, setUrl] = useState(window.location.origin);
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);

  const runAudit = async () => {
    setLoading(true);
    const results: Check[] = [];
    try {
      // Audit current document (live SPA state)
      const title = document.title || '';
      results.push({
        label: 'Title tag',
        status: title.length >= 30 && title.length <= 60 ? 'pass' : title ? 'warn' : 'fail',
        detail: `${title.length} chars — "${title.slice(0, 70)}"`,
      });

      const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      results.push({
        label: 'Meta description',
        status: desc.length >= 70 && desc.length <= 160 ? 'pass' : desc ? 'warn' : 'fail',
        detail: `${desc.length} chars`,
      });

      const canon = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
      results.push({
        label: 'Canonical URL',
        status: canon ? 'pass' : 'fail',
        detail: canon || 'missing',
      });

      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
      results.push({
        label: 'Robots meta',
        status: robots.includes('noindex') ? 'fail' : robots ? 'pass' : 'warn',
        detail: robots || 'not set (default: index,follow)',
      });

      const h1s = document.querySelectorAll('h1');
      results.push({
        label: 'H1 headings',
        status: h1s.length === 1 ? 'pass' : h1s.length === 0 ? 'fail' : 'warn',
        detail: `${h1s.length} found`,
      });

      const imgs = Array.from(document.querySelectorAll('img'));
      const missingAlt = imgs.filter((i) => !i.alt).length;
      results.push({
        label: 'Image alt text',
        status: missingAlt === 0 ? 'pass' : missingAlt < 3 ? 'warn' : 'fail',
        detail: `${missingAlt}/${imgs.length} missing alt`,
      });

      const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      results.push({
        label: 'Open Graph tags',
        status: og && ogImg ? 'pass' : og || ogImg ? 'warn' : 'fail',
        detail: `og:title ${og ? '✓' : '✗'}, og:image ${ogImg ? '✓' : '✗'}`,
      });

      const tw = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');
      results.push({
        label: 'Twitter Card',
        status: tw ? 'pass' : 'warn',
        detail: tw || 'missing',
      });

      const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
      results.push({
        label: 'Structured data (JSON-LD)',
        status: jsonLd.length > 0 ? 'pass' : 'warn',
        detail: `${jsonLd.length} block(s)`,
      });

      const lang = document.documentElement.lang;
      results.push({
        label: 'HTML lang attribute',
        status: lang ? 'pass' : 'fail',
        detail: lang || 'missing',
      });

      const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
      results.push({
        label: 'Viewport meta',
        status: viewport?.includes('width=device-width') ? 'pass' : 'fail',
        detail: viewport || 'missing',
      });

      // Sitemap + robots.txt reachable
      const [sm, rb] = await Promise.all([
        fetch('/sitemap.xml', { cache: 'no-store' }).then((r) => r.ok).catch(() => false),
        fetch('/robots.txt', { cache: 'no-store' }).then((r) => r.ok).catch(() => false),
      ]);
      results.push({ label: 'sitemap.xml reachable', status: sm ? 'pass' : 'fail' });
      results.push({ label: 'robots.txt reachable', status: rb ? 'pass' : 'fail' });

      results.push({
        label: 'HTTPS',
        status: location.protocol === 'https:' ? 'pass' : 'fail',
        detail: location.protocol,
      });

      setChecks(results);
      toast.success(t('Audit complete', 'اكتمل الفحص'));
    } finally {
      setLoading(false);
    }
  };

  const score = checks.length
    ? Math.round((checks.filter((c) => c.status === 'pass').length / checks.length) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />{t('On-Page SEO Audit', 'فحص السيو على الصفحة')}</CardTitle>
        <CardDescription>{t('Runs 13+ live checks on the current page', 'يشغّل 13+ فحصاً مباشراً على الصفحة الحالية')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} dir="ltr" />
          <Button onClick={runAudit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">{t('Run audit', 'تشغيل الفحص')}</span>
          </Button>
        </div>
        {checks.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{score}<span className="text-sm text-muted-foreground">/100</span></div>
              <Badge variant={score >= 80 ? 'default' : score >= 60 ? 'secondary' : 'destructive'}>
                {score >= 80 ? t('Excellent', 'ممتاز') : score >= 60 ? t('Good', 'جيد') : t('Needs work', 'يحتاج تحسين')}
              </Badge>
            </div>
            <div className="space-y-2">
              {checks.map((c, i) => (
                <div key={i} className="flex items-start gap-3 text-sm p-2 rounded border">
                  <StatusIcon s={c.status} />
                  <div className="flex-1">
                    <div className="font-medium">{c.label}</div>
                    {c.detail && <div className="text-xs text-muted-foreground">{c.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- 2. Sitemap & Robots inspector ---------------- */
function SitemapInspector() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<{ urls: number; lastmod?: string; robots?: string; xml?: string } | null>(null);

  const inspect = async () => {
    setLoading(true);
    try {
      const [smRes, rbRes] = await Promise.all([
        fetch('/sitemap.xml', { cache: 'no-store' }),
        fetch('/robots.txt', { cache: 'no-store' }),
      ]);
      const xml = smRes.ok ? await smRes.text() : '';
      const robots = rbRes.ok ? await rbRes.text() : '';
      const urls = (xml.match(/<loc>/g) || []).length;
      const lastmodMatches = xml.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
      const lastmod = lastmodMatches.length
        ? lastmodMatches.map((m) => m.replace(/<\/?lastmod>/g, '')).sort().pop()
        : undefined;
      setInfo({ urls, lastmod, robots, xml: xml.slice(0, 2000) });
    } catch {
      toast.error(t('Failed to load sitemap', 'فشل تحميل خريطة الموقع'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5" />{t('Sitemap & Robots', 'خريطة الموقع و Robots')}</CardTitle>
        <CardDescription>{t('Inspect sitemap.xml and robots.txt', 'فحص sitemap.xml و robots.txt')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={inspect} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">{t('Inspect', 'فحص')}</span>
          </Button>
          <Button variant="outline" asChild><a href="/sitemap.xml" target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-1" />sitemap.xml</a></Button>
          <Button variant="outline" asChild><a href="/robots.txt" target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-1" />robots.txt</a></Button>
        </div>
        {info && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded"><div className="text-muted-foreground text-xs">{t('URLs indexed', 'الروابط')}</div><div className="text-2xl font-bold">{info.urls}</div></div>
              <div className="p-3 border rounded"><div className="text-muted-foreground text-xs">{t('Last modified', 'آخر تحديث')}</div><div className="text-sm font-medium">{info.lastmod || '—'}</div></div>
            </div>
            {info.robots && (
              <div>
                <Label className="text-xs">robots.txt</Label>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40 mt-1" dir="ltr">{info.robots}</pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- 3. IndexNow submitter (Bing/Yandex) ---------------- */
function IndexNowSubmitter() {
  const { t } = useLanguage();
  const [key] = useState(() => {
    let k = localStorage.getItem('indexnow_key');
    if (!k) { k = crypto.randomUUID().replace(/-/g, ''); localStorage.setItem('indexnow_key', k); }
    return k;
  });
  const [urls, setUrls] = useState(window.location.origin + '\n' + window.location.origin + '/products');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const list = urls.split('\n').map((u) => u.trim()).filter(Boolean);
      const host = new URL(list[0]).host;
      const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key, keyLocation: `${new URL(list[0]).origin}/${key}.txt`, urlList: list }),
      });
      if (res.ok || res.status === 202) toast.success(t('Submitted to Bing/Yandex IndexNow', 'تم الإرسال إلى IndexNow'));
      else toast.warning(`IndexNow: HTTP ${res.status} — ${t('host the key file first', 'استضف ملف المفتاح أولاً')}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadKeyFile = () => {
    const blob = new Blob([key], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${key}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />{t('IndexNow Submission', 'إرسال IndexNow')}</CardTitle>
        <CardDescription>{t('Instantly notify Bing, Yandex & Seznam of new/updated URLs', 'إبلاغ Bing و Yandex فوراً بالروابط الجديدة/المحدّثة')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t('Your IndexNow Key', 'مفتاح IndexNow الخاص بك')}</Label>
          <div className="flex gap-2">
            <Input value={key} readOnly dir="ltr" className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(key); toast.success(t('Copied', 'تم النسخ')); }}><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('Download the key file and upload it to /public so it is served at /', 'حمّل ملف المفتاح وارفعه إلى /public ليكون متاحاً على الجذر')}{key}.txt</p>
          <Button variant="secondary" size="sm" onClick={downloadKeyFile}>{t('Download key file', 'تحميل ملف المفتاح')}</Button>
        </div>
        <div className="space-y-2">
          <Label>{t('URLs to submit (one per line)', 'الروابط للإرسال (واحد لكل سطر)')}</Label>
          <Textarea value={urls} onChange={(e) => setUrls(e.target.value)} dir="ltr" rows={5} />
        </div>
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t('Submit to IndexNow', 'إرسال إلى IndexNow')}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------------- 4. Social Preview ---------------- */
function SocialPreview() {
  const { t } = useLanguage();
  const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.title;
  const desc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const img = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
  const url = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || window.location.origin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />{t('Social Share Preview', 'معاينة المشاركة الاجتماعية')}</CardTitle>
        <CardDescription>{t('How your site looks on Facebook, Twitter, LinkedIn, WhatsApp', 'كيف يظهر موقعك على فيسبوك وتويتر ولينكدإن وواتساب')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="border rounded overflow-hidden bg-card">
          <div className="text-xs px-3 py-1 bg-muted">Facebook / LinkedIn</div>
          {img && <img src={img} alt="" className="w-full h-40 object-cover" />}
          <div className="p-3">
            <div className="text-xs uppercase text-muted-foreground truncate">{new URL(url, window.location.origin).host}</div>
            <div className="font-semibold line-clamp-2 text-sm">{title}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
          </div>
        </div>
        <div className="border rounded overflow-hidden bg-card">
          <div className="text-xs px-3 py-1 bg-muted">Twitter / X</div>
          {img && <img src={img} alt="" className="w-full h-40 object-cover" />}
          <div className="p-3">
            <div className="font-semibold line-clamp-1 text-sm">{title}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{desc}</div>
            <div className="text-xs text-muted-foreground mt-1">🔗 {new URL(url, window.location.origin).host}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- 5. Structured Data Generator ---------------- */
function StructuredDataGenerator() {
  const { t } = useLanguage();
  const [data, setData] = useState({
    name: 'Nama Taiba Factory',
    type: 'LocalBusiness',
    phone: '+966-XXX-XXXX',
    address: 'Saudi Arabia',
    url: window.location.origin,
    logo: '',
    priceRange: '$$',
  });

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name,
    url: data.url,
    logo: data.logo || undefined,
    telephone: data.phone,
    priceRange: data.priceRange,
    address: { '@type': 'PostalAddress', addressCountry: 'SA', streetAddress: data.address },
  }, null, 2);

  const snippet = `<script type="application/ld+json">\n${jsonLd}\n</script>`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Code2 className="h-5 w-5" />{t('Structured Data Generator', 'مولّد البيانات المنظمة')}</CardTitle>
        <CardDescription>{t('Generate JSON-LD for rich Google results', 'إنشاء JSON-LD لنتائج جوجل الغنية')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Name</Label><Input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} dir="ltr" /></div>
          <div><Label>Type</Label>
            <select className="w-full h-10 rounded border bg-background px-3 text-sm" value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })}>
              <option>LocalBusiness</option><option>Organization</option><option>Store</option><option>Corporation</option>
            </select>
          </div>
          <div><Label>Phone</Label><Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} dir="ltr" /></div>
          <div><Label>URL</Label><Input value={data.url} onChange={(e) => setData({ ...data, url: e.target.value })} dir="ltr" /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} dir="ltr" /></div>
          <div><Label>Logo URL</Label><Input value={data.logo} onChange={(e) => setData({ ...data, logo: e.target.value })} dir="ltr" /></div>
          <div><Label>Price Range</Label><Input value={data.priceRange} onChange={(e) => setData({ ...data, priceRange: e.target.value })} dir="ltr" /></div>
        </div>
        <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64" dir="ltr">{snippet}</pre>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(snippet); toast.success(t('Copied to clipboard', 'تم النسخ')); }}><Copy className="h-4 w-4 mr-1" />{t('Copy', 'نسخ')}</Button>
          <Button variant="outline" asChild><a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(data.url)}`} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-1" />{t('Test in Google', 'اختبر في جوجل')}</a></Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- 6. Search Engine Verification ---------------- */
interface VerifProps {
  values: { google?: string; bing?: string; yandex?: string; pinterest?: string };
  onChange: (v: VerifProps['values']) => void;
}
function VerificationCodes({ values, onChange }: VerifProps) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />{t('Search Engine Verification', 'تحقق محركات البحث')}</CardTitle>
        <CardDescription>{t('Verification codes injected as meta tags. Save in SEO settings.', 'رموز التحقق تُحقن كعلامات وصفية. احفظ في إعدادات السيو.')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Google Search Console</Label>
          <Input value={values.google || ''} onChange={(e) => onChange({ ...values, google: e.target.value })} dir="ltr" placeholder="google-site-verification content" />
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="text-xs text-primary inline-flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></a>
        </div>
        <div className="space-y-1">
          <Label>Bing Webmaster</Label>
          <Input value={values.bing || ''} onChange={(e) => onChange({ ...values, bing: e.target.value })} dir="ltr" placeholder="msvalidate.01 content" />
          <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener" className="text-xs text-primary inline-flex items-center gap-1">Open <ExternalLink className="h-3 w-3" /></a>
        </div>
        <div className="space-y-1">
          <Label>Yandex Webmaster</Label>
          <Input value={values.yandex || ''} onChange={(e) => onChange({ ...values, yandex: e.target.value })} dir="ltr" placeholder="yandex-verification content" />
        </div>
        <div className="space-y-1">
          <Label>Pinterest</Label>
          <Input value={values.pinterest || ''} onChange={(e) => onChange({ ...values, pinterest: e.target.value })} dir="ltr" placeholder="p:domain_verify content" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Main export ---------------- */
interface Props {
  verification: { google?: string; bing?: string; yandex?: string; pinterest?: string };
  onVerificationChange: (v: Props['verification']) => void;
}
export default function SeoIndexingTools({ verification, onVerificationChange }: Props) {
  return (
    <div className="space-y-6">
      <VerificationCodes values={verification} onChange={onVerificationChange} />
      <SeoHealthAudit />
      <ScheduledCrawlerAndReports />
      <GoogleSearchConsolePanel />
      <InternalLinkingSuggestions />
      <SitemapInspector />
      <IndexNowSubmitter />
      <SocialPreview />
      <StructuredDataGenerator />
    </div>
  );
}
