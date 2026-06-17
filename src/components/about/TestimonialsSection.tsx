
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTestimonials } from '@/backend/testimonials';
import AddReviewForm from './AddReviewForm';

const TestimonialsSection = () => {
  const { t, language } = useLanguage();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials
  });

  const displayTestimonials = testimonials || [];

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/50">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">
          {t('What Our Clients Say', 'ما يقوله عملاؤنا')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-16 bg-muted rounded mb-4"></div>
                <div className="h-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (displayTestimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className="py-12 bg-muted/50">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-center text-primary">
          {t('What Our Clients Say', 'ما يقوله عملاؤنا')}
        </h2>
        <AddReviewForm />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTestimonials.map((testimonial) => (
          <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start mb-4">
                {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-nama-gold fill-nama-gold" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                {language === 'en' ? testimonial.contentEn : testimonial.contentAr}
              </p>
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="font-semibold">
                    {language === 'en' ? testimonial.nameEn : testimonial.nameAr}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {language === 'en' ? testimonial.positionEn : testimonial.positionAr}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
