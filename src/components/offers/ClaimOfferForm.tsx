
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type Offer } from '@/backend/offers';
import { toast } from '@/hooks/use-toast';
import OfferDetailsView from './OfferDetailsView';
import ClientInformationForm from './ClientInformationForm';
import { handleOfferSubmission, shareOfferOnWhatsApp } from '@/utils/offerSubmissionUtils';

interface ClaimOfferFormProps {
  offer: Offer;
  isOpen: boolean;
  onClose: () => void;
}

const ClaimOfferForm = ({ offer, isOpen, onClose }: ClaimOfferFormProps) => {
  const { t, language } = useLanguage();
  const [quantity, setQuantity] = useState(offer.minQty || 1);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleQuantityChange = (increment: boolean) => {
    if (increment && quantity < offer.maxQty) {
      setQuantity(prev => prev + 1);
    } else if (!increment && quantity > offer.minQty) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await handleOfferSubmission(offer, clientInfo, quantity, language);
      await shareOfferOnWhatsApp(offer, clientInfo, quantity, language, t);
      
      toast({
        title: t('Offer Claimed Successfully', 'تم المطالبة بالعرض بنجاح'),
        description: t('Check your downloads for the invoice', 'تحقق من التنزيلات للحصول على الفاتورة')
      });
      
      onClose();
    } catch (error) {
      console.error('Error processing offer claim:', error);
      toast({
        title: t('Failed to process', 'فشل في المعالجة'),
        description: t('Please try again', 'يرجى المحاولة مرة أخرى'),
        variant: 'destructive',
      });
    }
  };

  const offerName = language === 'en' ? offer.titleEn : offer.titleAr;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Claim Offer', 'المطالبة بالعرض')}: {offerName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <OfferDetailsView
            offerName={offerName}
            price={offer.price}
            quantity={quantity}
            maxQuantity={offer.maxQty}
            minQuantity={offer.minQty}
            onQuantityChange={handleQuantityChange}
          />
          
          <ClientInformationForm
            clientInfo={clientInfo}
            onFieldChange={handleFieldChange}
          />
          
          <Button type="submit" className="w-full bg-nama-purple hover:bg-nama-purple/90">
            {t('Submit', 'تأكيد')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimOfferForm;
