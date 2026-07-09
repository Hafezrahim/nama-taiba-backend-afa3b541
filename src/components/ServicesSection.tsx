import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import { getServices, Service } from '../services/sheetsService';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const ServicesSection = () => {
  const { t, language } = useLanguage();

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="section-title">{t('Our Services', 'خدماتنا')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((_, i) => (
              <Card key={i} className="animate-pulse border-none shadow-lg">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="section-title">{t('Our Services', 'خدماتنا')}</h2>
          <p className="text-red-500">{t('Error loading services', 'خطأ في تحميل الخدمات')}</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="section-title">{t('Our Services', 'خدماتنا')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {displayServices.map((service) => (
            <Card key={service.id} className="card-hover border-none shadow-lg">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-nama-purple flex items-center justify-center mb-4">
                  <svg 
                    className="w-8 h-8 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold">
                  {language === 'en' ? service.titleEn : service.titleAr}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed md:leading-[1.8] text-sm md:text-base">
                  {language === 'en' ? service.descriptionEn : service.descriptionAr}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/services">
            <Button size="lg" className="bg-nama-purple hover:bg-nama-orange">
              {t('View All Services', 'عرض جميع الخدمات')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;
