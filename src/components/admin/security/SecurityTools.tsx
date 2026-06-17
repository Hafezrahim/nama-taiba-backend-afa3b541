import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Shield, Globe, Lock, Bug, Network, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type Status = 'pass' | 'fail' | 'warn' | 'unknown';

const statusIcon = (s: Status) => {
  if (s === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (s === 'fail') return <XCircle className="h-4 w-4 text-destructive" />;
  if (s === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <span className="h-4 w-4 inline-block rounded-full border border-muted-foreground/40" />;
};

const sevBadge = (s: Status) => {
  if (s === 'pass') return <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/20">PASS</Badge>;
  if (s === 'fail') return <Badge variant="destructive">FAIL</Badge>;
  if (s === 'warn') return <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/20">WARN</Badge>;
  return <Badge variant="outline">—</Badge>;
};

/* ============================================================
 * 1) OWASP Top 10 (2025) checklist
 * ============================================================ */
const OWASP_KEY = 'admin.security.owasp2025';

const OWASP_ITEMS: { code: string; en: string; ar: string; desc_en: string; desc_ar: string }[] = [
  { code: 'A01', en: 'Broken Access Control', ar: 'تحكم وصول معطّل', desc_en: 'Enforce RLS, role checks (has_role), and server-side authorization for every mutation.', desc_ar: 'فرض RLS وفحوصات الدور (has_role) والتفويض على كل عملية كتابة.' },
  { code: 'A02', en: 'Cryptographic Failures', ar: 'إخفاقات التشفير', desc_en: 'HTTPS everywhere, never store secrets in DB, no service_role on client.', desc_ar: 'HTTPS دائماً، لا تخزن أسراراً في القاعدة، ولا service_role في الواجهة.' },
  { code: 'A03', en: 'Injection (SQLi/XSS/Command)', ar: 'الحقن (SQLi/XSS/أوامر)', desc_en: 'Parameterized queries via Supabase client, sanitize HTML, validate with zod.', desc_ar: 'استعلامات معاملية، تعقيم HTML، تحقق بـ zod.' },
  { code: 'A04', en: 'Insecure Design', ar: 'تصميم غير آمن', desc_en: 'Threat-model new features; deny by default; least privilege grants.', desc_ar: 'نمذجة التهديدات، الرفض الافتراضي، أقل الصلاحيات.' },
  { code: 'A05', en: 'Security Misconfiguration', ar: 'سوء إعداد أمني', desc_en: 'Strict CSP/HSTS, no debug in prod, restrict CORS.', desc_ar: 'CSP/HSTS صارمة، لا تصحيح في الإنتاج، تقييد CORS.' },
  { code: 'A06', en: 'Vulnerable / Outdated Components', ar: 'مكونات قديمة/مكشوفة', desc_en: 'Run dependency scan regularly; pin & update libs.', desc_ar: 'فحص دوري للاعتماديات وتحديثها.' },
  { code: 'A07', en: 'Identification & Auth Failures', ar: 'إخفاقات المصادقة', desc_en: 'Approval flow for sensitive roles, rate-limit auth, leaked-password protection.', desc_ar: 'موافقة للأدوار الحساسة، حد معدّل، حماية كلمات السر المسرّبة.' },
  { code: 'A08', en: 'Software & Data Integrity Failures', ar: 'سلامة البرمجيات والبيانات', desc_en: 'Signed webhooks (x-webhook-secret), trusted CDN, no dynamic eval.', desc_ar: 'ويب هوك موقّع، CDN موثوق، بدون eval ديناميكي.' },
  { code: 'A09', en: 'Logging & Monitoring Failures', ar: 'إخفاقات السجل والمراقبة', desc_en: 'security_events feed + admin_activity_log + alerts on anomalies.', desc_ar: 'سجل أحداث + سجل نشاط المسؤول + تنبيهات.' },
  { code: 'A10', en: 'Server-Side Request Forgery', ar: 'تزوير طلبات الخادم', desc_en: 'Edge functions: whitelist outbound hosts, never fetch user-supplied URLs blindly.', desc_ar: 'في دوال Edge: قائمة بيضاء للوجهات، لا تجلب روابط المستخدم مباشرة.' },
];

function OwaspChecklist() {
  const { t } = useLanguage();
  const [state, setState] = useState<Record<string, Status>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OWASP_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setState(p.state || {});
        setNotes(p.notes || {});
      }
    } catch {}
  }, []);

  const save = (s: Record<string, Status>, n: Record<string, string>) => {
    try { localStorage.setItem(OWASP_KEY, JSON.stringify({ state: s, notes: n })); } catch {}
  };

  const setS = (code: string, st: Status) => {
    const next = { ...state, [code]: st };
    setState(next); save(next, notes);
  };
  const setN = (code: string, v: string) => {
    const next = { ...notes, [code]: v };
    setNotes(next); save(state, next);
  };

  const score = useMemo(() => {
    const pass = OWASP_ITEMS.filter(i => state[i.code] === 'pass').length;
    return Math.round((pass / OWASP_ITEMS.length) * 100);
  }, [state]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 flex items-center gap-4">
          <Shield className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{t('OWASP Top 10 (2025) coverage', 'تغطية OWASP Top 10 (2025)')}</div>
            <Progress value={score} className="mt-2" />
          </div>
          <div className="text-2xl font-bold">{score}%</div>
        </CardContent>
      </Card>

      {OWASP_ITEMS.map((it) => (
        <Card key={it.code}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{it.code}</Badge>
                <CardTitle className="text-base">{t(it.en, it.ar)}</CardTitle>
              </div>
              <div className="flex gap-1">
                {(['pass', 'warn', 'fail', 'unknown'] as Status[]).map((s) => (
                  <Button key={s} size="sm" variant={state[it.code] === s ? 'default' : 'outline'} onClick={() => setS(it.code, s)} className="h-7 px-2">
                    {statusIcon(s)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{t(it.desc_en, it.desc_ar)}</p>
            <Input
              defaultValue={notes[it.code] || ''}
              placeholder={t('Evidence / notes…', 'دليل / ملاحظات…')}
              onBlur={(e) => setN(it.code, e.target.value)}
              className="text-sm"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
 * 2) HTTP Security Headers scanner
 * ============================================================ */
type HeaderResult = { name: string; expected: string; actual: string | null; status: Status; advice: string };

async function scanHeaders(url: string): Promise<HeaderResult[]> {
  const res = await fetch(url, { method: 'GET', mode: 'cors' }).catch((e) => { throw e; });
  const get = (k: string) => res.headers.get(k);
  const checks: { name: string; expected: string; actual: string | null; ok: (v: string | null) => Status; advice: string }[] = [
    { name: 'Strict-Transport-Security', expected: 'max-age=63072000; includeSubDomains; preload', actual: get('strict-transport-security'), ok: (v) => v && /max-age=\d{6,}/i.test(v) ? 'pass' : 'fail', advice: 'Add HSTS to force HTTPS for ≥1 year.' },
    { name: 'Content-Security-Policy', expected: "default-src 'self'; …", actual: get('content-security-policy'), ok: (v) => v ? 'pass' : 'fail', advice: 'Define a CSP to mitigate XSS and data injection.' },
    { name: 'X-Frame-Options', expected: 'DENY or SAMEORIGIN', actual: get('x-frame-options'), ok: (v) => v && /deny|sameorigin/i.test(v) ? 'pass' : 'warn', advice: 'Prevent clickjacking with X-Frame-Options or CSP frame-ancestors.' },
    { name: 'X-Content-Type-Options', expected: 'nosniff', actual: get('x-content-type-options'), ok: (v) => v?.toLowerCase() === 'nosniff' ? 'pass' : 'fail', advice: 'Send nosniff to block MIME-type confusion attacks.' },
    { name: 'Referrer-Policy', expected: 'strict-origin-when-cross-origin', actual: get('referrer-policy'), ok: (v) => v ? 'pass' : 'warn', advice: 'Set a strict referrer policy.' },
    { name: 'Permissions-Policy', expected: 'camera=(), microphone=(), geolocation=()', actual: get('permissions-policy'), ok: (v) => v ? 'pass' : 'warn', advice: 'Restrict powerful browser features.' },
    { name: 'Cross-Origin-Opener-Policy', expected: 'same-origin', actual: get('cross-origin-opener-policy'), ok: (v) => v ? 'pass' : 'warn', advice: 'Isolate browsing context to prevent XS-Leaks.' },
    { name: 'X-XSS-Protection', expected: '0 (rely on CSP)', actual: get('x-xss-protection'), ok: (v) => v === '0' || v === null ? 'pass' : 'warn', advice: 'Modern browsers ignore this; set 0 or omit and use CSP.' },
    { name: 'Server', expected: '(removed)', actual: get('server'), ok: (v) => v ? 'warn' : 'pass', advice: 'Hide server banner to reduce fingerprinting.' },
  ];
  return checks.map((c) => ({ name: c.name, expected: c.expected, actual: c.actual, status: c.ok(c.actual), advice: c.advice }));
}

function HeadersScanner() {
  const { t } = useLanguage();
  const [url, setUrl] = useState(typeof window !== 'undefined' ? window.location.origin : '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HeaderResult[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setErr(null); setResults(null);
    try { setResults(await scanHeaders(url)); }
    catch (e: any) { setErr(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />{t('HTTP Security Headers', 'ترويسات أمان HTTP')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
            <Button onClick={run} disabled={loading || !url}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Scan', 'فحص')}
            </Button>
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <p className="text-xs text-muted-foreground">{t('Note: CORS may block reading headers from cross-origin targets. Scan your own domain for accurate results.', 'ملاحظة: قد يمنع CORS قراءة الترويسات من نطاق آخر. افحص نطاقك للحصول على نتائج دقيقة.')}</p>
        </CardContent>
      </Card>

      {results && results.map((r) => (
        <Card key={r.name}>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono">{r.name}</code>
              {sevBadge(r.status)}
            </div>
            <div className="text-xs text-muted-foreground">
              <div><strong>{t('Expected', 'المتوقع')}:</strong> {r.expected}</div>
              <div className="break-all"><strong>{t('Actual', 'الفعلي')}:</strong> {r.actual ?? <em>{t('(missing)', '(غير موجود)')}</em>}</div>
              {r.status !== 'pass' && <div className="mt-1"><strong>{t('Advice', 'نصيحة')}:</strong> {r.advice}</div>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
 * 3) Injection (XSS / SQLi) heuristic tester
 * ============================================================ */
const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '"><svg/onload=alert(1)>',
  "javascript:alert(1)",
  '<img src=x onerror=alert(1)>',
];
const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users;--",
  '" OR 1=1 --',
  "1' UNION SELECT NULL,NULL--",
];

const SQL_ERROR_SIGNS = [/sql syntax/i, /pg_query/i, /postgres/i, /sqlite/i, /odbc/i, /mysql/i, /syntax error at or near/i];

function InjectionScanner() {
  const { t } = useLanguage();
  const [target, setTarget] = useState(typeof window !== 'undefined' ? window.location.origin + '/?q=' : '');
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<{ kind: string; payload: string; status: Status; detail: string }[]>([]);

  const run = async () => {
    setRunning(true); setRows([]);
    const out: typeof rows = [];
    const all = [
      ...XSS_PAYLOADS.map((p) => ({ kind: 'XSS', payload: p })),
      ...SQLI_PAYLOADS.map((p) => ({ kind: 'SQLi', payload: p })),
    ];
    for (const { kind, payload } of all) {
      try {
        const u = target + encodeURIComponent(payload);
        const res = await fetch(u, { method: 'GET' });
        const body = await res.text();
        let status: Status = 'pass';
        let detail = `HTTP ${res.status}`;
        if (kind === 'XSS' && body.includes(payload)) {
          status = 'fail'; detail = t('Payload reflected unescaped in response body', 'تم انعكاس الحمولة دون تهريب');
        } else if (kind === 'SQLi' && SQL_ERROR_SIGNS.some((r) => r.test(body))) {
          status = 'fail'; detail = t('SQL error string detected in response', 'تم اكتشاف نص خطأ SQL');
        } else if (res.status >= 500) {
          status = 'warn'; detail = `${detail} — ${t('server error', 'خطأ خادم')}`;
        }
        out.push({ kind, payload, status, detail });
      } catch (e: any) {
        out.push({ kind, payload, status: 'warn', detail: e?.message || String(e) });
      }
      setRows([...out]);
    }
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Bug className="h-4 w-4" />{t('Injection Tester (XSS / SQLi)', 'مختبر الحقن (XSS / SQLi)')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-xs">{t('Target URL (payload is appended URL-encoded)', 'الرابط الهدف (تُلحق الحمولة بترميز URL)')}</Label>
          <div className="flex gap-2">
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="https://yoursite.com/search?q=" />
            <Button onClick={run} disabled={running || !target}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Run', 'تشغيل')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('Heuristic only: detects reflected XSS and SQL error leaks. Only scan systems you own.', 'كشف تقريبي: ينبه إلى انعكاس XSS وتسرّب أخطاء SQL. افحص أنظمتك فقط.')}</p>
        </CardContent>
      </Card>

      {rows.map((r, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Badge variant="outline">{r.kind}</Badge><code className="text-xs break-all">{r.payload}</code></div>
              {sevBadge(r.status)}
            </div>
            <div className="text-xs text-muted-foreground break-all">{r.detail}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
 * 4) Network / TLS / mixed-content probe
 * ============================================================ */
function NetworkProbe() {
  const { t } = useLanguage();
  const [items, setItems] = useState<{ name: string; status: Status; detail: string }[]>([]);

  const run = () => {
    const out: typeof items = [];
    const loc = window.location;

    out.push({
      name: 'HTTPS',
      status: loc.protocol === 'https:' ? 'pass' : 'fail',
      detail: `${loc.protocol}//${loc.host}`,
    });
    out.push({
      name: 'Secure Context',
      status: window.isSecureContext ? 'pass' : 'fail',
      detail: window.isSecureContext ? t('Crypto/Subtle APIs available', 'واجهات Crypto متاحة') : t('Not secure', 'غير آمن'),
    });

    // mixed content scan in current DOM
    const mixed: string[] = [];
    document.querySelectorAll<HTMLElement>('img,script,link,iframe,video,audio,source').forEach((el) => {
      const attr = (el as any).src || (el as any).href;
      if (typeof attr === 'string' && attr.startsWith('http://')) mixed.push(attr);
    });
    out.push({
      name: 'Mixed Content',
      status: mixed.length ? 'fail' : 'pass',
      detail: mixed.length ? `${mixed.length} ${t('insecure resources', 'موارد غير آمنة')}: ${mixed.slice(0, 3).join(', ')}` : t('No http:// subresources in DOM', 'لا توجد موارد http:// في الـ DOM'),
    });

    // service worker
    out.push({
      name: 'Service Worker',
      status: 'serviceWorker' in navigator ? 'pass' : 'warn',
      detail: 'serviceWorker' in navigator ? t('Supported', 'مدعوم') : t('Unsupported', 'غير مدعوم'),
    });

    // referrer policy meta
    const ref = document.querySelector('meta[name="referrer"]')?.getAttribute('content') || '';
    out.push({
      name: 'Meta Referrer Policy',
      status: ref ? 'pass' : 'warn',
      detail: ref || t('Not declared in meta', 'غير معرّفة في meta'),
    });

    // CSP meta
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || '';
    out.push({
      name: 'Meta CSP',
      status: csp ? 'pass' : 'warn',
      detail: csp ? csp.slice(0, 80) + (csp.length > 80 ? '…' : '') : t('No <meta http-equiv="Content-Security-Policy">', 'لا توجد علامة CSP'),
    });

    setItems(out);
  };

  useEffect(() => { run(); }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Network className="h-4 w-4" />{t('Network & TLS', 'الشبكة و TLS')}</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={run} size="sm" variant="outline">{t('Re-run probe', 'إعادة الفحص')}</Button>
        </CardContent>
      </Card>

      {items.map((r) => (
        <Card key={r.name}>
          <CardContent className="pt-4 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{r.name}</div>
              <div className="text-xs text-muted-foreground break-all">{r.detail}</div>
            </div>
            {sevBadge(r.status)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
 * 5) Black-box endpoint scanner
 * ============================================================ */
const SENSITIVE_PATHS = [
  '/.env', '/.git/config', '/.git/HEAD', '/wp-admin', '/wp-login.php',
  '/phpinfo.php', '/server-status', '/.DS_Store', '/backup.sql',
  '/config.json', '/composer.json', '/package-lock.json',
  '/admin', '/api/admin', '/_next/', '/swagger', '/api-docs',
];

function BlackBoxScan() {
  const { t } = useLanguage();
  const [origin, setOrigin] = useState(typeof window !== 'undefined' ? window.location.origin : '');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<{ path: string; status: Status; code: number | string; note: string }[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SENSITIVE_PATHS.map((p) => [p, true]))
  );

  const run = async () => {
    setRunning(true); setRows([]); setProgress(0);
    const list = SENSITIVE_PATHS.filter((p) => selected[p]);
    const out: typeof rows = [];
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      try {
        const res = await fetch(origin + p, { method: 'GET', redirect: 'manual' });
        let status: Status = 'pass';
        let note = '';
        if (res.status === 200) {
          // SPA may return index.html for unknown paths; flag as warn
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('text/html')) { status = 'warn'; note = t('200 HTML — likely SPA fallback', '200 HTML — احتمال صفحة افتراضية'); }
          else { status = 'fail'; note = t('Exposed resource', 'مورد مكشوف'); }
        } else if (res.status === 403) { status = 'pass'; note = 'Forbidden'; }
        else if (res.status === 404) { status = 'pass'; note = 'Not found'; }
        else { status = 'warn'; note = `HTTP ${res.status}`; }
        out.push({ path: p, status, code: res.status, note });
      } catch (e: any) {
        out.push({ path: p, status: 'warn', code: 'ERR', note: e?.message || String(e) });
      }
      setRows([...out]);
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setRunning(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" />{t('Black-Box Endpoint Scan', 'فحص النقاط الحساسة')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="https://example.com" />
            <Button onClick={run} disabled={running || !origin}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : t('Scan', 'فحص')}
            </Button>
          </div>
          {running && <Progress value={progress} />}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-48 overflow-auto p-2 border rounded">
            {SENSITIVE_PATHS.map((p) => (
              <label key={p} className="flex items-center gap-2 text-xs">
                <Checkbox checked={selected[p]} onCheckedChange={(v) => setSelected({ ...selected, [p]: !!v })} />
                <code>{p}</code>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('Only scan systems you own or have explicit permission to test.', 'افحص فقط أنظمة تملكها أو لديك إذن صريح بفحصها.')}</p>
        </CardContent>
      </Card>

      {rows.map((r) => (
        <Card key={r.path}>
          <CardContent className="pt-4 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <code className="text-sm">{r.path}</code>
              <div className="text-xs text-muted-foreground">{r.note} — <span className="font-mono">{r.code}</span></div>
            </div>
            {sevBadge(r.status)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================ */
export { OwaspChecklist, HeadersScanner, InjectionScanner, NetworkProbe, BlackBoxScan };
