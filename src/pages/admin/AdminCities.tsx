import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';

interface City {
  id: string;
  name_ar: string;
  name_en: string;
  is_active: boolean;
  display_order: number;
}

const AdminCities = () => {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    is_active: true,
    display_order: 0
  });

  const { data: cities, isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data as City[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingCity) {
        const { error } = await supabase
          .from('cities')
          .update(data)
          .eq('id', editingCity.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cities')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCity 
          ? t('City updated', 'تم تحديث المدينة') 
          : t('City created', 'تم إنشاء المدينة'),
        description: t('Changes saved successfully', 'تم حفظ التغييرات بنجاح')
      });
    },
    onError: (error) => {
      toast({
        title: t('Error', 'خطأ'),
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast({ title: t('City deleted', 'تم حذف المدينة') });
    },
    onError: (error) => {
      toast({
        title: t('Error', 'خطأ'),
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({ name_ar: '', name_en: '', is_active: true, display_order: 0 });
    setEditingCity(null);
  };

  const openEditDialog = (city: City) => {
    setEditingCity(city);
    setFormData({
      name_ar: city.name_ar,
      name_en: city.name_en,
      is_active: city.is_active,
      display_order: city.display_order
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <MapPin className="h-6 w-6" />
          {t('Cities Management', 'إدارة المدن')}
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className={isRTL ? 'flex-row-reverse' : ''}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('Add City', 'إضافة مدينة')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCity 
                  ? t('Edit City', 'تعديل المدينة') 
                  : t('Add New City', 'إضافة مدينة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
              <div>
                <Label>{t('Display Order', 'ترتيب العرض')}</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>{t('Active', 'نشط')}</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending 
                  ? t('Saving...', 'جاري الحفظ...') 
                  : t('Save', 'حفظ')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Cities', 'المدن')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name (EN)', 'الاسم (إنجليزي)')}</TableHead>
                  <TableHead>{t('Name (AR)', 'الاسم (عربي)')}</TableHead>
                  <TableHead>{t('Order', 'الترتيب')}</TableHead>
                  <TableHead>{t('Status', 'الحالة')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities?.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell>{city.name_en}</TableCell>
                    <TableCell dir="rtl">{city.name_ar}</TableCell>
                    <TableCell>{city.display_order}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${city.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {city.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(city)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(city.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCities;
