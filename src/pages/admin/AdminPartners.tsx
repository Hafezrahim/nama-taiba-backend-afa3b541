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
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

export default function AdminPartners() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState<string>('');
  const rowsPerPage = 15;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Image must be less than 5MB', 'يجب أن تكون الصورة أقل من 5 ميجابايت'));
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('partners').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('partners').getPublicUrl(fileName);
      setUploadedLogo(publicUrl);
      toast.success(t('Logo uploaded', 'تم رفع الشعار'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('partners').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success(t('Partner created successfully', 'تم إنشاء الشريك بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create partner', 'فشل إنشاء الشريك')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('partners').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success(t('Partner updated successfully', 'تم تحديث الشريك بنجاح'));
      setIsDialogOpen(false);
      setEditingPartner(null);
    },
    onError: () => toast.error(t('Failed to update partner', 'فشل تحديث الشريك')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success(t('Partner deleted successfully', 'تم حذف الشريك بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete partner', 'فشل حذف الشريك')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      logo: uploadedLogo || formData.get('logo') as string,
      description_en: formData.get('description_en') as string,
      description_ar: formData.get('description_ar') as string,
      website: formData.get('website') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (!data.name) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (partner: any) => {
    setEditingPartner(partner);
    setUploadedLogo(partner.logo || '');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this partner?', 'هل أنت متأكد من حذف هذا الشريك؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Partners Management', 'إدارة الشركاء')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingPartner(null); setUploadedLogo(''); }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPartner(null); setUploadedLogo(''); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Partner', 'إضافة شريك')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? t('Edit Partner', 'تعديل الشريك') : t('Add New Partner', 'إضافة شريك جديد')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('Name', 'الاسم')} *</Label>
                <Input id="name" name="name" defaultValue={editingPartner?.name} required />
              </div>

              <div>
                <Label>{t('Logo', 'الشعار')}</Label>
                {uploadedLogo ? (
                  <div className="relative mt-2 inline-block">
                    <img src={uploadedLogo} alt="Logo" className="h-20 w-auto object-contain rounded-lg border p-1" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setUploadedLogo('')}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{uploading ? t('Uploading...', 'جارِ الرفع...') : t('Upload logo (max 5MB)', 'رفع شعار (حد أقصى 5MB)')}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                    <Input className="mt-2" name="logo" placeholder={t('Or paste logo URL', 'أو الصق رابط الشعار')} defaultValue={editingPartner?.logo} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="website">{t('Website', 'الموقع الإلكتروني')}</Label>
                <Input id="website" name="website" type="url" defaultValue={editingPartner?.website} />
              </div>
              
              <div>
                <Label htmlFor="description_en">{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                <Textarea id="description_en" name="description_en" defaultValue={editingPartner?.description_en} rows={3} />
              </div>
              
              <div>
                <Label htmlFor="description_ar">{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                <Textarea id="description_ar" name="description_ar" defaultValue={editingPartner?.description_ar} rows={3} />
              </div>

              <div>
                <Label htmlFor="display_order">{t('Display Order', 'ترتيب العرض')}</Label>
                <Input id="display_order" name="display_order" type="number" defaultValue={editingPartner?.display_order || 0} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingPartner?.is_active ?? true} />
                <Label htmlFor="is_active">{t('Active', 'نشط')}</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingPartner ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
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
                  <TableHead>{t('Name', 'الاسم')}</TableHead>
                  <TableHead>{t('Logo', 'الشعار')}</TableHead>
                  <TableHead>{t('Website', 'الموقع')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Active', 'نشط')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>{partner.name}</TableCell>
                    <TableCell>{partner.logo && <img src={partner.logo} alt={partner.name} className="h-8 w-auto" />}</TableCell>
                    <TableCell>{partner.website}</TableCell>
                    <TableCell>{partner.display_order}</TableCell>
                    <TableCell>{partner.is_active ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(partner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(partner.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(partners.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={partners.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
