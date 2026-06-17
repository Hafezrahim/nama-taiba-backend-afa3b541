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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';

interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

interface District {
  id: string;
  city_id: string;
  name_ar: string;
  name_en: string;
  shipping_price: number;
  is_active: boolean;
  display_order: number;
  cities?: City;
}

const AdminDistricts = () => {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    city_id: '',
    name_ar: '',
    name_en: '',
    shipping_price: 0,
    is_active: true,
    display_order: 0
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as City[];
    }
  });

  const { data: districts, isLoading } = useQuery({
    queryKey: ['districts', selectedCityFilter],
    queryFn: async () => {
      let query = supabase
        .from('districts')
        .select('*, cities(id, name_ar, name_en)')
        .order('display_order');
      
      if (selectedCityFilter !== 'all') {
        query = query.eq('city_id', selectedCityFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as District[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<District>) => {
      const { cities, ...dataWithoutCities } = data as any;
      if (editingDistrict) {
        const { error } = await supabase
          .from('districts')
          .update(dataWithoutCities)
          .eq('id', editingDistrict.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('districts')
          .insert(dataWithoutCities);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingDistrict 
          ? t('District updated', 'تم تحديث الحي') 
          : t('District created', 'تم إنشاء الحي'),
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
      const { error } = await supabase.from('districts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      toast({ title: t('District deleted', 'تم حذف الحي') });
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
    setFormData({
      city_id: '',
      name_ar: '',
      name_en: '',
      shipping_price: 0,
      is_active: true,
      display_order: 0
    });
    setEditingDistrict(null);
  };

  const openEditDialog = (district: District) => {
    setEditingDistrict(district);
    setFormData({
      city_id: district.city_id,
      name_ar: district.name_ar,
      name_en: district.name_en,
      shipping_price: district.shipping_price,
      is_active: district.is_active,
      display_order: district.display_order
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getCityName = (city?: City) => {
    if (!city) return '-';
    return isRTL ? city.name_ar : city.name_en;
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Building2 className="h-6 w-6" />
          {t('Districts & Shipping Prices', 'الأحياء وأسعار الشحن')}
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className={isRTL ? 'flex-row-reverse' : ''}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('Add District', 'إضافة حي')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDistrict 
                  ? t('Edit District', 'تعديل الحي') 
                  : t('Add New District', 'إضافة حي جديد')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('City', 'المدينة')}</Label>
                <Select
                  value={formData.city_id}
                  onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select a city', 'اختر مدينة')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {isRTL ? `${city.name_ar} - ${city.name_en}` : `${city.name_en} - ${city.name_ar}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label>{t('Shipping Price (SAR)', 'سعر الشحن (ر.س)')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.shipping_price}
                  onChange={(e) => setFormData({ ...formData, shipping_price: parseFloat(e.target.value) || 0 })}
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
          <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle>{t('Districts', 'الأحياء')}</CardTitle>
            <Select value={selectedCityFilter} onValueChange={setSelectedCityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('Filter by city', 'تصفية حسب المدينة')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Cities', 'جميع المدن')}</SelectItem>
                {cities?.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {isRTL ? city.name_ar : city.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('City', 'المدينة')}</TableHead>
                  <TableHead>{t('District (EN)', 'الحي (إنجليزي)')}</TableHead>
                  <TableHead>{t('District (AR)', 'الحي (عربي)')}</TableHead>
                  <TableHead>{t('Shipping Price', 'سعر الشحن')}</TableHead>
                  <TableHead>{t('Status', 'الحالة')}</TableHead>
                  <TableHead>{t('Actions', 'الإجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {districts?.map((district) => (
                  <TableRow key={district.id}>
                    <TableCell>{getCityName(district.cities)}</TableCell>
                    <TableCell>{district.name_en}</TableCell>
                    <TableCell dir="rtl">{district.name_ar}</TableCell>
                    <TableCell>
                      {district.shipping_price.toFixed(2)} {t('SAR', 'ر.س')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${district.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {district.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(district)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(district.id)}
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

export default AdminDistricts;
