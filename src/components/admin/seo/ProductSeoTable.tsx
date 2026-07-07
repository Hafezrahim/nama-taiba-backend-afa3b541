import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Loader2,
  Package,
  Pencil,
  CheckCircle2,
  Search,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';

type ProductRow = {
  id: string;
  name_en: string | null;
  name_ar: string | null;
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  seo_keywords_en: string | null;
  seo_keywords_ar: string | null;
};

type SeoFields = Pick<
  ProductRow,
  | 'seo_title_en'
  | 'seo_title_ar'
  | 'seo_description_en'
  | 'seo_description_ar'
  | 'seo_keywords_en'
  | 'seo_keywords_ar'
>;

const PAGE_SIZE = 15;

// SEO best-practice limits
const LIMITS = {
  titleMin: 30,
  titleMax: 60,
  descMin: 70,
  descMax: 160,
  keywordsMax: 255,
};

const seoSchema = z.object({
  seo_title_en: z
    .string()
    .trim()
    .max(LIMITS.titleMax, `Title must be ≤ ${LIMITS.titleMax} chars`)
    .optional()
    .or(z.literal('')),
  seo_title_ar: z
    .string()
    .trim()
    .max(LIMITS.titleMax, `العنوان يجب ألا يتجاوز ${LIMITS.titleMax} حرفًا`)
    .optional()
    .or(z.literal('')),
  seo_description_en: z
    .string()
    .trim()
    .max(LIMITS.descMax, `Description must be ≤ ${LIMITS.descMax} chars`)
    .optional()
    .or(z.literal('')),
  seo_description_ar: z
    .string()
    .trim()
    .max(LIMITS.descMax, `الوصف يجب ألا يتجاوز ${LIMITS.descMax} حرفًا`)
    .optional()
    .or(z.literal('')),
  seo_keywords_en: z.string().trim().max(LIMITS.keywordsMax).optional().or(z.literal('')),
  seo_keywords_ar: z.string().trim().max(LIMITS.keywordsMax).optional().or(z.literal('')),
});

/** Counter chip with color states (under min = warn, over max = error). */
function Counter({
  value,
  min,
  max,
}: {
  value: string;
  min?: number;
  max: number;
}) {
  const len = (value || '').length;
  const over = len > max;
  const under = typeof min === 'number' && len > 0 && len < min;
  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        over
          ? 'text-destructive font-semibold'
          : under
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-muted-foreground'
      )}
    >
      {len}/{max}
      {min && !over && under ? ` · min ${min}` : ''}
    </span>
  );
}

