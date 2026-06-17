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

export default function AdminTestimonials() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('testimonials').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(t('Testimonial created successfully', 'تم إنشاء الشهادة بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create testimonial', 'فشل إنشاء الشهادة')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('testimonials').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(t('Testimonial updated successfully', 'تم تحديث الشهادة بنجاح'));
      setIsDialogOpen(false);
      setEditingTestimonial(null);
    },
    onError: () => toast.error(t('Failed to update testimonial', 'فشل تحديث الشهادة')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(t('Testimonial deleted successfully', 'تم حذف الشهادة بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete testimonial', 'فشل حذف الشهادة')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name_en: formData.get('name_en') as string,
      name_ar: formData.get('name_ar') as string,
      position_en: formData.get('position_en') as string,
      position_ar: formData.get('position_ar') as string,
      content_en: formData.get('content_en') as string,
      content_ar: formData.get('content_ar') as string,
      rating: parseInt(formData.get('rating') as string) || 5,
      avatar: formData.get('avatar') as string,
      is_approved: formData.get('is_approved') === 'on',
      is_featured: formData.get('is_featured') === 'on',
    };

    if (!data.name_en || !data.name_ar || !data.content_en || !data.content_ar) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (testimonial: any) => {
    setEditingTestimonial(testimonial);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this testimonial?', 'هل أنت متأكد من حذف هذه الشهادة؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Testimonials Management', 'إدارة الشهادات')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTestimonial(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Testimonial', 'إضافة شهادة')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? t('Edit Testimonial', 'تعديل الشهادة') : t('Add New Testimonial', 'إضافة شهادة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">{t('Name (English)', 'الاسم (إنجليزي)')} *</Label>
                  <Input id="name_en" name="name_en" defaultValue={editingTestimonial?.name_en} required />
                </div>
                <div>
                  <Label htmlFor="name_ar">{t('Name (Arabic)', 'الاسم (عربي)')} *</Label>
                  <Input id="name_ar" name="name_ar" defaultValue={editingTestimonial?.name_ar} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position_en">{t('Position (English)', 'المنصب (إنجليزي)')}</Label>
                  <Input id="position_en" name="position_en" defaultValue={editingTestimonial?.position_en} />
                </div>
                <div>
                  <Label htmlFor="position_ar">{t('Position (Arabic)', 'المنصب (عربي)')}</Label>
                  <Input id="position_ar" name="position_ar" defaultValue={editingTestimonial?.position_ar} />
                </div>
              </div>

              <div>
                <Label htmlFor="content_en">{t('Content (English)', 'المحتوى (إنجليزي)')} *</Label>
                <Textarea id="content_en" name="content_en" defaultValue={editingTestimonial?.content_en} rows={3} required />
              </div>

              <div>
                <Label htmlFor="content_ar">{t('Content (Arabic)', 'المحتوى (عربي)')} *</Label>
                <Textarea id="content_ar" name="content_ar" defaultValue={editingTestimonial?.content_ar} rows={3} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rating">{t('Rating', 'التقييم')}</Label>
                  <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={editingTestimonial?.rating || 5} />
                </div>
                <div>
                  <Label htmlFor="avatar">{t('Avatar URL', 'رابط الصورة')}</Label>
                  <Input id="avatar" name="avatar" type="url" defaultValue={editingTestimonial?.avatar} />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="is_approved" name="is_approved" defaultChecked={editingTestimonial?.is_approved ?? true} />
                  <Label htmlFor="is_approved">{t('Approved', 'معتمد')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_featured" name="is_featured" defaultChecked={editingTestimonial?.is_featured ?? false} />
                  <Label htmlFor="is_featured">{t('Featured', 'مميز')}</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingTestimonial ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
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
                  <TableHead>{t('Name (EN)', 'الاسم (EN)')}</TableHead>
                  <TableHead>{t('Position', 'المنصب')}</TableHead>
                  <TableHead>{t('Rating', 'التقييم')}</TableHead>
                  <TableHead>{t('Approved', 'معتمد')}</TableHead>
                  <TableHead>{t('Featured', 'مميز')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>{testimonial.name_en}</TableCell>
                    <TableCell>{testimonial.position_en}</TableCell>
                    <TableCell>{testimonial.rating}/5</TableCell>
                    <TableCell>{testimonial.is_approved ? '✓' : '✗'}</TableCell>
                    <TableCell>{testimonial.is_featured ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(testimonial)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(testimonial.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(testimonials.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={testimonials.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
