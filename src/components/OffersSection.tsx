
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { getOffers } from '@/backend/offers';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { OfferCard } from './offers/OfferCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';

const OffersSection = () => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['offers'],
    queryFn: getOffers
  });

  const featuredOffers = offers?.slice(0, 3);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h2 className="section-title">{t('Special Offers', 'عروض خاصة')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-36 md:h-48 bg-gray-200"></div>
              <div className="p-3 md:p-4">
                <div className="h-5 md:h-6 bg-gray-200 rounded w-3/4 mb-3 md:mb-4"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !featuredOffers || featuredOffers.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16 bg-gray-50">
      <h2 className="section-title">{t('Special Offers', 'عروض خاصة')}</h2>
      
      {isMobile ? (
        <Carousel opts={{ align: "start", direction: language === 'ar' ? 'rtl' : 'ltr' }} className="w-full">
          <CarouselContent className="-ml-2">
            {featuredOffers.map((offer) => (
              <CarouselItem key={offer.id} className="pl-2 basis-1/2">
                <OfferCard offer={offer} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
      
      <div className="text-center mt-8">
        <Link to="/offers">
          <Button variant="outline" className="border-2 border-nama-purple text-nama-purple hover:bg-nama-purple hover:text-white">
            {t('View All Offers', 'عرض جميع العروض')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OffersSection;