export default function ProductSeoTable() {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>('');

  // Dialog edit state
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<SeoFields>({
    seo_title_en: '',
    seo_title_ar: '',
    seo_description_en: '',
    seo_description_ar: '',
    seo_keywords_en: '',
    seo_keywords_ar: '',
  });

  // Inline row edit state
  const [inlineId, setInlineId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<SeoFields>({
    seo_title_en: '',
    seo_title_ar: '',
    seo_description_en: '',
    seo_description_ar: '',
    seo_keywords_en: '',
    seo_keywords_ar: '',
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-product-seo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          'id,name_en,name_ar,seo_title_en,seo_title_ar,seo_description_en,seo_description_ar,seo_keywords_en,seo_keywords_ar'
        )
        .order('name_en', { ascending: true });
      if (error) throw error;
      return (data as ProductRow[]) || [];
    },
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name_en?.toLowerCase().includes(q) ||
        p.name_ar?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const mutation = useMutation({
    mutationFn: async (payload: SeoFields & { id: string }) => {
      const { id, ...updates } = payload;
      const parsed = seoSchema.safeParse(updates);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message || 'Invalid input');
      }
      const clean: Record<string, string | null> = {};
      (Object.keys(updates) as (keyof SeoFields)[]).forEach((k) => {
        const v = (updates[k] || '').toString().trim();
        clean[k] = v.length ? v : null;
      });
      const { error } = await supabase
        .from('products')
        .update(clean)
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: (payload) => {
      setSavingId(payload.id);
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-seo'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('Product SEO saved', 'تم حفظ سيو المنتج'), {
        description: t('Changes are now live.', 'التغييرات سارية الآن.'),
      });
      if (editing?.id === id) setEditing(null);
      if (inlineId === id) setInlineId(null);
    },
    onError: (e: any) =>
      toast.error(t('Failed to save', 'فشل الحفظ'), {
        description: e?.message,
      }),
    onSettled: () => setSavingId(null),
  });

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      seo_title_en: p.seo_title_en || '',
      seo_title_ar: p.seo_title_ar || '',
      seo_description_en: p.seo_description_en || '',
      seo_description_ar: p.seo_description_ar || '',
      seo_keywords_en: p.seo_keywords_en || '',
      seo_keywords_ar: p.seo_keywords_ar || '',
    });
  };

  const startInline = (p: ProductRow) => {
    setInlineId(p.id);
    setInlineForm({
      seo_title_en: p.seo_title_en || '',
      seo_title_ar: p.seo_title_ar || '',
      seo_description_en: p.seo_description_en || '',
      seo_description_ar: p.seo_description_ar || '',
      seo_keywords_en: p.seo_keywords_en || '',
      seo_keywords_ar: p.seo_keywords_ar || '',
    });
  };

  const validateForm = (f: SeoFields): string | null => {
    const parsed = seoSchema.safeParse(f);
    if (!parsed.success) return parsed.error.errors[0]?.message || 'Invalid';
    return null;
  };

  const handleDialogSave = () => {
    if (!editing) return;
    const err = validateForm(form);
    if (err) {
      toast.error(t('Validation error', 'خطأ في التحقق'), { description: err });
      return;
    }
    mutation.mutate({ id: editing.id, ...form });
  };

  const handleInlineSave = () => {
    if (!inlineId) return;
    const err = validateForm(inlineForm);
    if (err) {
      toast.error(t('Validation error', 'خطأ في التحقق'), { description: err });
      return;
    }
    mutation.mutate({ id: inlineId, ...inlineForm });
  };

  const handleLoadSelected = () => {
    const p = products?.find((x) => x.id === selectedId);
    if (p) openEdit(p);
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-sm">
      <CardHeader className="bg-muted/10 pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-primary" />
          {t('Product SEO', 'سيو المنتجات')}
        </CardTitle>
        <CardDescription>
          {t(
            `Recommended: title ${LIMITS.titleMin}–${LIMITS.titleMax} chars, description ${LIMITS.descMin}–${LIMITS.descMax} chars.`,
            `يفضّل: عنوان ${LIMITS.titleMin}–${LIMITS.titleMax} حرفًا، وصف ${LIMITS.descMin}–${LIMITS.descMax} حرفًا.`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Quick selector */}
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1 space-y-2">
            <Label>{t('Select product', 'اختر منتج')}</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t('Choose a product…', 'اختر منتجًا…')}
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {products?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {isArabic ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={handleLoadSelected} disabled={!selectedId}>
            <Pencil className="h-4 w-4 me-2" />
            {t('Open editor', 'فتح المحرر')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search products…', 'بحث في المنتجات…')}
            className="ps-9"
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">{t('Product', 'المنتج')}</TableHead>
                <TableHead className="min-w-[220px]">{t('SEO Title (EN)', 'عنوان السيو (EN)')}</TableHead>
                <TableHead className="min-w-[220px]">{t('SEO Title (AR)', 'عنوان السيو (AR)')}</TableHead>
                <TableHead className="min-w-[260px]">{t('Description (EN)', 'الوصف (EN)')}</TableHead>
                <TableHead className="min-w-[260px]">{t('Description (AR)', 'الوصف (AR)')}</TableHead>
                <TableHead className="min-w-[180px]">{t('Keywords (EN)', 'الكلمات (EN)')}</TableHead>
                <TableHead className="min-w-[180px]">{t('Keywords (AR)', 'الكلمات (AR)')}</TableHead>
                <TableHead className="text-end min-w-[140px]">{t('Actions', 'إجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('No products found', 'لا توجد منتجات')}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((p) => {
                  const isInline = inlineId === p.id;
                  const isSaving = savingId === p.id;
                  return (
                    <TableRow key={p.id} className={cn(isInline && 'bg-muted/30 align-top')}>
                      <TableCell className="font-medium align-top">
                        {isArabic ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                      </TableCell>

                      {/* Title EN */}
                      <TableCell className="align-top">
                        {isInline ? (
                          <div className="space-y-1">
                            <Input
                              dir="ltr"
                              value={inlineForm.seo_title_en || ''}
                              onChange={(e) =>
                                setInlineForm((f) => ({ ...f, seo_title_en: e.target.value }))
                              }
                              className="h-8 text-sm"
                            />
                            <Counter
                              value={inlineForm.seo_title_en || ''}
                              min={LIMITS.titleMin}
                              max={LIMITS.titleMax}
                            />
                          </div>
                        ) : (
                          <TruncCell value={p.seo_title_en} />
                        )}
                      </TableCell>

                      {/* Title AR */}
                      <TableCell className="align-top" dir="rtl">
                        {isInline ? (
                          <div className="space-y-1">
                            <Input
                              dir="rtl"
                              value={inlineForm.seo_title_ar || ''}
                              onChange={(e) =>
                                setInlineForm((f) => ({ ...f, seo_title_ar: e.target.value }))
                              }
                              className="h-8 text-sm"
                            />
                            <Counter
                              value={inlineForm.seo_title_ar || ''}
                              min={LIMITS.titleMin}
                              max={LIMITS.titleMax}
                            />
                          </div>
                        ) : (
                          <TruncCell value={p.seo_title_ar} />
                        )}
                      </TableCell>

                      {/* Desc EN */}
                      <TableCell className="align-top">
                        {isInline ? (
                          <div className="space-y-1">
                            <Textarea
                              dir="ltr"
                              rows={2}
                              value={inlineForm.seo_description_en || ''}
                              onChange={(e) =>
                                setInlineForm((f) => ({
                                  ...f,
                                  seo_description_en: e.target.value,
                                }))
                              }
                              className="text-sm min-h-[56px]"
                            />
                            <Counter
                              value={inlineForm.seo_description_en || ''}
                              min={LIMITS.descMin}
                              max={LIMITS.descMax}
                            />
                          </div>
                        ) : (
                          <TruncCell value={p.seo_description_en} lines={2} />
                        )}
                      </TableCell>

                      {/* Desc AR */}
                      <TableCell className="align-top" dir="rtl">
                        {isInline ? (
                          <div className="space-y-1">
                            <Textarea
                              dir="rtl"
                              rows={2}
                              value={inlineForm.seo_description_ar || ''}
                              onChange={(e) =>
                                setInlineForm((f) => ({
                                  ...f,
                                  seo_description_ar: e.target.value,
                                }))
                              }
                              className="text-sm min-h-[56px]"
                            />
                            <Counter
                              value={inlineForm.seo_description_ar || ''}
                              min={LIMITS.descMin}
                              max={LIMITS.descMax}
                            />
                          </div>
                        ) : (
                          <TruncCell value={p.seo_description_ar} lines={2} />
                        )}
                      </TableCell>

                      {/* Keywords EN */}
                      <TableCell className="align-top">
                        {isInline ? (
                          <div className="space-y-1">
                            <Input
                              dir="ltr"
                              value={inlineForm.seo_keywords_en || ''}
                              onChange={(e) =>
                                setInlineForm((f) => ({
                                  ...f,
                                  seo_keywords_en: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                              placeholder="kw1, kw2"
                            />
                            <Counter
                              value={inlineForm.seo_keywords_en || ''}
                              max={LIMITS.keywordsMax}
                            />
                          </div>
                        ) : (
                          <TruncCell value={p.seo_keywords_en} />
                        )}
                      </TableCell>

                      {/* Keywords AR */}
                      <TableCell className="align-top" dir="rtl">
                        {isInline ? (
                          <div className="space-y-1">
                            <Input
                              dir="rtl"
                              value={inlineForm.seo_keywords_ar || ''}
                              onChange={(e) =>
                                setInlineForm((f) => ({
                                  ...f,
                                  seo_keywords_ar: e.target.value,
                                }))
                              }
                              className="h-8 text-sm"
                              placeholder="ك1، ك2"
                            />
                            <Counter
                              value={inlineForm.seo_keywords_ar || ''}
                              max={LIMITS.keywordsMax}
                            />
                          </div>
                        ) : (
                          <TruncCell value={p.seo_keywords_ar} />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-end align-top">
                        {isInline ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={handleInlineSave}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInlineId(null)}
                              disabled={isSaving}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startInline(p)}
                              title={t('Inline edit', 'تحرير مباشر')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(p)}
                              title={t('Open dialog', 'فتح النافذة')}
                            >
                              {t('Full', 'كامل')}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('Page', 'صفحة')} {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('Prev', 'السابق')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('Next', 'التالي')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Full edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('Edit Product SEO', 'تحرير سيو المنتج')}
              {editing && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  {isArabic
                    ? editing.name_ar || editing.name_en
                    : editing.name_en || editing.name_ar}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                'Bilingual meta fields used on the product page. Follow the recommended limits for the best search preview.',
                'حقول ميتا ثنائية اللغة تُستخدم في صفحة المنتج. التزم بالحدود الموصى بها للحصول على أفضل معاينة في البحث.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock
                label={t('SEO Title (English)', 'عنوان السيو (إنجليزي)')}
                dir="ltr"
                value={form.seo_title_en || ''}
                onChange={(v) => setForm((f) => ({ ...f, seo_title_en: v }))}
                min={LIMITS.titleMin}
                max={LIMITS.titleMax}
                placeholder="Product name | Brand"
              />
              <FieldBlock
                label={t('SEO Title (Arabic)', 'عنوان السيو (عربي)')}
                dir="rtl"
                value={form.seo_title_ar || ''}
                onChange={(v) => setForm((f) => ({ ...f, seo_title_ar: v }))}
                min={LIMITS.titleMin}
                max={LIMITS.titleMax}
                placeholder="اسم المنتج | العلامة"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock
                label={t('Meta Description (English)', 'الوصف التعريفي (إنجليزي)')}
                dir="ltr"
                value={form.seo_description_en || ''}
                onChange={(v) => setForm((f) => ({ ...f, seo_description_en: v }))}
                min={LIMITS.descMin}
                max={LIMITS.descMax}
                textarea
              />
              <FieldBlock
                label={t('Meta Description (Arabic)', 'الوصف التعريفي (عربي)')}
                dir="rtl"
                value={form.seo_description_ar || ''}
                onChange={(v) => setForm((f) => ({ ...f, seo_description_ar: v }))}
                min={LIMITS.descMin}
                max={LIMITS.descMax}
                textarea
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock
                label={t('Keywords (English)', 'الكلمات (إنجليزي)')}
                dir="ltr"
                value={form.seo_keywords_en || ''}
                onChange={(v) => setForm((f) => ({ ...f, seo_keywords_en: v }))}
                max={LIMITS.keywordsMax}
                textarea
                hint={t('Separate with commas', 'افصل بينها بفواصل')}
              />
              <FieldBlock
                label={t('Keywords (Arabic)', 'الكلمات (عربي)')}
                dir="rtl"
                value={form.seo_keywords_ar || ''}
                onChange={(v) => setForm((f) => ({ ...f, seo_keywords_ar: v }))}
                max={LIMITS.keywordsMax}
                textarea
                hint={t('Separate with commas', 'افصل بينها بفواصل')}
              />
            </div>

            {/* Validation summary */}
            {(() => {
              const err = validateForm(form);
              if (!err) return null;
              return (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 text-destructive p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button
              onClick={handleDialogSave}
              disabled={mutation.isPending || !!validateForm(form)}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 me-2" />
              )}
              {t('Save changes', 'حفظ التغييرات')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TruncCell({
  value,
  lines = 1,
}: {
  value: string | null;
  lines?: number;
}) {
  if (!value) {
    return (
      <span className="italic text-muted-foreground/60 text-sm">—</span>
    );
  }
  return (
    <span
      className={cn(
        'text-sm text-muted-foreground block',
        lines === 1 ? 'truncate max-w-[220px]' : 'line-clamp-2 max-w-[280px]'
      )}
      title={value}
    >
      {value}
    </span>
  );
}

function FieldBlock({
  label,
  value,
  onChange,
  dir,
  min,
  max,
  placeholder,
  textarea,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir: 'ltr' | 'rtl';
  min?: number;
  max: number;
  placeholder?: string;
  textarea?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <Counter value={value} min={min} max={max} />
      </div>
      {textarea ? (
        <Textarea
          dir={dir}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Input
          dir={dir}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
