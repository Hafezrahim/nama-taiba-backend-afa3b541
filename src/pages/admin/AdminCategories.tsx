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
import ExcelImportButtons from '@/components/admin/ExcelImportButtons';

export default function AdminCategories() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('categories').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(t('Category created successfully', 'تم إنشاء الفئة بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create category', 'فشل إنشاء الفئة')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('categories').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(t('Category updated successfully', 'تم تحديث الفئة بنجاح'));
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => toast.error(t('Failed to update category', 'فشل تحديث الفئة')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(t('Category deleted successfully', 'تم حذف الفئة بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete category', 'فشل حذف الفئة')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name_en: formData.get('name_en') as string,
      name_ar: formData.get('name_ar') as string,
      description_en: formData.get('description_en') as string,
      description_ar: formData.get('description_ar') as string,
      slug: formData.get('slug') as string,
      image: formData.get('image') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (!data.name_en || !data.name_ar || !data.slug) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this category?', 'هل أنت متأكد من حذف هذه الفئة؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold">{t('Categories Management', 'إدارة الفئات')}</h1>
        <div className="flex gap-2 flex-wrap">
          <ExcelImportButtons
            type="categories"
            onImported={() => queryClient.invalidateQueries({ queryKey: ['admin-categories'] })}
          />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingCategory(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Category', 'إضافة فئة')}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? t('Edit Category', 'تعديل الفئة') : t('Add New Category', 'إضافة فئة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">{t('Name (English)', 'الاسم (إنجليزي)')} *</Label>
                  <Input id="name_en" name="name_en" defaultValue={editingCategory?.name_en} required />
                </div>
                <div>
                  <Label htmlFor="name_ar">{t('Name (Arabic)', 'الاسم (عربي)')} *</Label>
                  <Input id="name_ar" name="name_ar" defaultValue={editingCategory?.name_ar} required />
                </div>
              </div>

              <div>
                <Label htmlFor="slug">{t('Slug', 'المعرف')} *</Label>
                <Input id="slug" name="slug" defaultValue={editingCategory?.slug} required />
              </div>

              <div>
                <Label htmlFor="description_en">{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                <Textarea id="description_en" name="description_en" defaultValue={editingCategory?.description_en} rows={3} />
              </div>

              <div>
                <Label htmlFor="description_ar">{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                <Textarea id="description_ar" name="description_ar" defaultValue={editingCategory?.description_ar} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image">{t('Image URL', 'رابط الصورة')}</Label>
                  <Input id="image" name="image" type="url" defaultValue={editingCategory?.image} />
                </div>
                <div>
                  <Label htmlFor="display_order">{t('Display Order', 'ترتيب العرض')}</Label>
                  <Input id="display_order" name="display_order" type="number" defaultValue={editingCategory?.display_order || 0} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingCategory?.is_active ?? true} />
                <Label htmlFor="is_active">{t('Active', 'نشط')}</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingCategory ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
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
                  <TableHead>{t('Name (AR)', 'الاسم (AR)')}</TableHead>
                  <TableHead>{t('Slug', 'المعرف')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Active', 'نشط')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name_en}</TableCell>
                    <TableCell>{category.name_ar}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>{category.is_active ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(categories.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={categories.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
