import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

export default function AdminCertifications() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['admin-certifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('certifications').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      toast.success(t('Certification created successfully', 'تم إنشاء الشهادة بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create certification', 'فشل إنشاء الشهادة')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('certifications').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      toast.success(t('Certification updated successfully', 'تم تحديث الشهادة بنجاح'));
      setIsDialogOpen(false);
      setEditingCert(null);
    },
    onError: () => toast.error(t('Failed to update certification', 'فشل تحديث الشهادة')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('certifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-certifications'] });
      toast.success(t('Certification deleted successfully', 'تم حذف الشهادة بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete certification', 'فشل حذف الشهادة')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name_en: formData.get('name_en') as string,
      name_ar: formData.get('name_ar') as string,
      type_en: formData.get('type_en') as string,
      type_ar: formData.get('type_ar') as string,
      issued_by_en: formData.get('issued_by_en') as string,
      issued_by_ar: formData.get('issued_by_ar') as string,
      image: formData.get('image') as string,
      issued_date: formData.get('issued_date') as string || null,
      display_order: parseInt(formData.get('display_order') as string) || 0,
    };

    if (!data.name_en || !data.name_ar) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingCert) {
      updateMutation.mutate({ id: editingCert.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (cert: any) => {
    setEditingCert(cert);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this certification?', 'هل أنت متأكد من حذف هذه الشهادة؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Certifications Management', 'إدارة الشهادات')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingCert(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Certification', 'إضافة شهادة')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCert ? t('Edit Certification', 'تعديل الشهادة') : t('Add New Certification', 'إضافة شهادة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">{t('Name (English)', 'الاسم (إنجليزي)')} *</Label>
                  <Input id="name_en" name="name_en" defaultValue={editingCert?.name_en} required />
                </div>
                <div>
                  <Label htmlFor="name_ar">{t('Name (Arabic)', 'الاسم (عربي)')} *</Label>
                  <Input id="name_ar" name="name_ar" defaultValue={editingCert?.name_ar} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type_en">{t('Type (English)', 'النوع (إنجليزي)')}</Label>
                  <Input id="type_en" name="type_en" defaultValue={editingCert?.type_en} />
                </div>
                <div>
                  <Label htmlFor="type_ar">{t('Type (Arabic)', 'النوع (عربي)')}</Label>
                  <Input id="type_ar" name="type_ar" defaultValue={editingCert?.type_ar} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issued_by_en">{t('Issued By (English)', 'الجهة المصدرة (إنجليزي)')}</Label>
                  <Input id="issued_by_en" name="issued_by_en" defaultValue={editingCert?.issued_by_en} />
                </div>
                <div>
                  <Label htmlFor="issued_by_ar">{t('Issued By (Arabic)', 'الجهة المصدرة (عربي)')}</Label>
                  <Input id="issued_by_ar" name="issued_by_ar" defaultValue={editingCert?.issued_by_ar} />
                </div>
              </div>

              <div>
                <Label htmlFor="image">{t('Image URL', 'رابط الصورة')}</Label>
                <Input id="image" name="image" type="url" defaultValue={editingCert?.image} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issued_date">{t('Issued Date', 'تاريخ الإصدار')}</Label>
                  <Input id="issued_date" name="issued_date" type="date" defaultValue={editingCert?.issued_date} />
                </div>
                <div>
                  <Label htmlFor="display_order">{t('Display Order', 'ترتيب العرض')}</Label>
                  <Input id="display_order" name="display_order" type="number" defaultValue={editingCert?.display_order || 0} />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingCert ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
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
                  <TableHead>{t('Name (EN)', 'الاسم (EN)')}</TableHead>
                  <TableHead>{t('Name (AR)', 'الاسم (AR)')}</TableHead>
                  <TableHead>{t('Type', 'النوع')}</TableHead>
                  <TableHead>{t('Issued By', 'الجهة المصدرة')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>{cert.image && <img src={cert.image} alt={cert.name_en} className="h-12 w-auto" />}</TableCell>
                    <TableCell>{cert.name_en}</TableCell>
                    <TableCell>{cert.name_ar}</TableCell>
                    <TableCell>{cert.type_en}</TableCell>
                    <TableCell>{cert.issued_by_en}</TableCell>
                    <TableCell>{cert.display_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(cert)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(cert.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(certifications.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={certifications.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
