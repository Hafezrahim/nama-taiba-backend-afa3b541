import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCertifications, Certification } from '@/backend/certifications';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CertificationsSection from '@/components/about/CertificationsSection';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

interface QualitySection {
  id: string;
  title_en: string;
  title_ar: string;
  content_en: string | null;
  content_ar: string | null;
  display_order: number;
  is_active: boolean;
}

const Quality: React.FC = () => {
  const { t, isRTL, language } = useLanguage();

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['quality-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as QualitySection[];
    },
  });

  const { data: certifications = [], isLoading: certsLoading } = useQuery({
    queryKey: ['public-certifications'],
    queryFn: () => getCertifications(),
  });

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        url="/quality"
        titleEn="Quality & Certifications"
        titleAr="الجودة والشهادات"
        descriptionEn="Nama Taiba's quality standards and certifications reflect our commitment to excellence in building materials manufacturing."
        descriptionAr="معايير الجودة والشهادات في نما طيبة تعكس التزامنا بالتميز في تصنيع مواد البناء."
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
              'Our standards and certifications reflect our commitment to quality and excellence',
              'معاييرنا وشهاداتنا تعكس التزامنا بالجودة والتميز'
            )}
          </p>

          {sectionsLoading ? (
            <div className="space-y-6 max-w-4xl mx-auto mb-16">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : sections.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-12 mb-16">
              {sections.map((s) => {
                const title = language === 'ar' ? s.title_ar : s.title_en;
                const content = language === 'ar' ? s.content_ar : s.content_en;
                return (
                  <article key={s.id} className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">{title}</h2>
                    {content && (
                      <div
                        className="prose prose-lg max-w-none dark:prose-invert prose-img:rounded-lg prose-img:mx-auto prose-headings:text-foreground prose-p:text-foreground/90 leading-relaxed"
                        dir={isRTL ? 'rtl' : 'ltr'}
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {certsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : certifications.length > 0 && (
            <CertificationsSection certifications={certifications} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Quality;
