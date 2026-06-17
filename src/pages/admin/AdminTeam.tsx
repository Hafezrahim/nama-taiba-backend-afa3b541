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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

export default function AdminTeam() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase.from('team_members').insert([formData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success(t('Team member created successfully', 'تم إنشاء عضو الفريق بنجاح'));
      setIsDialogOpen(false);
    },
    onError: () => toast.error(t('Failed to create team member', 'فشل إنشاء عضو الفريق')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: any) => {
      const { error } = await supabase.from('team_members').update(formData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success(t('Team member updated successfully', 'تم تحديث عضو الفريق بنجاح'));
      setIsDialogOpen(false);
      setEditingMember(null);
    },
    onError: () => toast.error(t('Failed to update team member', 'فشل تحديث عضو الفريق')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success(t('Team member deleted successfully', 'تم حذف عضو الفريق بنجاح'));
    },
    onError: () => toast.error(t('Failed to delete team member', 'فشل حذف عضو الفريق')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name_en: formData.get('name_en') as string,
      name_ar: formData.get('name_ar') as string,
      position_en: formData.get('position_en') as string,
      position_ar: formData.get('position_ar') as string,
      image_url: formData.get('image_url') as string,
      display_order: parseInt(formData.get('display_order') as string) || 0,
      is_active: formData.get('is_active') === 'on',
    };

    if (!data.name_en || !data.name_ar || !data.position_en || !data.position_ar) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure you want to delete this team member?', 'هل أنت متأكد من حذف عضو الفريق؟'))) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Team Management', 'إدارة الفريق')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingMember(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Member', 'إضافة عضو')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? t('Edit Team Member', 'تعديل عضو الفريق') : t('Add New Team Member', 'إضافة عضو جديد')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name_en">{t('Name (English)', 'الاسم (إنجليزي)')} *</Label>
                  <Input id="name_en" name="name_en" defaultValue={editingMember?.name_en} required />
                </div>
                <div>
                  <Label htmlFor="name_ar">{t('Name (Arabic)', 'الاسم (عربي)')} *</Label>
                  <Input id="name_ar" name="name_ar" defaultValue={editingMember?.name_ar} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position_en">{t('Position (English)', 'المنصب (إنجليزي)')} *</Label>
                  <Input id="position_en" name="position_en" defaultValue={editingMember?.position_en} required />
                </div>
                <div>
                  <Label htmlFor="position_ar">{t('Position (Arabic)', 'المنصب (عربي)')} *</Label>
                  <Input id="position_ar" name="position_ar" defaultValue={editingMember?.position_ar} required />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">{t('Image URL', 'رابط الصورة')}</Label>
                <Input id="image_url" name="image_url" type="url" defaultValue={editingMember?.image_url} />
              </div>

              <div>
                <Label htmlFor="display_order">{t('Display Order', 'ترتيب العرض')}</Label>
                <Input id="display_order" name="display_order" type="number" defaultValue={editingMember?.display_order || 0} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" defaultChecked={editingMember?.is_active ?? true} />
                <Label htmlFor="is_active">{t('Active', 'نشط')}</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingMember ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
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
                  <TableHead>{t('Position (EN)', 'المنصب (EN)')}</TableHead>
                  <TableHead>{t('Position (AR)', 'المنصب (AR)')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Active', 'نشط')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.image_url && <img src={member.image_url} alt={member.name_en} className="h-12 w-12 rounded-full object-cover" />}</TableCell>
                    <TableCell>{member.name_en}</TableCell>
                    <TableCell>{member.name_ar}</TableCell>
                    <TableCell>{member.position_en}</TableCell>
                    <TableCell>{member.position_ar}</TableCell>
                    <TableCell>{member.display_order}</TableCell>
                    <TableCell>{member.is_active ? '✓' : '✗'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(member.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminTablePagination currentPage={currentPage} totalPages={Math.ceil(members.length / rowsPerPage)} onPageChange={setCurrentPage} totalItems={members.length} itemsPerPage={rowsPerPage} />
        </>
      )}
    </div>
  );
}
