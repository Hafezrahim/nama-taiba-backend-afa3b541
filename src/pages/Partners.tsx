import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPartners, Partner } from '@/backend/partners';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PartnersSection from '@/components/about/PartnersSection';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

const Partners = () => {
  const { t, isRTL } = useLanguage();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        setLoading(true);
        const partnersData = await getPartners();
        setPartners(partnersData);
        setLoading(false);
      } catch (err) {
        setError(t('Error loading partners', 'خطأ في تحميل الشركاء'));
        setLoading(false);
      }
    };

    loadPartners();
  }, [t]);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        url="/partners"
        titleEn="Success Partners"
        titleAr="شركاء النجاح"
        descriptionEn="Discover Nama Taiba's success partners — leading companies we collaborate with across the construction industry."
        descriptionAr="تعرف على شركاء نجاح نما طيبة — الشركات الرائدة التي نتعاون معها في قطاع البناء والتشييد."
        keywords="partners, success partners, شركاء النجاح, الشركاء"
      />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-4 text-primary">
            {t('Success Partners', 'شركاء النجاح')}
          </h1>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t(
              'We are proud to partner with leading companies in the industry',
              'نفخر بالشراكة مع الشركات الرائدة في المجال'
            )}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-destructive">{error}</div>
          ) : (
            <PartnersSection partners={partners} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Partners;
