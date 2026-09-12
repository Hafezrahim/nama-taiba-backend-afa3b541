import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  Bot, MessageSquareQuote, MapPin, Sparkles, Plus, Trash2, Copy, Download,
  CheckCircle2, AlertTriangle, Mic,
} from 'lucide-react';

export interface AeoFaq {
  q_en: string;
  q_ar: string;
  a_en: string;
  a_ar: string;
}

interface Props {
  values: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
  onSave: () => void;
  saving?: boolean;
}

/** Answer-engine sweet spot: a direct answer of ~40-60 words. */
const ANSWER_MIN_WORDS = 25;
const ANSWER_MAX_WORDS = 75;

const AI_CRAWLERS: { id: string; agent: string; label: string }[] = [
  { id: 'gptbot', agent: 'GPTBot', label: 'ChatGPT (OpenAI)' },
  { id: 'oai_searchbot', agent: 'OAI-SearchBot', label: 'ChatGPT Search' },
  { id: 'claudebot', agent: 'ClaudeBot', label: 'Claude (Anthropic)' },
  { id: 'perplexity', agent: 'PerplexityBot', label: 'Perplexity' },
  { id: 'google_extended', agent: 'Google-Extended', label: 'Google Gemini / AI Overviews' },
  { id: 'applebot_extended', agent: 'Applebot-Extended', label: 'Apple Intelligence' },
  { id: 'ccbot', agent: 'CCBot', label: 'Common Crawl' },
  { id: 'bytespider', agent: 'Bytespider', label: 'TikTok / ByteDance' },
];

const wordCount = (s: string) => (s || '').trim().split(/\s+/).filter(Boolean).length;

