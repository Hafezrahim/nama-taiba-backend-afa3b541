import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCertifications, Certification } from '@/backend/certifications';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CertificationsSection from '@/components/about/CertificationsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Award, FileCheck2, BadgeCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl border bg-card/60 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          ) : sections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 items-stretch">
              {sections.map((s, idx) => {
                const title = language === 'ar' ? s.title_ar : s.title_en;
                const content = language === 'ar' ? s.content_ar : s.content_en;
                const icons = [ShieldCheck, Award, FileCheck2, BadgeCheck, Sparkles, CheckCircle2];
                const IconComponent = icons[idx % icons.length];

                return (
                  <article 
                    key={s.id} 
                    className="group relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card via-card to-muted/20 p-7 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-nama-purple/40 dark:hover:border-nama-gold/40"
                  >
                    {/* Top gradient accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nama-purple via-nama-red to-nama-gold opacity-75 group-hover:opacity-100 transition-opacity" />

                    {/* Subtle corner radial glow */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-nama-purple/5 dark:bg-nama-gold/5 blur-2xl group-hover:bg-nama-purple/10 dark:group-hover:bg-nama-gold/10 transition-colors pointer-events-none" />

                    <div>
                      {/* Card Header: Icon & Step/Order Pill */}
                      <div className="flex items-center justify-between gap-4 mb-5">
                        <div className="h-12 w-12 rounded-xl bg-nama-purple/10 dark:bg-nama-gold/10 text-nama-purple dark:text-nama-gold flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-nama-purple group-hover:text-white dark:group-hover:bg-nama-gold dark:group-hover:text-black transition-all duration-300">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="font-mono text-xs px-2.5 py-0.5 bg-muted/80 text-muted-foreground group-hover:bg-nama-purple/10 group-hover:text-nama-purple dark:group-hover:bg-nama-gold/10 dark:group-hover:text-nama-gold transition-colors"
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-bold mb-4 text-foreground tracking-tight group-hover:text-nama-purple dark:group-hover:text-nama-gold transition-colors">
                        {title}
                      </h2>

                      {/* Content */}
                      {content && (
                        <div
                          className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-semibold prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-ul:my-2 prose-li:my-1 prose-img:rounded-lg prose-img:mx-auto leading-relaxed break-words"
                          dir={isRTL ? 'rtl' : 'ltr'}
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      )}
                    </div>

                    {/* Card Footer: Certified Standard Pill */}
                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 text-nama-purple dark:text-nama-gold font-medium">
                        <BadgeCheck className="h-4 w-4" />
                        {t('Certified Standard', 'معيار معتمد')}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                        Nama Taiba
                      </span>
                    </div>
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
