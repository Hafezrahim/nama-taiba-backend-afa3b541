import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, Download, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

export default function AdminChatbot() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-chatbot-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(f =>
      f.question_en.toLowerCase().includes(q) ||
      f.question_ar.includes(searchQuery) ||
      (f.category_en || '').toLowerCase().includes(q)
    );
  }, [faqs, searchQuery]);

  const totalPages = Math.ceil(filteredFaqs.length / rowsPerPage);
  const paginatedFaqs = filteredFaqs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('chatbot_faqs').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chatbot-faqs'] });
      toast.success(t('FAQ created successfully', 'تم إنشاء السؤال بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create FAQ', 'فشل إنشاء السؤال')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('chatbot_faqs').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chatbot-faqs'] });
      toast.success(t('FAQ updated successfully', 'تم تحديث السؤال بنجاح'));
      setIsDialogOpen(false);
      setEditingFaq(null);
    },
    onError: () => toast.error(t('Failed to update FAQ', 'فشل تحديث السؤال')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chatbot_faqs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chatbot-faqs'] });
      toast.success(t('FAQ deleted successfully', 'تم حذف السؤال بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete FAQ', 'فشل حذف السؤال')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      question_en: fd.get('question_en') as string,
      answer_en: fd.get('answer_en') as string,
      question_ar: fd.get('question_ar') as string,
      answer_ar: fd.get('answer_ar') as string,
      category_en: fd.get('category_en') as string || 'General',
      category_ar: fd.get('category_ar') as string || 'عام',
      display_order: parseInt(fd.get('display_order') as string) || 0,
      is_active: fd.get('is_active') === 'on',
    };
    if (!data.question_en || !data.answer_en || !data.question_ar || !data.answer_ar) {
      toast.error(t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (faq: any) => { setEditingFaq(faq); setIsDialogOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm(t('Delete this FAQ?', 'حذف هذا السؤال؟'))) deleteMutation.mutate(id);
  };

  // Download Excel template
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { question_en: 'What is your return policy?', answer_en: 'We accept returns within 7 days.', question_ar: 'ما هي سياسة الإرجاع؟', answer_ar: 'نقبل الإرجاع خلال 7 أيام.', category_en: 'Returns', category_ar: 'الإرجاع' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FAQs');
    XLSX.writeFile(wb, 'chatbot_faqs_template.xlsx');
  };

  // Import from Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        
        if (rows.length === 0) { toast.error(t('No data found', 'لم يتم العثور على بيانات')); return; }
        
        const validRows = rows.filter(r => r.question_en && r.answer_en && r.question_ar && r.answer_ar)
          .map((r, i) => ({
            question_en: String(r.question_en),
            answer_en: String(r.answer_en),
            question_ar: String(r.question_ar),
            answer_ar: String(r.answer_ar),
            category_en: String(r.category_en || 'General'),
            category_ar: String(r.category_ar || 'عام'),
            display_order: Number(r.display_order) || i,
            is_active: true,
          }));

        if (validRows.length === 0) {
          toast.error(t('No valid rows found. Required columns: question_en, answer_en, question_ar, answer_ar', 'لم يتم العثور على صفوف صالحة'));
          return;
        }

        const { error } = await supabase.from('chatbot_faqs').insert(validRows);
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['admin-chatbot-faqs'] });
        toast.success(t(`Imported ${validRows.length} FAQs`, `تم استيراد ${validRows.length} سؤال`));
      } catch (err) {
        toast.error(t('Import failed', 'فشل الاستيراد'));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = faqs.map(f => ({
      question_en: f.question_en,
      answer_en: f.answer_en,
      question_ar: f.question_ar,
      answer_ar: f.answer_ar,
      category_en: f.category_en,
      category_ar: f.category_ar,
      display_order: f.display_order,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FAQs');
    XLSX.writeFile(wb, 'chatbot_faqs_export.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">{t('Chatbot FAQ Management', 'إدارة أسئلة الشات بوت')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            {t('Template', 'قالب')}
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            {t('Export', 'تصدير')}
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {t('Import Excel', 'استيراد Excel')}
              </span>
            </Button>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingFaq(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{t('Add FAQ', 'إضافة سؤال')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFaq ? t('Edit FAQ', 'تعديل السؤال') : t('Add New FAQ', 'إضافة سؤال جديد')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Question (English)', 'السؤال (إنجليزي)')} *</Label>
                    <Textarea name="question_en" defaultValue={editingFaq?.question_en} required rows={2} />
                  </div>
                  <div>
                    <Label>{t('Question (Arabic)', 'السؤال (عربي)')} *</Label>
                    <Textarea name="question_ar" defaultValue={editingFaq?.question_ar} required rows={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Answer (English)', 'الإجابة (إنجليزي)')} *</Label>
                    <Textarea name="answer_en" defaultValue={editingFaq?.answer_en} required rows={3} />
                  </div>
                  <div>
                    <Label>{t('Answer (Arabic)', 'الإجابة (عربي)')} *</Label>
                    <Textarea name="answer_ar" defaultValue={editingFaq?.answer_ar} required rows={3} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Category (English)', 'الفئة (إنجليزي)')}</Label>
                    <Input name="category_en" defaultValue={editingFaq?.category_en || 'General'} />
                  </div>
                  <div>
                    <Label>{t('Category (Arabic)', 'الفئة (عربي)')}</Label>
                    <Input name="category_ar" defaultValue={editingFaq?.category_ar || 'عام'} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Display Order', 'ترتيب العرض')}</Label>
                    <Input name="display_order" type="number" defaultValue={editingFaq?.display_order || 0} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch name="is_active" defaultChecked={editingFaq?.is_active ?? true} />
                    <Label>{t('Active', 'نشط')}</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingFaq ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('Search FAQs...', 'بحث في الأسئلة...')}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="ps-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {t(`Total: ${filteredFaqs.length} FAQs`, `الإجمالي: ${filteredFaqs.length} سؤال`)}
      </p>

      {isLoading ? (
        <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>{t('Question (EN)', 'السؤال (EN)')}</TableHead>
                  <TableHead>{t('Question (AR)', 'السؤال (AR)')}</TableHead>
                  <TableHead>{t('Category', 'الفئة')}</TableHead>
                  <TableHead>{t('Active', 'نشط')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFaqs.map((faq, idx) => (
                  <TableRow key={faq.id}>
                    <TableCell className="text-muted-foreground text-xs">{(currentPage - 1) * rowsPerPage + idx + 1}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{faq.question_en}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{faq.question_ar}</TableCell>
                    <TableCell><Badge variant="secondary">{faq.category_en}</Badge></TableCell>
                    <TableCell>{faq.is_active ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(faq)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(faq.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t(`Page ${currentPage} of ${totalPages}`, `صفحة ${currentPage} من ${totalPages}`)}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  {t('Previous', 'السابق')}
                </Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  {t('Next', 'التالي')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
