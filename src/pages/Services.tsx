import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getServices, Service } from '../services/sheetsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '@/components/SEO';

const Services = () => {
  const { t, language, isRTL } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await getServices();
        setServices(data);
        setLoading(false);
      } catch (err) {
        setError(t('Error loading services', 'خطأ في تحميل الخدمات'));
        setLoading(false);
      }
    };

    loadServices();
  }, [t]);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url="/services"
        titleEn="Our Services - Nama Taiba Factory"
        titleAr="خدماتنا - مصنع نما طيبة"
        descriptionEn="Explore our comprehensive range of services including manufacturing, installation, design consultation, and custom building solutions."
        descriptionAr="استكشف مجموعتنا الشاملة من الخدمات بما في ذلك التصنيع والتركيب والاستشارات التصميمية وحلول البناء المخصصة."
        keywords="services, manufacturing, installation, design, خدمات, تصنيع, تركيب, تصميم"
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-12">
            {t('Our Services', 'خدماتنا')}
          </h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card key={service.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-nama-purple flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <CardTitle className="text-xl">
                      {language === 'en' ? service.titleEn : service.titleAr}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      {language === 'en' ? service.descriptionEn : service.descriptionAr}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Services;
