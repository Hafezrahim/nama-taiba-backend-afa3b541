import { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tags, X, Plus, AlertTriangle, Wand2, ArrowRight } from 'lucide-react';
import {
  parseKeywords,
  serializeKeywords,
  findDuplicateKeywords,
  suggestCorrections,
  arabicLayoutToEnglish,
  englishLayoutToArabic,
} from '@/lib/smartSearch';

interface KeywordFieldProps {
  label: string;
  dir: 'ltr' | 'rtl';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

const MAX_RECOMMENDED = 15;

function KeywordField({ label, dir, placeholder, value, onChange }: KeywordFieldProps) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState('');
  const keywords = useMemo(() => parseKeywords(value), [value]);
  const duplicates = useMemo(() => findDuplicateKeywords(keywords), [keywords]);

  const commit = (next: string[]) => onChange(serializeKeywords(next));

  const addDraft = () => {
    const additions = parseKeywords(draft);
    if (!additions.length) return;
    commit([...keywords, ...additions]);
    setDraft('');
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-primary">{label}</Label>
        <span className={`text-xs ${keywords.length > MAX_RECOMMENDED ? 'text-destructive' : 'text-muted-foreground'}`}>
          {keywords.length}/{MAX_RECOMMENDED} {t('keywords', 'كلمة')}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          dir={dir}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addDraft();
            }
          }}
          className="bg-white dark:bg-background"
        />
        <Button type="button" variant="secondary" onClick={addDraft} disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[2rem]" dir={dir}>
        {keywords.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('No keywords yet.', 'لا توجد كلمات مفتاحية بعد.')}</p>
        )}
        {keywords.map((kw, i) => (
          <Badge key={`${kw}-${i}`} variant="secondary" className="gap-1 py-1 pr-1 text-sm">
            {kw}
            <button
              type="button"
              aria-label={t(`Remove ${kw}`, `إزالة ${kw}`)}
              onClick={() => commit(keywords.filter((_, idx) => idx !== i))}
              className="rounded-full p-0.5 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {duplicates.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t('Duplicate keywords: ', 'كلمات مكررة: ')}
            {duplicates.join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface SeoKeywordsManagerProps {
  keywordsEn: string;
  keywordsAr: string;
  onChange: (next: { en: string; ar: string }) => void;
  /** Extra dictionary terms (product names, blog titles) used by the suggestion tester. */
  extraTerms?: string[];
}

export default function SeoKeywordsManager({
  keywordsEn,
  keywordsAr,
  onChange,
  extraTerms = [],
}: SeoKeywordsManagerProps) {
  const { t } = useLanguage();
  const [testQuery, setTestQuery] = useState('');

  const dictionary = useMemo(
    () => [...parseKeywords(keywordsEn), ...parseKeywords(keywordsAr), ...extraTerms],
    [keywordsEn, keywordsAr, extraTerms]
  );

  const suggestions = useMemo(
    () => suggestCorrections(testQuery, dictionary),
    [testQuery, dictionary]
  );

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tags className="h-5 w-5 text-primary" />
            {t('Bilingual Keywords Manager', 'إدارة الكلمات المفتاحية ثنائية اللغة')}
          </CardTitle>
          <CardDescription>
            {t(
              'Add, remove and de-duplicate the keywords used across your site meta tags in English and Arabic.',
              'أضف وأزل ونقّح الكلمات المفتاحية المستخدمة في العلامات الوصفية للموقع بالإنجليزية والعربية.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
          <KeywordField
            label={t('Keywords (English)', 'الكلمات المفتاحية (إنجليزي)')}
            dir="ltr"
            placeholder="building materials"
            value={keywordsEn}
            onChange={(en) => onChange({ en, ar: keywordsAr })}
          />
          <KeywordField
            label={t('Keywords (Arabic)', 'الكلمات المفتاحية (عربي)')}
            dir="rtl"
            placeholder="مواد بناء"
            value={keywordsAr}
            onChange={(ar) => onChange({ en: keywordsEn, ar })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-5 w-5 text-primary" />
            {t('"Did you mean" Tester', 'اختبار "هل تقصد"')}
          </CardTitle>
          <CardDescription>
            {t(
              'Type a query the wrong-keyboard way (e.g. "شححمث" for "apple") and see the correction visitors will get on the site search.',
              'اكتب كلمة بلوحة مفاتيح خاطئة (مثل "شححمث" بدلاً من "apple") لترى الاقتراح الذي سيظهر للزوار في بحث الموقع.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Input
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder={t('Try: شححمث', 'جرّب: شححمث')}
          />

          {testQuery.trim().length > 1 && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">{t('Read as English layout', 'قراءة كلوحة إنجليزية')}</p>
                  <p className="font-mono" dir="ltr">{arabicLayoutToEnglish(testQuery)}</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">{t('Read as Arabic layout', 'قراءة كلوحة عربية')}</p>
                  <p className="font-mono" dir="rtl">{englishLayoutToArabic(testQuery)}</p>
                </div>
              </div>

              {suggestions.length > 0 ? (
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div key={s.suggestion} className="flex items-center gap-2 rounded-lg border p-3">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">{s.suggestion}</span>
                      <Badge variant="outline" className="ms-auto text-xs">
                        {s.reason === 'layout'
                          ? t('Keyboard layout', 'لوحة مفاتيح خاطئة')
                          : t('Typo', 'خطأ إملائي')}{' '}
                        · {Math.round(s.score * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('No suggestion — the query already matches or is too different.', 'لا يوجد اقتراح — الاستعلام مطابق بالفعل أو مختلف تمامًا.')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
