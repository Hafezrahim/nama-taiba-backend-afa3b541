import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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
import { Loader2, Package, Pencil, CheckCircle2, Search } from 'lucide-react';

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

const PAGE_SIZE = 15;

export default function ProductSeoTable() {
  const { t, language } = useLanguage();
  const isArabic = language === "ar";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>('');
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<Partial<ProductRow>>({});

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
    mutationFn: async (payload: Partial<ProductRow> & { id: string }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-seo'] });
      toast.success(t('Product SEO updated', 'تم تحديث سيو المنتج'));
      setEditing(null);
    },
    onError: (e: any) =>
      toast.error(e?.message || t('Failed to update', 'فشل التحديث')),
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

  const handleSave = () => {
    if (!editing) return;
    mutation.mutate({ id: editing.id, ...form });
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
            'Select a product and edit its bilingual SEO title, description, and keywords.',
            'اختر منتجًا وحرر عنوان ووصف وكلمات السيو الخاصة به بالعربية والإنجليزية.'
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
          <Button
            type="button"
            onClick={handleLoadSelected}
            disabled={!selectedId}
          >
            <Pencil className="h-4 w-4 me-2" />
            {t('Edit SEO', 'تحرير السيو')}
          </Button>
        </div>

        {/* Search + Table */}
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search products…', 'بحث في المنتجات…')}
              className="ps-9"
            />
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Product', 'المنتج')}</TableHead>
                  <TableHead>{t('SEO Title (EN)', 'عنوان السيو (EN)')}</TableHead>
                  <TableHead>{t('SEO Title (AR)', 'عنوان السيو (AR)')}</TableHead>
                  <TableHead>{t('Keywords (EN)', 'الكلمات (EN)')}</TableHead>
                  <TableHead>{t('Keywords (AR)', 'الكلمات (AR)')}</TableHead>
                  <TableHead className="text-end">
                    {t('Actions', 'إجراءات')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t('No products found', 'لا توجد منتجات')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {isArabic
                          ? p.name_ar || p.name_en
                          : p.name_en || p.name_ar}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {p.seo_title_en || (
                          <span className="italic opacity-60">
                            {t('— empty —', '— فارغ —')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground" dir="rtl">
                        {p.seo_title_ar || (
                          <span className="italic opacity-60">
                            {t('— empty —', '— فارغ —')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {p.seo_keywords_en || '—'}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground" dir="rtl">
                        {p.seo_keywords_ar || '—'}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5 me-1.5" />
                          {t('Edit', 'تحرير')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
        </div>
      </CardContent>

      {/* Edit dialog */}
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
                'Bilingual meta fields used on the product page.',
                'حقول ميتا ثنائية اللغة تُستخدم في صفحة المنتج.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('SEO Title (English)', 'عنوان السيو (إنجليزي)')}</Label>
                <Input
                  dir="ltr"
                  value={form.seo_title_en || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seo_title_en: e.target.value }))
                  }
                  placeholder="Product name | Brand"
                />
                <p className="text-xs text-muted-foreground">
                  {(form.seo_title_en || '').length}/60
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('SEO Title (Arabic)', 'عنوان السيو (عربي)')}</Label>
                <Input
                  dir="rtl"
                  value={form.seo_title_ar || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seo_title_ar: e.target.value }))
                  }
                  placeholder="اسم المنتج | العلامة"
                />
                <p className="text-xs text-muted-foreground">
                  {(form.seo_title_ar || '').length}/60
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t('Meta Description (English)', 'الوصف التعريفي (إنجليزي)')}
                </Label>
                <Textarea
                  dir="ltr"
                  rows={3}
                  value={form.seo_description_en || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      seo_description_en: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {(form.seo_description_en || '').length}/160
                </p>
              </div>
              <div className="space-y-2">
                <Label>
                  {t('Meta Description (Arabic)', 'الوصف التعريفي (عربي)')}
                </Label>
                <Textarea
                  dir="rtl"
                  rows={3}
                  value={form.seo_description_ar || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      seo_description_ar: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {(form.seo_description_ar || '').length}/160
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('Keywords (English)', 'الكلمات (إنجليزي)')}</Label>
                <Textarea
                  dir="ltr"
                  rows={2}
                  value={form.seo_keywords_en || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seo_keywords_en: e.target.value }))
                  }
                  placeholder="grc panels, construction, saudi"
                />
                <p className="text-xs text-muted-foreground">
                  {t('Separate with commas', 'افصل بينها بفواصل')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t('Keywords (Arabic)', 'الكلمات (عربي)')}</Label>
                <Textarea
                  dir="rtl"
                  rows={2}
                  value={form.seo_keywords_ar || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, seo_keywords_ar: e.target.value }))
                  }
                  placeholder="ألواح جي ار سي، بناء، السعودية"
                />
                <p className="text-xs text-muted-foreground">
                  {t('Separate with commas', 'افصل بينها بفواصل')}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 me-2" />
              )}
              {t('Save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
