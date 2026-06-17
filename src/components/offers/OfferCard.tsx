
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type Offer } from '@/backend/offers';
import ClaimOfferForm from './ClaimOfferForm';

interface OfferCardProps {
  offer: Offer;
}

export const OfferCard = ({ offer }: OfferCardProps) => {
  const { t, language } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isExpired = new Date(offer.validUntil) < new Date();
  
  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full border-0 shadow-md">
        {offer.image && (
          <div className="h-32 md:h-48 overflow-hidden relative">
            <img
              src={offer.image}
              alt={language === 'en' ? offer.titleEn : offer.titleAr}
              className="w-full h-full object-cover"
            />
            {isExpired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge className="bg-red-500 text-white px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-base">
                  {t('Expired', 'منتهي الصلاحية')}
                </Badge>
              </div>
            )}
            
            {offer.category && !isExpired && (
              <div className="absolute top-1.5 md:top-2 left-1.5 md:left-2">
                <Badge className="bg-primary text-primary-foreground px-1.5 md:px-3 py-0.5 text-[10px] md:text-xs">
                  {offer.category}
                </Badge>
              </div>
            )}
          </div>
        )}
        
        <CardContent className="flex-grow p-2.5 md:p-5 space-y-1.5 md:space-y-3">
          <h3 className="font-bold text-sm md:text-lg text-foreground line-clamp-1">
            {language === 'en' ? offer.titleEn : offer.titleAr}
          </h3>
          
          <p className="text-muted-foreground text-[11px] md:text-sm line-clamp-2 leading-relaxed md:leading-[1.7]">
            {language === 'en' ? offer.descriptionEn : offer.descriptionAr}
          </p>
          
          <div className="flex items-center justify-between gap-1">
            {!isExpired && (
              <span className="font-bold text-primary text-sm md:text-lg">
                {offer.price.toFixed(0)} {t('SAR', 'ر.س')}
              </span>
            )}
            <span className={`text-[9px] md:text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              {new Date(offer.validUntil).toLocaleDateString()}
            </span>
          </div>

          {offer.minQty > 1 && !isExpired && (
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {t('Min', 'الحد الأدنى')}: {offer.minQty}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="p-2.5 md:p-5 pt-0">
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="w-full text-xs md:text-sm h-8 md:h-10"
            disabled={isExpired}
            size="sm"
          >
            {isExpired 
              ? t('Expired', 'منتهي')
              : t('Claim Offer', 'احصل على العرض')}
          </Button>
        </CardFooter>
      </Card>
      
      {isDialogOpen && (
        <ClaimOfferForm 
          offer={offer}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
};
