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

export default function AdminServices() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('services').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(t('Service created successfully', 'تم إنشاء الخدمة بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create service', 'فشل إنشاء الخدمة')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('services').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(t('Service updated successfully', 'تم تحديث الخدمة بنجاح'));
      setIsDialogOpen(false);
      setEditingService(null);
    },
    onError: () => toast.error(t('Failed to update service', 'فشل تحديث الخدمة')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(t('Service deleted successfully', 'تم حذف الخدمة بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete service', 'فشل حذف الخدمة')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title_en: formData.get('title_en') as string,
      title_ar: formData.get('title_ar') as string,
      description_en: formData.get('description_en') as string,
      description_ar: formData.get('description_ar') as string,
      icon_name: formData.get('icon_name') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (!data.title_en || !data.title_ar) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this service?', 'هل أنت متأكد من حذف هذه الخدمة؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Services Management', 'إدارة الخدمات')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingService(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Service', 'إضافة خدمة')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? t('Edit Service', 'تعديل الخدمة') : t('Add New Service', 'إضافة خدمة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_en">{t('Title (English)', 'العنوان (إنجليزي)')} *</Label>
                  <Input id="title_en" name="title_en" defaultValue={editingService?.title_en} required />
                </div>
                <div>
                  <Label htmlFor="title_ar">{t('Title (Arabic)', 'العنوان (عربي)')} *</Label>
                  <Input id="title_ar" name="title_ar" defaultValue={editingService?.title_ar} required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description_en">{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                <Textarea id="description_en" name="description_en" defaultValue={editingService?.description_en} rows={3} />
              </div>
              
              <div>
                <Label htmlFor="description_ar">{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                <Textarea id="description_ar" name="description_ar" defaultValue={editingService?.description_ar} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon_name">{t('Icon Name', 'اسم الأيقونة')}</Label>
                  <Input id="icon_name" name="icon_name" defaultValue={editingService?.icon_name || 'chevron-right'} />
                </div>
                <div>
                  <Label htmlFor="display_order">{t('Display Order', 'ترتيب العرض')}</Label>
                  <Input id="display_order" name="display_order" type="number" defaultValue={editingService?.display_order || 0} />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingService?.is_active ?? true} />
                <Label htmlFor="is_active">{t('Active', 'نشط')}</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingService ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
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
                  <TableHead>{t('Title (EN)', 'العنوان (EN)')}</TableHead>
                  <TableHead>{t('Title (AR)', 'العنوان (AR)')}</TableHead>
                  <TableHead>{t('Icon', 'الأيقونة')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Active', 'نشط')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.title_en}</TableCell>
                    <TableCell>{service.title_ar}</TableCell>
                    <TableCell>{service.icon_name}</TableCell>
                    <TableCell>{service.display_order}</TableCell>
                    <TableCell>{service.is_active ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(services.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={services.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
