import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Phone, MapPin, Loader2, Link2, Search, Code, Globe } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import LeafletMap from '@/components/ui/leaflet-map';
export default function AdminSettings() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('contact');
  const [previewLat, setPreviewLat] = useState<number>(24.7136);
  const [previewLng, setPreviewLng] = useState<number>(46.6753);

  // Extract coordinates from Google Maps URL
  const extractCoordsFromUrl = (url: string): { lat: number; lng: number } | null => {
    if (!url) return null;
    
    // Pattern 1: @lat,lng format (e.g., @24.7136,46.6753)
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const atMatch = url.match(atPattern);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }
    
    // Pattern 2: q=lat,lng format
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qMatch = url.match(qPattern);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }
    
    // Pattern 3: ll=lat,lng format
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const llMatch = url.match(llPattern);
    if (llMatch) {
      return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    }
    
    // Pattern 4: !3d and !4d format (embedded maps)
    const dPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
    const dMatch = url.match(dPattern);
    if (dMatch) {
      return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
    }
    
    return null;
  };

  const handleExtractFromUrl = () => {
    const urlInput = document.getElementById('map_url_loc') as HTMLInputElement;
    const latInput = document.getElementById('latitude') as HTMLInputElement;
    const lngInput = document.getElementById('longitude') as HTMLInputElement;
    
    if (!urlInput?.value) {
      toast.error(t('Please enter a Google Maps URL first', 'الرجاء إدخال رابط خرائط جوجل أولاً'));
      return;
    }
    
    const coords = extractCoordsFromUrl(urlInput.value);
    if (coords) {
      latInput.value = coords.lat.toString();
      lngInput.value = coords.lng.toString();
      setPreviewLat(coords.lat);
      setPreviewLng(coords.lng);
      toast.success(t('Coordinates extracted successfully', 'تم استخراج الإحداثيات بنجاح'));
    } else {
      toast.error(t('Could not extract coordinates from URL', 'تعذر استخراج الإحداثيات من الرابط'));
    }
  };

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['admin-contact-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: siteSettings, isLoading: seoLoading } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings' as any)
        .select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data as any[])?.forEach((row: any) => { map[row.setting_key] = row.setting_value || ''; });
      return map;
    },
  });

  // Update preview coordinates when contactInfo loads
  useEffect(() => {
    if (contactInfo) {
      setPreviewLat(contactInfo.latitude || 24.7136);
      setPreviewLng(contactInfo.longitude || 46.6753);
    }
  }, [contactInfo]);

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
      toast.success(t('Settings updated successfully', 'تم تحديث الإعدادات بنجاح'));
    },
    onError: () => toast.error(t('Failed to update settings', 'فشل تحديث الإعدادات')),
  });

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      address_en: formData.get('address_en') as string,
      address_ar: formData.get('address_ar') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      whatsapp: formData.get('whatsapp') as string,
      map_url: formData.get('map_url') as string,
      latitude: contactInfo?.latitude || 24.7136,
      longitude: contactInfo?.longitude || 46.6753,
      vat_number: formData.get('vat_number') as string,
      vat_rate: parseFloat(formData.get('vat_rate') as string) || 15,
    };

    if (!data.address_en || !data.address_ar || !data.phone || !data.email) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }

    updateMutation.mutate(data);
  };

  const handleLocationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      ...contactInfo,
      latitude: parseFloat(formData.get('latitude') as string) || 24.7136,
      longitude: parseFloat(formData.get('longitude') as string) || 46.6753,
      map_url: formData.get('map_url') as string,
    };

    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('Settings', 'الإعدادات')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('Manage your website settings and contact information', 'إدارة إعدادات الموقع ومعلومات الاتصال')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[550px]">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Contact', 'الاتصال')}</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Location', 'الموقع')}</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Business', 'الأعمال')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>{t('Contact Information', 'معلومات الاتصال')}</CardTitle>
              <CardDescription>
                {t('Update your contact details displayed on the website', 'تحديث بيانات الاتصال المعروضة على الموقع')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address_en">{t('Address (English)', 'العنوان (إنجليزي)')} *</Label>
                    <Textarea 
                      id="address_en" 
                      name="address_en" 
                      defaultValue={contactInfo?.address_en} 
                      rows={3} 
                      required 
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_ar">{t('Address (Arabic)', 'العنوان (عربي)')} *</Label>
                    <Textarea 
                      id="address_ar" 
                      name="address_ar" 
                      defaultValue={contactInfo?.address_ar} 
                      rows={3} 
                      required 
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('Phone', 'الهاتف')} *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      defaultValue={contactInfo?.phone} 
                      required 
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">{t('WhatsApp', 'واتساب')}</Label>
                    <Input 
                      id="whatsapp" 
                      name="whatsapp" 
                      type="tel" 
                      defaultValue={contactInfo?.whatsapp} 
                      placeholder="+966..."
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('Email', 'البريد الإلكتروني')} *</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    defaultValue={contactInfo?.email} 
                    required 
                    dir="ltr"
                  />
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="map_url">{t('Google Maps URL', 'رابط خرائط جوجل')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="map_url" 
                        name="map_url" 
                        type="url" 
                        defaultValue={contactInfo?.map_url} 
                        placeholder="https://maps.google.com/..."
                        dir="ltr"
                        className="flex-1"
                        onChange={(e) => {
                          const coords = extractCoordsFromUrl(e.target.value);
                          if (coords) {
                            setPreviewLat(coords.lat);
                            setPreviewLng(coords.lng);
                          }
                        }}
                      />
                    {contactInfo?.map_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(contactInfo.map_url, '_blank')}
                        title={t('Open in Google Maps', 'فتح في خرائط جوجل')}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('Save Changes', 'حفظ التغييرات')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('Map Coordinates', 'إحداثيات الخريطة')}</CardTitle>
                <CardDescription>
                  {t('Set the latitude and longitude for your location marker', 'حدد خط العرض والطول لعلامة موقعك')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLocationSubmit} className="space-y-4">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">{t('Latitude', 'خط العرض')}</Label>
                      <Input 
                        id="latitude" 
                        name="latitude" 
                        type="number" 
                        step="any"
                        defaultValue={contactInfo?.latitude || 24.7136} 
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">{t('Longitude', 'خط الطول')}</Label>
                      <Input 
                        id="longitude" 
                        name="longitude" 
                        type="number" 
                        step="any"
                        defaultValue={contactInfo?.longitude || 46.6753} 
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="map_url_loc">{t('Google Maps Link', 'رابط خرائط جوجل')}</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="map_url_loc" 
                        name="map_url" 
                        type="url" 
                        defaultValue={contactInfo?.map_url} 
                        placeholder="https://maps.google.com/..."
                        dir="ltr"
                        className="flex-1"
                        onChange={(e) => {
                          const coords = extractCoordsFromUrl(e.target.value);
                          if (coords) {
                            const latInput = document.getElementById('latitude') as HTMLInputElement;
                            const lngInput = document.getElementById('longitude') as HTMLInputElement;
                            if (latInput) latInput.value = coords.lat.toString();
                            if (lngInput) lngInput.value = coords.lng.toString();
                            setPreviewLat(coords.lat);
                            setPreviewLng(coords.lng);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleExtractFromUrl}
                        title={t('Extract coordinates from URL', 'استخراج الإحداثيات من الرابط')}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        {t('Extract', 'استخراج')}
                      </Button>
                      {contactInfo?.map_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(contactInfo.map_url, '_blank')}
                          title={t('Open in Google Maps', 'فتح في خرائط جوجل')}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {t(
                      'Paste a Google Maps URL and click "Extract" to auto-fill coordinates',
                      'الصق رابط خرائط جوجل وانقر على "استخراج" لملء الإحداثيات تلقائياً'
                    )}
                  </p>

                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('Update Location', 'تحديث الموقع')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('Map Preview', 'معاينة الخريطة')}</CardTitle>
                <CardDescription>
                  {t('Preview how the map will appear on your contact page', 'معاينة كيف ستظهر الخريطة في صفحة الاتصال')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] rounded-lg overflow-hidden border">
                  <LeafletMap
                    latitude={previewLat || contactInfo?.latitude || 24.7136}
                    longitude={previewLng || contactInfo?.longitude || 46.6753}
                    zoom={15}
                    popupText={language === 'ar' ? contactInfo?.address_ar : contactInfo?.address_en}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>{t('Business Information', 'معلومات الأعمال')}</CardTitle>
              <CardDescription>
                {t('Configure VAT and business-related settings', 'تكوين ضريبة القيمة المضافة والإعدادات المتعلقة بالأعمال')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vat_number">{t('VAT Number', 'الرقم الضريبي')}</Label>
                    <Input 
                      id="vat_number" 
                      name="vat_number" 
                      defaultValue={contactInfo?.vat_number || ''} 
                      placeholder="300000000000003"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vat_rate">{t('VAT Rate (%)', 'نسبة الضريبة (%)')}</Label>
                    <Input 
                      id="vat_rate" 
                      name="vat_rate" 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={contactInfo?.vat_rate || 15} 
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Hidden fields to preserve contact data */}
                <input type="hidden" name="address_en" value={contactInfo?.address_en || ''} />
                <input type="hidden" name="address_ar" value={contactInfo?.address_ar || ''} />
                <input type="hidden" name="phone" value={contactInfo?.phone || ''} />
                <input type="hidden" name="email" value={contactInfo?.email || ''} />
                <input type="hidden" name="whatsapp" value={contactInfo?.whatsapp || ''} />
                <input type="hidden" name="map_url" value={contactInfo?.map_url || ''} />

                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('Save Changes', 'حفظ التغييرات')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