export const parseFaqs = (raw: string): AeoFaq[] => {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function SeoAeoGeoTools({ values, onChange, onSave, saving }: Props) {
  const { t } = useLanguage();
  const faqs = useMemo(() => parseFaqs(values.aeo_faqs), [values.aeo_faqs]);
  const [copied, setCopied] = useState<string | null>(null);

  const setFaqs = (next: AeoFaq[]) => onChange({ aeo_faqs: JSON.stringify(next) });

  const updateFaq = (index: number, patch: Partial<AeoFaq>) =>
    setFaqs(faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const allowedCrawlers = useMemo(
    () => new Set((values.geo_ai_crawlers || AI_CRAWLERS.map(c => c.id).join(',')).split(',').map(s => s.trim()).filter(Boolean)),
    [values.geo_ai_crawlers]
  );

  const toggleCrawler = (id: string, allow: boolean) => {
    const next = new Set(allowedCrawlers);
    allow ? next.add(id) : next.delete(id);
    onChange({ geo_ai_crawlers: Array.from(next).join(',') });
  };

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(t('Copied to clipboard', 'تم النسخ'));
    setTimeout(() => setCopied(null), 1500);
  };

  const download = (name: string, text: string, type = 'text/plain') => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const siteUrl = (values.meta_canonical_url || 'https://www.nama-taiba.com').replace(/\/$/, '');

  /* ---------- Generated artefacts ---------- */

  const robotsBlock = useMemo(() => {
    const lines = ['# AI / answer-engine crawlers'];
    AI_CRAWLERS.forEach(c => {
      lines.push(`User-agent: ${c.agent}`);
      lines.push(allowedCrawlers.has(c.id) ? 'Allow: /' : 'Disallow: /');
      lines.push('');
    });
    lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
    return lines.join('\n');
  }, [allowedCrawlers, siteUrl]);

  const llmsTxt = useMemo(() => {
    const summary = values.geo_entity_summary_en || '';
    const summaryAr = values.geo_entity_summary_ar || '';
    const lines = [
      `# ${values.seo_title_en || 'Nama Taiba Factory'}`,
      '',
      `> ${summary || values.seo_description_en || ''}`,
      '',
      summaryAr ? `## نبذة\n\n${summaryAr}\n` : '',
      '## Key pages',
      `- [Products](${siteUrl}/products): full catalogue with specifications and prices`,
      `- [Projects](${siteUrl}/projects): delivered reference projects`,
      `- [Services](${siteUrl}/services): manufacturing and installation services`,
      `- [Quality](${siteUrl}/quality): standards, testing and certifications`,
      `- [Blog](${siteUrl}/blog): technical articles and guides`,
      `- [Contact](${siteUrl}/contact): quotations and enquiries`,
      '',
      '## Frequently asked questions',
      ...faqs.filter(f => f.q_en && f.a_en).map(f => `- **${f.q_en}** ${f.a_en}`),
      '',
      values.geo_service_areas ? `## Service areas\n\n${values.geo_service_areas}` : '',
    ];
    return lines.filter(l => l !== '').join('\n');
  }, [values, faqs, siteUrl]);

  const faqJsonLd = useMemo(() => {
    const list = faqs.filter(f => (f.q_en && f.a_en) || (f.q_ar && f.a_ar));
    if (!list.length) return '';
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: list.map(f => ({
          '@type': 'Question',
          name: f.q_en || f.q_ar,
          inLanguage: f.q_en ? 'en' : 'ar',
          acceptedAnswer: { '@type': 'Answer', text: f.a_en || f.a_ar },
        })),
      },
      null,
      2
    );
  }, [faqs]);

  const geoJsonLd = useMemo(() => {
    const areas = (values.geo_service_areas || '')
      .split(/[,،\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: values.seo_title_en || 'Nama Taiba Factory',
        url: siteUrl,
        description: values.geo_entity_summary_en || values.seo_description_en || '',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'SA',
          addressRegion: values.geo_region || 'SA',
          addressLocality: values.geo_placename || '',
        },
        ...(values.geo_lat && values.geo_lng
          ? { geo: { '@type': 'GeoCoordinates', latitude: values.geo_lat, longitude: values.geo_lng } }
          : {}),
        ...(areas.length ? { areaServed: areas.map(a => ({ '@type': 'City', name: a })) } : {}),
      },
      null,
      2
    );
  }, [values, siteUrl]);

  const CopyRow = ({ id, text, filename }: { id: string; text: string; filename?: string }) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => copy(id, text)}>
        {copied === id ? <CheckCircle2 className="h-4 w-4 me-2 text-green-600" /> : <Copy className="h-4 w-4 me-2" />}
        {t('Copy', 'نسخ')}
      </Button>
      {filename && (
        <Button type="button" variant="outline" size="sm" onClick={() => download(filename, text)}>
          <Download className="h-4 w-4 me-2" />
          {t('Download', 'تنزيل')} {filename}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ============ AEO ============ */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquareQuote className="h-5 w-5 text-primary" />
            {t('AEO — Answer Engine Optimization', 'AEO — تحسين محركات الإجابة')}
          </CardTitle>
          <CardDescription>
            {t(
              'Short, direct answers that Google AI Overviews, ChatGPT and voice assistants can quote. Published as FAQ structured data.',
              'إجابات قصيرة ومباشرة يمكن لمحركات الذكاء الاصطناعي والمساعدات الصوتية اقتباسها. تُنشر كبيانات منظمة للأسئلة الشائعة.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {!faqs.length && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('No questions yet. Add the questions customers actually ask.', 'لا توجد أسئلة بعد. أضف الأسئلة التي يطرحها العملاء فعلياً.')}
              </AlertDescription>
            </Alert>
          )}

          <Accordion type="multiple" className="space-y-2">
            {faqs.map((faq, i) => {
              const wEn = wordCount(faq.a_en);
              const wAr = wordCount(faq.a_ar);
              const ok = (n: number) => n === 0 || (n >= ANSWER_MIN_WORDS && n <= ANSWER_MAX_WORDS);
              return (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-start">
                      <Badge variant="outline">{i + 1}</Badge>
                      <span className="text-sm font-medium truncate max-w-[46ch]">
                        {faq.q_en || faq.q_ar || t('Untitled question', 'سؤال بدون عنوان')}
                      </span>
                      {(!ok(wEn) || !ok(wAr)) && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('Question (English)', 'السؤال (إنجليزي)')}</Label>
                        <Input dir="ltr" value={faq.q_en} onChange={e => updateFaq(i, { q_en: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Question (Arabic)', 'السؤال (عربي)')}</Label>
                        <Input dir="rtl" value={faq.q_ar} onChange={e => updateFaq(i, { q_ar: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{t('Answer (English)', 'الإجابة (إنجليزي)')}</Label>
                          <span className={`text-xs ${ok(wEn) ? 'text-muted-foreground' : 'text-amber-600'}`}>
                            {wEn} {t('words', 'كلمة')}
                          </span>
                        </div>
                        <Textarea dir="ltr" rows={4} value={faq.a_en} onChange={e => updateFaq(i, { a_en: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>{t('Answer (Arabic)', 'الإجابة (عربي)')}</Label>
                          <span className={`text-xs ${ok(wAr) ? 'text-muted-foreground' : 'text-amber-600'}`}>
                            {wAr} {t('words', 'كلمة')}
                          </span>
                        </div>
                        <Textarea dir="rtl" rows={4} value={faq.a_ar} onChange={e => updateFaq(i, { a_ar: e.target.value })} />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4 me-2" />
                      {t('Remove question', 'حذف السؤال')}
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Button
            type="button"
            variant="outline"
            onClick={() => setFaqs([...faqs, { q_en: '', q_ar: '', a_en: '', a_ar: '' }])}
          >
            <Plus className="h-4 w-4 me-2" />
            {t('Add question', 'إضافة سؤال')}
          </Button>

          <p className="text-xs text-muted-foreground">
            {t(
              `Aim for ${ANSWER_MIN_WORDS}-${ANSWER_MAX_WORDS} words per answer: long enough to be complete, short enough to be quoted.`,
              `استهدف ${ANSWER_MIN_WORDS}-${ANSWER_MAX_WORDS} كلمة لكل إجابة: كافية للتوضيح وقصيرة بما يكفي للاقتباس.`
            )}
          </p>

          {faqJsonLd && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t('FAQPage structured data', 'بيانات الأسئلة الشائعة المنظمة')}</Label>
              <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-auto max-h-56" dir="ltr">{faqJsonLd}</pre>
              <CopyRow id="faq-jsonld" text={faqJsonLd} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============ Voice / speakable ============ */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5 text-primary" />
            {t('Voice search (Speakable)', 'البحث الصوتي (Speakable)')}
          </CardTitle>
          <CardDescription>
            {t('CSS selectors voice assistants may read aloud from your pages.', 'محددات CSS التي يمكن للمساعدات الصوتية قراءتها من صفحاتك.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-2">
          <Label>{t('Selectors (comma separated)', 'المحددات (مفصولة بفواصل)')}</Label>
          <Input
            dir="ltr"
            placeholder="h1, .hero-subtitle, .faq-answer"
            value={values.aeo_speakable || ''}
            onChange={e => onChange({ aeo_speakable: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* ============ GEO — generative engines ============ */}
      <Card className="border-t-4 border-t-accent shadow-sm">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-accent" />
            {t('GEO — Generative Engine Optimization', 'GEO — تحسين محركات الذكاء التوليدي')}
          </CardTitle>
          <CardDescription>
            {t(
              'Control which AI assistants may read the site, and give them a clear summary to cite.',
              'تحكم في مساعدات الذكاء الاصطناعي المسموح لها بقراءة الموقع، وزودها بملخص واضح للاقتباس.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {AI_CRAWLERS.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.label}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{c.agent}</p>
                </div>
                <Switch checked={allowedCrawlers.has(c.id)} onCheckedChange={v => toggleCrawler(c.id, v)} />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('robots.txt block', 'كتلة robots.txt')}</Label>
            <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-auto max-h-56" dir="ltr">{robotsBlock}</pre>
            <CopyRow id="robots" text={robotsBlock} filename="robots-ai.txt" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('Entity summary (English)', 'ملخص الجهة (إنجليزي)')}</Label>
              <Textarea
                dir="ltr"
                rows={4}
                placeholder="Nama Taiba Factory manufactures GRC, GRP and precast building materials in Saudi Arabia..."
                value={values.geo_entity_summary_en || ''}
                onChange={e => onChange({ geo_entity_summary_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Entity summary (Arabic)', 'ملخص الجهة (عربي)')}</Label>
              <Textarea
                dir="rtl"
                rows={4}
                value={values.geo_entity_summary_ar || ''}
                onChange={e => onChange({ geo_entity_summary_ar: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              {t('llms.txt for AI assistants', 'ملف llms.txt لمساعدات الذكاء الاصطناعي')}
            </Label>
            <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-auto max-h-64" dir="ltr">{llmsTxt}</pre>
            <CopyRow id="llms" text={llmsTxt} filename="llms.txt" />
          </div>
        </CardContent>
      </Card>

      {/* ============ Local / geo targeting ============ */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {t('Local & geographic targeting', 'الاستهداف المحلي والجغرافي')}
          </CardTitle>
          <CardDescription>
            {t('Tells search engines where you operate — drives local and map results.', 'يخبر محركات البحث بأماكن عملك — يحسّن نتائج البحث المحلي والخرائط.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('Region code', 'رمز المنطقة')}</Label>
              <Input dir="ltr" placeholder="SA-01" value={values.geo_region || ''} onChange={e => onChange({ geo_region: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('City / place name', 'المدينة / اسم المكان')}</Label>
              <Input placeholder="Riyadh" value={values.geo_placename || ''} onChange={e => onChange({ geo_placename: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('Latitude', 'خط العرض')}</Label>
              <Input dir="ltr" placeholder="24.7136" value={values.geo_lat || ''} onChange={e => onChange({ geo_lat: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('Longitude', 'خط الطول')}</Label>
              <Input dir="ltr" placeholder="46.6753" value={values.geo_lng || ''} onChange={e => onChange({ geo_lng: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('Service areas (comma separated)', 'مناطق الخدمة (مفصولة بفواصل)')}</Label>
            <Textarea
              rows={2}
              placeholder="Riyadh, Jeddah, Madinah, Dammam"
              value={values.geo_service_areas || ''}
              onChange={e => onChange({ geo_service_areas: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('LocalBusiness structured data', 'بيانات النشاط المحلي المنظمة')}</Label>
            <pre className="text-xs bg-muted/50 border rounded-lg p-3 overflow-auto max-h-56" dir="ltr">{geoJsonLd}</pre>
            <CopyRow id="geo-jsonld" text={geoJsonLd} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving} size="lg" className="px-8">
          <CheckCircle2 className="me-2 h-5 w-5" />
          {t('Save AEO & GEO settings', 'حفظ إعدادات AEO و GEO')}
        </Button>
      </div>
    </div>
  );
}
