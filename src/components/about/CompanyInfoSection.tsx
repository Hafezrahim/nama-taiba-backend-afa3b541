
import { useLanguage } from '@/contexts/LanguageContext';
import { type AboutInfo } from '@/backend/about';
import { Button } from '../ui/button';
import { FileText } from 'lucide-react';

interface CompanyInfoSectionProps {
  aboutInfo: AboutInfo;
}

const CompanyInfoSection = ({ aboutInfo }: CompanyInfoSectionProps) => {
  const { t, language, isRTL } = useLanguage();
  
  // Company profile URL
  const companyProfileUrl = "https://www.nama-taiba.com/public/frontend/img/nama/NamaTaiba-profile.pdf";

  return (
    <div className="mb-16">
      {/* Vision Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div className={`${isRTL ? 'order-2' : 'order-1'}`}>
          <section>
            <h2 className="text-2xl font-bold text-nama-purple mb-4">
              {t('Our Vision', 'رؤيتنا')}
            </h2>
            <p className="text-gray-600">
              {language === 'en' ? aboutInfo.vision.content_en : aboutInfo.vision.content_ar}
            </p>
          </section>
        </div>

        <div className={`${isRTL ? 'order-1' : 'order-2'}`}>
          {aboutInfo.vision.image ? (
            <div className="bg-white p-3 shadow-xl rounded-lg transform -rotate-2">
              <img
                src={aboutInfo.vision.image}
                alt={t('Nama Taiba Vision', 'رؤية نما طيبة')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="bg-white p-3 shadow-xl rounded-lg transform -rotate-2">
              <img
                src="https://images.unsplash.com/photo-1466442929976-97f336a657be"
                alt={t('Nama Taiba Vision', 'رؤية نما طيبة')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Mission Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div className={`${isRTL ? 'order-1' : 'order-2'}`}>
          <section>
            <h2 className="text-2xl font-bold text-nama-purple mb-4">
              {t('Our Mission', 'مهمتنا')}
            </h2>
            <p className="text-gray-600">
              {language === 'en' ? aboutInfo.mission.content_en : aboutInfo.mission.content_ar}
            </p>
          </section>
        </div>

        <div className={`${isRTL ? 'order-2' : 'order-1'}`}>
          {aboutInfo.mission.image ? (
            <div className="bg-white p-3 shadow-xl rounded-lg transform rotate-2">
              <img
                src={aboutInfo.mission.image}
                alt={t('Nama Taiba Mission', 'مهمة نما طيبة')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="bg-white p-3 shadow-xl rounded-lg transform rotate-2">
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf"
                alt={t('Nama Taiba Mission', 'مهمة نما طيبة')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div className={`${isRTL ? 'order-2' : 'order-1'}`}>
          <section>
            <h2 className="text-2xl font-bold text-nama-purple mb-4">
              {t('Our History', 'تاريخنا')}
            </h2>
            <p className="text-gray-600">
              {language === 'en' ? aboutInfo.history.content_en : aboutInfo.history.content_ar}
            </p>
          </section>
        </div>

        <div className={`${isRTL ? 'order-1' : 'order-2'}`}>
          {aboutInfo.history.image ? (
            <div className="bg-white p-3 shadow-xl rounded-lg transform -rotate-1">
              <img
                src={aboutInfo.history.image}
                alt={t('Nama Taiba History', 'تاريخ نما طيبة')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          ) : (
            <div className="bg-white p-3 shadow-xl rounded-lg transform -rotate-1">
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd"
                alt={t('Nama Taiba History', 'تاريخ نما طيبة')}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Company Profile Button Section */}
      <div className="flex justify-center mt-10 mb-6">
        <a 
          href={companyProfileUrl}
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button 
            className="bg-nama-orange hover:bg-nama-purple text-white px-6 py-6 text-lg flex items-center gap-3"
          >
            <FileText className="h-6 w-6" />
            {t('Download Company Profile', 'تحميل الملف التعريفي')}
          </Button>
        </a>
      </div>
    </div>
  );
};

export default CompanyInfoSection;
