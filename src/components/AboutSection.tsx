
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAboutInfo, AboutInfo } from '../services/sheetsService';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AboutSection = () => {
  const { t, language, isRTL } = useLanguage();
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyProfileUrl, setCompanyProfileUrl] = useState(
    "https://www.nama-taiba.com/public/frontend/img/nama/NamaTaiba-profile.pdf"
  );

  useEffect(() => {
    const loadAboutInfo = async () => {
      try {
        setLoading(true);
        const data = await getAboutInfo();
        setAboutInfo(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading about info:', err);
        setLoading(false);
      }
    };

    const loadProfileUrl = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'company_profile_url')
        .maybeSingle();
      if (data?.setting_value) setCompanyProfileUrl(data.setting_value);
    };

    loadAboutInfo();
    loadProfileUrl();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="section-title">{t('About Nama Taiba', 'عن نما طيبة')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
            <div className="space-y-6">
              <div className="animate-pulse bg-gray-200 h-6 rounded w-3/4" />
              <div className="animate-pulse bg-gray-200 h-4 rounded" />
              <div className="animate-pulse bg-gray-200 h-4 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!aboutInfo) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="section-title">{t('About Nama Taiba', 'عن نما طيبة')}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image Column */}
          <div className={isRTL ? 'order-1' : 'order-2'}>
            <div className="bg-white p-3 shadow-xl rounded-lg transform -rotate-2">
              <img 
                src={aboutData.vision.image || "https://www.nama-taiba.com/build/assets/about-7eff9a9c.png"} 
                alt={t('Nama Taiba Factory', 'مصنع نما طيبة')} 
                className="w-full h-auto rounded-lg" 
              />
            </div>
          </div>
          
          {/* Content Column */}
          <div className={isRTL ? 'order-2' : 'order-1'}>
            <div className="space-y-6">
              {/* Vision */}
              <div>
                <h3 className="text-2xl font-bold text-nama-purple mb-2">
                  {t('Our Vision', 'رؤيتنا')}
                </h3>
                <p className="text-gray-700 leading-relaxed md:leading-[1.8] text-base md:text-lg">
                  {language === 'en' ? aboutData.vision.content_en : aboutData.vision.content_ar}
                </p>
              </div>
              
              {/* Mission */}
              <div>
                <h3 className="text-2xl font-bold text-nama-purple mb-2">
                  {t('Our Mission', 'مهمتنا')}
                </h3>
                <p className="text-gray-700 leading-relaxed md:leading-[1.8] text-base md:text-lg">
                  {language === 'en' ? aboutData.mission.content_en : aboutData.mission.content_ar}
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="pt-4 flex flex-wrap gap-3">
                <Link to="/about">
                  <Button className="bg-nama-orange hover:bg-nama-purple">
                    {t('Learn More About Us', 'تعرف علينا أكثر')}
                  </Button>
                </Link>
                
                {/* Download Company Profile Button */}
                <a 
                  href={companyProfileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="border-nama-purple text-nama-purple hover:bg-nama-purple hover:text-white">
                    <Download className="mr-1 h-4 w-4" />
                    {t('Download Company Profile', 'تحميل الملف التعريفي')}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
