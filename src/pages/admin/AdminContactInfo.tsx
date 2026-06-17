import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminContactInfo() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['admin-contact-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (contactInfo?.id) {
        const { error } = await supabase
          .from('contact_info')
          .update(formData)
          .eq('id', contactInfo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('contact_info').insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-info'] });
      toast.success(t('Contact info updated successfully', 'تم تحديث معلومات الاتصال بنجاح'));
    },
    onError: () => toast.error(t('Failed to update contact info', 'فشل تحديث معلومات الاتصال')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      address_en: formData.get('address_en') as string,
      address_ar: formData.get('address_ar') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      whatsapp: formData.get('whatsapp') as string,
      map_url: formData.get('map_url') as string,
      latitude: parseFloat(formData.get('latitude') as string) || 24.7136,
      longitude: parseFloat(formData.get('longitude') as string) || 46.6753,
    };

    if (!data.address_en || !data.address_ar || !data.phone || !data.email) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Contact Information', 'معلومات الاتصال')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('Update Contact Information', 'تحديث معلومات الاتصال')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="address_en">{t('Address (English)', 'العنوان (إنجليزي)')} *</Label>
              <Textarea id="address_en" name="address_en" defaultValue={contactInfo?.address_en} rows={3} required />
            </div>

            <div>
              <Label htmlFor="address_ar">{t('Address (Arabic)', 'العنوان (عربي)')} *</Label>
              <Textarea id="address_ar" name="address_ar" defaultValue={contactInfo?.address_ar} rows={3} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">{t('Phone', 'الهاتف')} *</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={contactInfo?.phone} required />
              </div>
              <div>
                <Label htmlFor="whatsapp">{t('WhatsApp', 'واتساب')}</Label>
                <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={contactInfo?.whatsapp} />
              </div>
            </div>

            <div>
              <Label htmlFor="email">{t('Email', 'البريد الإلكتروني')} *</Label>
              <Input id="email" name="email" type="email" defaultValue={contactInfo?.email} required />
            </div>

            <div>
              <Label htmlFor="map_url">{t('Google Maps URL', 'رابط خرائط جوجل')}</Label>
              <Input id="map_url" name="map_url" type="url" defaultValue={contactInfo?.map_url} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">{t('Latitude', 'خط العرض')} *</Label>
                <Input 
                  id="latitude" 
                  name="latitude" 
                  type="number" 
                  step="any"
                  defaultValue={contactInfo?.latitude || 24.7136} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="longitude">{t('Longitude', 'خط الطول')} *</Label>
                <Input 
                  id="longitude" 
                  name="longitude" 
                  type="number" 
                  step="any"
                  defaultValue={contactInfo?.longitude || 46.6753} 
                  required 
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('Get coordinates from Google Maps by right-clicking on a location', 'احصل على الإحداثيات من خرائط جوجل بالنقر بزر الماوس الأيمن على الموقع')}
            </p>

            <Button type="submit" className="w-full">
              {t('Update Contact Information', 'تحديث معلومات الاتصال')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
