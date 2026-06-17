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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

export default function AdminSlider() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['admin-slider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slider')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('slider').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slider'] });
      toast.success(t('Slide created successfully', 'تم إنشاء الشريحة بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create slide', 'فشل إنشاء الشريحة')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('slider').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slider'] });
      toast.success(t('Slide updated successfully', 'تم تحديث الشريحة بنجاح'));
      setIsDialogOpen(false);
      setEditingSlide(null);
    },
    onError: () => toast.error(t('Failed to update slide', 'فشل تحديث الشريحة')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('slider').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-slider'] });
      toast.success(t('Slide deleted successfully', 'تم حذف الشريحة بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete slide', 'فشل حذف الشريحة')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title_en: formData.get('title_en') as string,
      title_ar: formData.get('title_ar') as string,
      subtitle_en: formData.get('subtitle_en') as string,
      subtitle_ar: formData.get('subtitle_ar') as string,
      description_en: formData.get('description_en') as string,
      description_ar: formData.get('description_ar') as string,
      image: formData.get('image') as string,
      link: formData.get('link') as string,
      button_text_en: formData.get('button_text_en') as string,
      button_text_ar: formData.get('button_text_ar') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (!data.title_en || !data.title_ar || !data.image) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (slide: any) => {
    setEditingSlide(slide);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this slide?', 'هل أنت متأكد من حذف هذه الشريحة؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Slider Management', 'إدارة الشرائح')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingSlide(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Slide', 'إضافة شريحة')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? t('Edit Slide', 'تعديل الشريحة') : t('Add New Slide', 'إضافة شريحة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_en">{t('Title (English)', 'العنوان (إنجليزي)')} *</Label>
                  <Input id="title_en" name="title_en" defaultValue={editingSlide?.title_en} required />
                </div>
                <div>
                  <Label htmlFor="title_ar">{t('Title (Arabic)', 'العنوان (عربي)')} *</Label>
                  <Input id="title_ar" name="title_ar" defaultValue={editingSlide?.title_ar} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subtitle_en">{t('Subtitle (English)', 'العنوان الفرعي (إنجليزي)')}</Label>
                  <Input id="subtitle_en" name="subtitle_en" defaultValue={editingSlide?.subtitle_en} />
                </div>
                <div>
                  <Label htmlFor="subtitle_ar">{t('Subtitle (Arabic)', 'العنوان الفرعي (عربي)')}</Label>
                  <Input id="subtitle_ar" name="subtitle_ar" defaultValue={editingSlide?.subtitle_ar} />
                </div>
              </div>

              <div>
                <Label htmlFor="description_en">{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                <Textarea id="description_en" name="description_en" defaultValue={editingSlide?.description_en} rows={2} />
              </div>

              <div>
                <Label htmlFor="description_ar">{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                <Textarea id="description_ar" name="description_ar" defaultValue={editingSlide?.description_ar} rows={2} />
              </div>

              <div>
                <Label htmlFor="image">{t('Image URL', 'رابط الصورة')} *</Label>
                <Input id="image" name="image" type="url" defaultValue={editingSlide?.image} required />
              </div>

              <div>
                <Label htmlFor="link">{t('Link', 'الرابط')}</Label>
                <Input id="link" name="link" type="url" defaultValue={editingSlide?.link} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button_text_en">{t('Button Text (English)', 'نص الزر (إنجليزي)')}</Label>
                  <Input id="button_text_en" name="button_text_en" defaultValue={editingSlide?.button_text_en} />
                </div>
                <div>
                  <Label htmlFor="button_text_ar">{t('Button Text (Arabic)', 'نص الزر (عربي)')}</Label>
                  <Input id="button_text_ar" name="button_text_ar" defaultValue={editingSlide?.button_text_ar} />
                </div>
              </div>

              <div>
                <Label htmlFor="display_order">{t('Display Order', 'ترتيب العرض')}</Label>
                <Input id="display_order" name="display_order" type="number" defaultValue={editingSlide?.display_order || 0} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingSlide?.is_active ?? true} />
                <Label htmlFor="is_active">{t('Active', 'نشط')}</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingSlide ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Image', 'الصورة')}</TableHead>
                  <TableHead>{t('Title (EN)', 'العنوان (EN)')}</TableHead>
                  <TableHead>{t('Title (AR)', 'العنوان (AR)')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Active', 'نشط')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>{slide.image && <img src={slide.image} alt={slide.title_en} className="h-16 w-auto" />}</TableCell>
                    <TableCell>{slide.title_en}</TableCell>
                    <TableCell>{slide.title_ar}</TableCell>
                    <TableCell>{slide.display_order}</TableCell>
                    <TableCell>{slide.is_active ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(slide)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(slide.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(slides.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={slides.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
