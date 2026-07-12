import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface QualitySection {
  id: string;
  title_en: string;
  title_ar: string;
  content_en: string | null;
  content_ar: string | null;
  display_order: number;
  is_active: boolean;
}

const emptyForm = {
  id: '',
  title_en: '',
  title_ar: '',
  content_en: '',
  content_ar: '',
  display_order: 0,
  is_active: true,
};

export default function AdminQuality() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['admin-quality-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as QualitySection[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof emptyForm) => {
      const { id, ...body } = payload;
      if (id) {
        const { error } = await supabase.from('quality_sections').update(body).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quality_sections').insert([body]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-quality-sections'] });
      qc.invalidateQueries({ queryKey: ['quality-sections'] });
      toast.success(t('Saved successfully', 'تم الحفظ بنجاح'));
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quality_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-quality-sections'] });
      qc.invalidateQueries({ queryKey: ['quality-sections'] });
      toast.success(t('Deleted successfully', 'تم الحذف بنجاح'));
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = async (row: QualitySection) => {
    const { error } = await supabase
      .from('quality_sections')
      .update({ is_active: !row.is_active })
      .eq('id', row.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ['admin-quality-sections'] });
    qc.invalidateQueries({ queryKey: ['quality-sections'] });
  };

  const openCreate = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (row: QualitySection) => {
    setForm({
      id: row.id,
      title_en: row.title_en,
      title_ar: row.title_ar,
      content_en: row.content_en || '',
      content_ar: row.content_ar || '',
      display_order: row.display_order,
      is_active: row.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_en.trim() || !form.title_ar.trim()) {
      return toast.error(t('Title (EN & AR) is required', 'العنوان (EN و AR) مطلوب'));
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Quality Content', 'محتوى الجودة')}</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Section', 'إضافة قسم')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {form.id ? t('Edit Section', 'تعديل القسم') : t('Add New Section', 'إضافة قسم جديد')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('Title (English)', 'العنوان (إنجليزي)')} *</Label>
                  <Input
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Title (Arabic)', 'العنوان (عربي)')} *</Label>
                  <Input
                    value={form.title_ar}
                    onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>{t('Content (English)', 'المحتوى (إنجليزي)')}</Label>
                <RichTextEditor
                  value={form.content_en}
                  onChange={(v) => setForm({ ...form, content_en: v })}
                  minHeight="240px"
                />
              </div>

              <div>
                <Label>{t('Content (Arabic)', 'المحتوى (عربي)')}</Label>
                <RichTextEditor
                  value={form.content_ar}
                  onChange={(v) => setForm({ ...form, content_ar: v })}
                  dir="rtl"
                  minHeight="240px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <Label>{t('Display Order', 'ترتيب العرض')}</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label>{t('Active (visible on site)', 'مفعل (يظهر على الموقع)')}</Label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? t('Saving...', 'جاري الحفظ...')
                  : form.id
                    ? t('Update', 'تحديث')
                    : t('Create', 'إنشاء')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Order', 'الترتيب')}</TableHead>
                <TableHead>{t('Title (EN)', 'العنوان (EN)')}</TableHead>
                <TableHead>{t('Title (AR)', 'العنوان (AR)')}</TableHead>
                <TableHead>{t('Active', 'مفعل')}</TableHead>
                <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('No quality sections yet', 'لا توجد أقسام بعد')}
                  </TableCell>
                </TableRow>
              ) : sections.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.display_order}</TableCell>
                  <TableCell className="font-medium">{row.title_en}</TableCell>
                  <TableCell className="font-medium" dir="rtl">{row.title_ar}</TableCell>
                  <TableCell>
                    <Switch checked={row.is_active} onCheckedChange={() => toggleActive(row)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete section?', 'حذف القسم؟')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('This action cannot be undone.', 'لا يمكن التراجع عن هذا الإجراء.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {t('Delete', 'حذف')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
