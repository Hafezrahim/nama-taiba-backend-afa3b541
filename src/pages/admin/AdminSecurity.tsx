import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Activity, RefreshCw, Copy, Eye, EyeOff, Save, Trash2, ExternalLink, ListChecks, Lock, Bug, Network, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { OwaspChecklist, HeadersScanner, InjectionScanner, NetworkProbe, BlackBoxScan } from '@/components/admin/security/SecurityTools';

const SECRET_STORAGE_KEY = 'admin.security.webhookSecret';

type Finding = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  status: 'open' | 'ignored' | 'fixed';
  recommendation: string | null;
  notes: string | null;
  updated_at: string;
};

type SecEvent = {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  title: string;
  description: string | null;
  ip_address: string | null;
  user_id: string | null;
  resolved: boolean;
  created_at: string;
};

const sevColor = (s: string) =>
  s === 'critical' ? 'destructive' : s === 'warning' ? 'default' : 'secondary';

export default function AdminSecurity() {
  const { t } = useLanguage();
  const { isAdmin, isApproved, loading: authLoading } = useAuth();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSev, setFilterSev] = useState<string>('all');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    try { setSecret(localStorage.getItem(SECRET_STORAGE_KEY) || ''); } catch {}
  }, []);

  const load = async () => {
    setLoading(true);
    const [f, e] = await Promise.all([
      supabase.from('security_findings').select('*').order('severity', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(200),
    ]);
    if (f.data) setFindings(f.data as any);
    if (e.data) setEvents(e.data as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('security-events-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (p) => {
        setEvents((prev) => [p.new as SecEvent, ...prev].slice(0, 200));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const updateFinding = async (id: string, patch: Partial<Finding>) => {
    const { error } = await supabase.from('security_findings').update(patch).eq('id', id);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    setFindings((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    toast({ title: t('Updated', 'تم التحديث') });
  };

  const markResolved = async (id: string) => {
    const { error } = await supabase
      .from('security_events')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast({ title: t('Error', 'خطأ'), description: error.message, variant: 'destructive' }); return; }
    setEvents((prev) => prev.map((x) => (x.id === id ? { ...x, resolved: true } : x)));
  };

  const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = `https://${projectId}.functions.supabase.co/security-webhook`;

  const stats = {
    open: findings.filter((f) => f.status === 'open').length,
    critical: findings.filter((f) => f.severity === 'critical' && f.status === 'open').length,
    events24h: events.filter((e) => Date.now() - new Date(e.created_at).getTime() < 86400000).length,
    unresolved: events.filter((e) => !e.resolved).length,
  };

  const filteredEvents = events.filter((e) => filterSev === 'all' || e.severity === filterSev);

  const copy = (val: string, label?: string) => {
    navigator.clipboard.writeText(val);
    toast({ title: t('Copied', 'تم النسخ'), description: label });
  };

  const saveSecret = () => {
    try {
      if (secret) localStorage.setItem(SECRET_STORAGE_KEY, secret);
      else localStorage.removeItem(SECRET_STORAGE_KEY);
      toast({ title: t('Saved locally', 'تم الحفظ محلياً') });
    } catch {
      toast({ title: t('Error', 'خطأ'), variant: 'destructive' });
    }
  };

  const clearSecret = () => {
    setSecret('');
    try { localStorage.removeItem(SECRET_STORAGE_KEY); } catch {}
    toast({ title: t('Cleared', 'تم المسح') });
  };

  // Block non-admin / unapproved users from viewing security data
  if (authLoading) return null;
  if (!isAdmin || !isApproved) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> {t('Security Center', 'مركز الأمان')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Audit findings, live activity log, and webhook integration.', 'مراجعة النتائج، سجل النشاط المباشر، وتكامل الويب هوك.')}
          </p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('Refresh', 'تحديث')}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">{t('Open findings', 'مفتوحة')}</div><div className="text-2xl font-bold">{stats.open}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">{t('Critical', 'حرجة')}</div><div className="text-2xl font-bold text-destructive">{stats.critical}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">{t('Events (24h)', 'الأحداث (24س)')}</div><div className="text-2xl font-bold">{stats.events24h}</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-xs text-muted-foreground">{t('Unresolved', 'غير محلولة')}</div><div className="text-2xl font-bold">{stats.unresolved}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="findings">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="findings"><AlertTriangle className="h-4 w-4 mr-2" />{t('Findings', 'النتائج')}</TabsTrigger>
          <TabsTrigger value="events"><Activity className="h-4 w-4 mr-2" />{t('Activity Log', 'سجل النشاط')}</TabsTrigger>
          <TabsTrigger value="owasp"><ListChecks className="h-4 w-4 mr-2" />{t('OWASP 2025', 'OWASP 2025')}</TabsTrigger>
          <TabsTrigger value="headers"><Lock className="h-4 w-4 mr-2" />{t('Headers', 'الترويسات')}</TabsTrigger>
          <TabsTrigger value="injection"><Bug className="h-4 w-4 mr-2" />{t('Injection', 'الحقن')}</TabsTrigger>
          <TabsTrigger value="network"><Network className="h-4 w-4 mr-2" />{t('Network/TLS', 'الشبكة/TLS')}</TabsTrigger>
          <TabsTrigger value="blackbox"><Search className="h-4 w-4 mr-2" />{t('Black-Box', 'صندوق أسود')}</TabsTrigger>
          <TabsTrigger value="webhook">{t('Webhook Setup', 'إعداد الويب هوك')}</TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-3">
          {findings.map((f) => (
            <Card key={f.id} className={f.status === 'fixed' ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={sevColor(f.severity) as any}>{f.severity}</Badge>
                      <Badge variant="outline">{f.category}</Badge>
                      <code className="text-xs text-muted-foreground">{f.code}</code>
                    </div>
                    <CardTitle className="text-base mt-2">{f.title}</CardTitle>
                  </div>
                  <Select value={f.status} onValueChange={(v) => updateFinding(f.id, { status: v as any })}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('Open', 'مفتوحة')}</SelectItem>
                      <SelectItem value="ignored">{t('Ignored', 'متجاهلة')}</SelectItem>
                      <SelectItem value="fixed">{t('Fixed', 'مُصلحة')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{f.description}</p>
                {f.recommendation && (
                  <p className="text-sm border-l-2 border-primary pl-3 bg-muted/30 py-2 rounded">
                    <strong>{t('Recommendation: ', 'التوصية: ')}</strong>{f.recommendation}
                  </p>
                )}
                <Textarea
                  defaultValue={f.notes || ''}
                  placeholder={t('Admin notes…', 'ملاحظات المسؤول…')}
                  onBlur={(e) => e.target.value !== (f.notes || '') && updateFinding(f.id, { notes: e.target.value })}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          ))}
          {!loading && findings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
              {t('No findings', 'لا توجد نتائج')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={filterSev} onValueChange={setFilterSev}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All severities', 'كل الدرجات')}</SelectItem>
                <SelectItem value="critical">{t('Critical', 'حرجة')}</SelectItem>
                <SelectItem value="warning">{t('Warning', 'تحذير')}</SelectItem>
                <SelectItem value="info">{t('Info', 'معلومة')}</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filteredEvents.length} {t('events', 'حدث')}</span>
          </div>
          <div className="space-y-2">
            {filteredEvents.map((e) => (
              <Card key={e.id} className={e.resolved ? 'opacity-50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={sevColor(e.severity) as any}>{e.severity}</Badge>
                        <code className="text-xs text-muted-foreground">{e.event_type}</code>
                        <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), 'MMM d, HH:mm:ss')}</span>
                      </div>
                      <div className="font-medium text-sm mt-1">{e.title}</div>
                      {e.description && <div className="text-xs text-muted-foreground mt-1 break-all">{e.description}</div>}
                      {e.ip_address && <div className="text-xs text-muted-foreground">IP: {e.ip_address}</div>}
                    </div>
                    {!e.resolved && (
                      <Button size="sm" variant="ghost" onClick={() => markResolved(e.id)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-2" />
                {t('No events yet', 'لا توجد أحداث بعد')}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="owasp"><OwaspChecklist /></TabsContent>
        <TabsContent value="headers"><HeadersScanner /></TabsContent>
        <TabsContent value="injection"><InjectionScanner /></TabsContent>
        <TabsContent value="network"><NetworkProbe /></TabsContent>
        <TabsContent value="blackbox"><BlackBoxScan /></TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>{t('Database Webhook Setup', 'إعداد ويب هوك قاعدة البيانات')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{t('Configure Supabase Database Webhooks to send events to:', 'قم بإعداد ويب هوك قاعدة بيانات Supabase لإرسال الأحداث إلى:')}</p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded font-mono text-xs break-all">
                <span className="flex-1">{webhookUrl}</span>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: t('Copied', 'تم النسخ') }); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="font-medium mb-2">{t('Recommended tables to watch:', 'الجداول الموصى بها للمراقبة:')}</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><code>user_roles</code> — INSERT, UPDATE ({t('detect privilege escalation', 'كشف ترقية الصلاحيات')})</li>
                  <li><code>admin_activity_log</code> — INSERT</li>
                  <li><code>orders</code> — INSERT ({t('flag anonymous orders', 'تمييز الطلبات المجهولة')})</li>
                  <li><code>contact_submissions</code> — INSERT</li>
                  <li><code>marketer_applications</code> — INSERT</li>
                </ul>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                <div>
                  <p className="font-medium">{t('Optional webhook secret', 'سر الويب هوك (اختياري)')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'Set the SECURITY_WEBHOOK_SECRET edge function secret in Supabase, then mirror it here for testing. Leave blank to skip validation.',
                      'اضبط سر SECURITY_WEBHOOK_SECRET في دالة Supabase، ثم احفظه هنا للاختبار. اتركه فارغاً لتعطيل التحقق.'
                    )}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webhook-secret">{t('Secret value', 'قيمة السر')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="webhook-secret"
                      type={showSecret ? 'text' : 'password'}
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder={t('Paste or type secret…', 'الصق أو اكتب السر…')}
                      autoComplete="off"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowSecret((s) => !s)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Stored only in your browser (localStorage) — never sent to the server.', 'يُحفظ فقط في متصفحك (localStorage) ولا يُرسل إلى الخادم.')}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={saveSecret}><Save className="h-4 w-4 mr-2" />{t('Save', 'حفظ')}</Button>
                  <Button size="sm" variant="outline" onClick={clearSecret} disabled={!secret}>
                    <Trash2 className="h-4 w-4 mr-2" />{t('Clear', 'مسح')}
                  </Button>
                  <a
                    href={`https://supabase.com/dashboard/project/${projectId}/settings/functions`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('Manage edge function secrets', 'إدارة أسرار الدالة')}
                    </Button>
                  </a>
                </div>

                <div className="space-y-1.5">
                  <Label>{t('Header to send when testing', 'الترويسة المطلوب إرسالها عند الاختبار')}</Label>
                  <div className="flex items-center gap-2 p-2 bg-background border border-border rounded font-mono text-xs break-all">
                    <span className="flex-1">
                      x-webhook-secret: {secret ? (showSecret ? secret : '•'.repeat(Math.min(secret.length, 24))) : t('(none)', '(لا يوجد)')}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!secret}
                      onClick={() => copy(`x-webhook-secret: ${secret}`, t('Header copied', 'تم نسخ الترويسة'))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {secret && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => copy(secret, t('Value copied', 'تم نسخ القيمة'))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {t('Copy value only', 'نسخ القيمة فقط')}
                    </Button>
                  )}
                </div>
              </div>
              <a
                href={`https://supabase.com/dashboard/project/${projectId}/integrations/webhooks/overview`}
                target="_blank"
                rel="noreferrer"
                className="inline-block"
              >
                <Button variant="outline" size="sm">{t('Open Supabase Webhooks', 'فتح ويب هوك Supabase')}</Button>
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
