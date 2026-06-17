import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCertifications, Certification } from '@/backend/certifications';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CertificationsSection from '@/components/about/CertificationsSection';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

const Quality: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertifications = async () => {
      try {
        setLoading(true);
        const certData = await getCertifications();
        setCertifications(certData);
        setLoading(false);
      } catch (err) {
        setError(t('Error loading certifications', 'خطأ في تحميل الشهادات'));
        setLoading(false);
      }
    };

    loadCertifications();
  }, [t]);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        url="/quality"
        titleEn="Quality & Certifications"
        titleAr="الجودة والشهادات"
        descriptionEn="Nama Taiba's quality certifications reflect our commitment to excellence in building materials manufacturing."
        descriptionAr="شهادات الجودة في نما طيبة تعكس التزامنا بالتميز في تصنيع مواد البناء."
        keywords="quality, certifications, ISO, building materials, الجودة, الشهادات"
      />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-4 text-primary">
            {t('Quality', 'الجودة')}
          </h1>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t(
              'Our certifications reflect our commitment to quality and excellence',
              'شهاداتنا تعكس التزامنا بالجودة والتميز'
            )}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-destructive">{error}</div>
          ) : (
            <CertificationsSection certifications={certifications} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Quality;
