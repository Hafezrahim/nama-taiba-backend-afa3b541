import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AboutSection {
  id: string;
  section_key: string;
  content_ar: string;
  content_en: string;
  image?: string;
}

export default function AdminAbout() {
  const { t } = useLanguage();
  const [sections, setSections] = useState<Record<string, AboutSection>>({});
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState('');
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    fetchSections();
    fetchProfileUrl();
  }, []);

  const fetchProfileUrl = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'company_profile_url')
      .maybeSingle();
    if (data?.setting_value) setProfileUrl(data.setting_value);
  };

  const saveProfileUrl = async (url: string) => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('setting_key', 'company_profile_url')
      .maybeSingle();
    if (existing) {
      await supabase.from('site_settings').update({ setting_value: url }).eq('id', existing.id);
    } else {
      await supabase.from('site_settings').insert({ setting_key: 'company_profile_url', setting_value: url });
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error(t('Please upload a PDF file', 'يرجى رفع ملف PDF'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('Max file size is 10MB', 'الحد الأقصى 10 ميجابايت'));
      return;
    }
    try {
      setUploadingProfile(true);
      const path = `company-profile-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
      setProfileUrl(publicUrl);
      await saveProfileUrl(publicUrl);
      toast.success(t('Uploaded successfully', 'تم الرفع بنجاح'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSaveProfileUrl = async () => {
    try {
      await saveProfileUrl(profileUrl);
      toast.success(t('Saved successfully', 'تم الحفظ بنجاح'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('about_info')
        .select('*');

      if (error) throw error;
      
      const sectionsMap = (data || []).reduce((acc, section) => {
        acc[section.section_key] = section;
        return acc;
      }, {} as Record<string, AboutSection>);
      
      setSections(sectionsMap);
    } catch (error: any) {
      toast.error(t('Failed to load sections', 'فشل تحميل الأقسام'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (sectionKey: string, data: Partial<AboutSection>) => {
    try {
      const section = sections[sectionKey];
      
      const updateData = {
        content_ar: data.content_ar || '',
        content_en: data.content_en || '',
        image: data.image
      };

      if (section) {
        const { error } = await supabase
          .from('about_info')
          .update(updateData)
          .eq('id', section.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('about_info')
          .insert([{ section_key: sectionKey, ...updateData }]);

        if (error) throw error;
      }

      toast.success(t('Section updated successfully', 'تم تحديث القسم بنجاح'));
      fetchSections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const renderSectionForm = (sectionKey: string, title: string) => {
    const section = sections[sectionKey] || { 
      id: '', 
      section_key: sectionKey, 
      content_ar: '', 
      content_en: '', 
      image: '' 
    };

    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="grid gap-4">
          <div>
            <Label>{t('Content (English)', 'المحتوى (إنجليزي)')}</Label>
            <RichTextEditor
              value={section.content_en}
              onChange={(value) => setSections({
                ...sections,
                [sectionKey]: { ...section, content_en: value }
              })}
            />
          </div>
          <div>
            <Label>{t('Content (Arabic)', 'المحتوى (عربي)')}</Label>
            <RichTextEditor
              value={section.content_ar}
              onChange={(value) => setSections({
                ...sections,
                [sectionKey]: { ...section, content_ar: value }
              })}
              dir="rtl"
            />
          </div>
          <div>
            <Label>{t('Image URL', 'رابط الصورة')}</Label>
            <Input
              value={section.image || ''}
              onChange={(e) => setSections({
                ...sections,
                [sectionKey]: { ...section, image: e.target.value }
              })}
            />
          </div>
          <Button onClick={() => handleUpdate(sectionKey, section)}>
            {t('Save', 'حفظ')}
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('About Information', 'معلومات عنا')}</h1>

      <Tabs defaultValue="vision">
        <TabsList>
          <TabsTrigger value="vision">{t('Vision', 'الرؤية')}</TabsTrigger>
          <TabsTrigger value="mission">{t('Mission', 'الرسالة')}</TabsTrigger>
          <TabsTrigger value="history">{t('History', 'التاريخ')}</TabsTrigger>
        </TabsList>

        <TabsContent value="vision" className="mt-6">
          {renderSectionForm('vision', t('Vision', 'الرؤية'))}
        </TabsContent>

        <TabsContent value="mission" className="mt-6">
          {renderSectionForm('mission', t('Mission', 'الرسالة'))}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderSectionForm('history', t('History', 'التاريخ'))}
        </TabsContent>
      </Tabs>

      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold">{t('Company Profile (PDF)', 'الملف التعريفي (PDF)')}</h3>
        <div>
          <Label>{t('Profile URL', 'رابط الملف')}</Label>
          <div className="flex gap-2">
            <Input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://..." />
            <Button onClick={handleSaveProfileUrl}>{t('Save', 'حفظ')}</Button>
          </div>
        </div>
        <div>
          <Label>{t('Or upload a PDF file', 'أو ارفع ملف PDF')}</Label>
          <Input type="file" accept="application/pdf" onChange={handleProfileUpload} disabled={uploadingProfile} />
          {uploadingProfile && <p className="text-sm text-muted-foreground mt-1">{t('Uploading...', 'جاري الرفع...')}</p>}
        </div>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">
            {t('Preview current file', 'معاينة الملف الحالي')}
          </a>
        )}
      </div>
    </div>
  );
}
