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
import { Loader2, Globe, Search, Code, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import SeoIndexingTools from '@/components/admin/seo/SeoIndexingTools';

export default function AdminSEO() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('global');

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

  const [seoForm, setSeoForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (siteSettings) {
      setSeoForm(siteSettings);
    }
  }, [siteSettings]);

  const seoMutation = useMutation({
    mutationFn: async (settings: Record<string, string>) => {
      const rows = Object.entries(settings).map(([setting_key, setting_value]) => ({
        setting_key,
        setting_value: setting_value || '',
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('site_settings' as any)
        .upsert(rows as any, { onConflict: 'setting_key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success(t('SEO settings updated successfully', 'تم تحديث إعدادات السيو بنجاح'));
    },
    onError: () => toast.error(t('Failed to update SEO settings', 'فشل تحديث إعدادات السيو')),
  });

  const handleSeoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    seoMutation.mutate(seoForm);
  };

  if (seoLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">{t('SEO & Analytics Dashboard', 'لوحة تحكم السيو والتحليلات')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('Manage all aspects of search engine optimization, keywords, indexing, and analytics.', 'إدارة جميع جوانب تحسين محركات البحث والكلمات المفتاحية والفهرسة والتحليلات.')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[600px] h-auto p-1 bg-muted/50">
          <TabsTrigger value="global" className="flex items-center gap-2 py-2.5">
            <Globe className="h-4 w-4" />
            <span>{t('Global Meta & Settings', 'العلامات الوصفية والإعدادات')}</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2 py-2.5">
            <Search className="h-4 w-4" />
            <span>{t('Advanced SEO Tools', 'أدوات السيو المتقدمة')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Global Meta & Settings Tab */}
        <TabsContent value="global">
          <form onSubmit={handleSeoSubmit} className="space-y-6">
            {/* Meta Tags */}
            <Card className="border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/10 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  {t('Meta Tags & Keywords', 'العلامات الوصفية والكلمات المفتاحية')}
                </CardTitle>
                <CardDescription>
                  {t('Configure global meta tags and bilingual keywords for English and Arabic.', 'تكوين العلامات الوصفية العامة والكلمات المفتاحية ثنائية اللغة.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                    <Label className="text-sm font-semibold">{t('Site Title (English)', 'عنوان الموقع (إنجليزي)')}</Label>
                    <Input
                      value={seoForm.seo_title_en || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_title_en: e.target.value }))}
                      dir="ltr"
                      placeholder="Nama Taiba | Building Materials"
                      className="bg-white dark:bg-background"
                    />
                    <p className="text-xs text-muted-foreground">{(seoForm.seo_title_en || '').length}/60 {t('characters', 'حرف')}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                    <Label className="text-sm font-semibold">{t('Site Title (Arabic)', 'عنوان الموقع (عربي)')}</Label>
                    <Input
                      value={seoForm.seo_title_ar || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_title_ar: e.target.value }))}
                      dir="rtl"
                      placeholder="نما طيبة | مواد البناء"
                      className="bg-white dark:bg-background"
                    />
                    <p className="text-xs text-muted-foreground">{(seoForm.seo_title_ar || '').length}/60 {t('characters', 'حرف')}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                    <Label className="text-sm font-semibold">{t('Meta Description (English)', 'الوصف التعريفي (إنجليزي)')}</Label>
                    <Textarea
                      value={seoForm.seo_description_en || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_description_en: e.target.value }))}
                      dir="ltr"
                      rows={3}
                      className="bg-white dark:bg-background"
                    />
                    <p className="text-xs text-muted-foreground">{(seoForm.seo_description_en || '').length}/160 {t('characters', 'حرف')}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                    <Label className="text-sm font-semibold">{t('Meta Description (Arabic)', 'الوصف التعريفي (عربي)')}</Label>
                    <Textarea
                      value={seoForm.seo_description_ar || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_description_ar: e.target.value }))}
                      dir="rtl"
                      rows={3}
                      className="bg-white dark:bg-background"
                    />
                    <p className="text-xs text-muted-foreground">{(seoForm.seo_description_ar || '').length}/160 {t('characters', 'حرف')}</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full"></div>
                    <Label className="text-sm font-semibold text-primary">{t('Keywords (English)', 'الكلمات المفتاحية (إنجليزي)')}</Label>
                    <Textarea
                      value={seoForm.seo_keywords_en || seoForm.seo_keywords || ''} // Fallback to old seo_keywords if en is empty
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_keywords_en: e.target.value }))}
                      dir="ltr"
                      rows={2}
                      placeholder="building materials, construction, GRC"
                      className="bg-white dark:bg-background relative z-10"
                    />
                    <p className="text-xs text-muted-foreground">{t('Separate with commas', 'افصل بينها بفواصل')}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-16 h-16 bg-primary/5 rounded-br-full"></div>
                    <Label className="text-sm font-semibold text-primary">{t('Keywords (Arabic)', 'الكلمات المفتاحية (عربي)')}</Label>
                    <Textarea
                      value={seoForm.seo_keywords_ar || seoForm.seo_keywords || ''} // Fallback to old seo_keywords if ar is empty
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_keywords_ar: e.target.value }))}
                      dir="rtl"
                      rows={2}
                      placeholder="مواد بناء، تشييد، جي ار سي"
                      className="bg-white dark:bg-background relative z-10"
                    />
                    <p className="text-xs text-muted-foreground">{t('Separate with commas', 'افصل بينها بفواصل')}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('Author', 'المؤلف')}</Label>
                    <Input
                      value={seoForm.meta_author || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, meta_author: e.target.value }))}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Robots', 'الروبوتات')}</Label>
                    <Input
                      value={seoForm.meta_robots || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, meta_robots: e.target.value }))}
                      dir="ltr"
                      placeholder="index, follow"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('Canonical URL', 'الرابط الأساسي')}</Label>
                    <Input
                      value={seoForm.meta_canonical_url || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, meta_canonical_url: e.target.value }))}
                      dir="ltr"
                      placeholder="https://www.nama-taiba.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('OG Image URL', 'رابط صورة المشاركة')}</Label>
                    <Input
                      value={seoForm.seo_og_image || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, seo_og_image: e.target.value }))}
                      dir="ltr"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('Twitter Handle', 'حساب تويتر')}</Label>
                    <Input
                      value={seoForm.meta_twitter_handle || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, meta_twitter_handle: e.target.value }))}
                      dir="ltr"
                      placeholder="@namataiba"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Theme Color', 'لون الثيم')}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={seoForm.meta_theme_color || ''}
                        onChange={(e) => setSeoForm(p => ({ ...p, meta_theme_color: e.target.value }))}
                        dir="ltr"
                        placeholder="#6b2fa0"
                        className="flex-1"
                      />
                      <input
                         type="color"
                        value={seoForm.meta_theme_color || '#6b2fa0'}
                        onChange={(e) => setSeoForm(p => ({ ...p, meta_theme_color: e.target.value }))}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Search Preview */}
            <Card>
              <CardHeader className="bg-muted/10 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="h-5 w-5" />
                  {t('Search Result Previews', 'معاينات نتائج البحث')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="border rounded-lg p-5 bg-background space-y-2 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">English Preview</span>
                    </div>
                    <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-[20px] truncate hover:underline cursor-pointer">
                      {seoForm.seo_title_en || 'Nama Taiba | Building Materials'}
                    </p>
                    <p className="text-[14px] text-[#006621] dark:text-[#81c995] truncate">
                      {seoForm.meta_canonical_url || 'https://www.nama-taiba.com'}
                    </p>
                    <p className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-snug">
                      {seoForm.seo_description_en || 'Leading manufacturer of premium building materials, GRC, GRP, and modern construction solutions in Saudi Arabia.'}
                    </p>
                  </div>
                  <div className="border rounded-lg p-5 bg-background space-y-2 shadow-sm" dir="rtl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">Arabic Preview</span>
                    </div>
                    <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-[20px] truncate hover:underline cursor-pointer">
                      {seoForm.seo_title_ar || 'نما طيبة | مواد البناء'}
                    </p>
                    <p className="text-[14px] text-[#006621] dark:text-[#81c995] truncate" dir="ltr">
                      {seoForm.meta_canonical_url || 'https://www.nama-taiba.com'}
                    </p>
                    <p className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-snug">
                      {seoForm.seo_description_ar || 'مصنع رائد لمواد البناء عالية الجودة، جي ار سي، جي ار بي، والحلول الإنشائية الحديثة في السعودية.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GTM & GA4 */}
            <Card>
              <CardHeader className="bg-muted/10 pb-4 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5" />
                  {t('Analytics & Tracking Scripts', 'سكريبتات التحليلات والتتبع')}
                </CardTitle>
                <CardDescription>
                  {t('Configure Google Tag Manager and Google Analytics 4', 'تكوين مدير علامات جوجل و Google Analytics 4')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* GTM Section */}
                <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{t('Enable Google Tag Manager', 'تفعيل Google Tag Manager')}</Label>
                      <p className="text-sm text-muted-foreground">{t('Inject GTM script into your website globally', 'إدخال سكريبت GTM في موقعك بشكل عام')}</p>
                    </div>
                    <Switch
                      checked={seoForm.gtm_enabled === 'true'}
                      onCheckedChange={(checked) => setSeoForm(p => ({ ...p, gtm_enabled: checked ? 'true' : 'false' }))}
                    />
                  </div>
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    <Label>GTM ID</Label>
                    <Input
                      value={seoForm.gtm_id || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, gtm_id: e.target.value }))}
                      dir="ltr"
                      placeholder="GTM-XXXXXXX"
                      disabled={seoForm.gtm_enabled !== 'true'}
                      className="font-mono max-w-sm"
                    />
                  </div>
                </div>

                {/* GA4 Section */}
                <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{t('Enable Google Analytics 4', 'تفعيل Google Analytics 4')}</Label>
                      <p className="text-sm text-muted-foreground">{t('Inject Google Analytics 4 tracking script', 'إدخال سكريبت تتبع Google Analytics 4')}</p>
                    </div>
                    <Switch
                      checked={seoForm.ga4_enabled === 'true'}
                      onCheckedChange={(checked) => setSeoForm(p => ({ ...p, ga4_enabled: checked ? 'true' : 'false' }))}
                    />
                  </div>
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    <Label>{t('Measurement ID', 'معرّف القياس')}</Label>
                    <Input
                      value={seoForm.ga4_id || ''}
                      onChange={(e) => setSeoForm(p => ({ ...p, ga4_id: e.target.value }))}
                      dir="ltr"
                      placeholder="G-XXXXXXXXXX"
                      disabled={seoForm.ga4_enabled !== 'true'}
                      className="font-mono max-w-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4 pb-12">
              <Button type="submit" size="lg" disabled={seoMutation.isPending} className="px-8 shadow-md">
                {seoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {t('Save SEO Settings', 'حفظ إعدادات السيو')}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Advanced Tools Tab */}
        <TabsContent value="tools" className="pb-12">
            <SeoIndexingTools
              verification={{
                google: seoForm.verify_google,
                bing: seoForm.verify_bing,
                yandex: seoForm.verify_yandex,
                pinterest: seoForm.verify_pinterest,
              }}
              onVerificationChange={(v) => {
                const newForm = {
                  ...seoForm,
                  verify_google: v.google || '',
                  verify_bing: v.bing || '',
                  verify_yandex: v.yandex || '',
                  verify_pinterest: v.pinterest || '',
                };
                setSeoForm(newForm);
                seoMutation.mutate(newForm); // Auto-save verification tags
              }}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
