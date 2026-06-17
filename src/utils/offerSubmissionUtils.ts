
import { generateOfferInvoice } from './invoiceGenerator';
import { Offer } from '@/services/types';

interface ClientInfo {
  name: string;
  phone: string;
  address: string;
}

export const handleOfferSubmission = async (
  offer: Offer,
  clientInfo: ClientInfo,
  quantity: number,
  language: string = 'en'
) => {
  try {
    const subtotal = offer.price * quantity;
    const total = subtotal;

    const { pdf } = await generateOfferInvoice(
      {
        title: language === 'en' ? offer.titleEn : offer.titleAr,
        quantity,
        unitPrice: offer.price
      },
      clientInfo,
      { subtotal, shipping: 0, discount: 0, vat: 0, total },
      { language: language as 'en' | 'ar' }
    );
    
    pdf.save(`offer-invoice-${offer.id}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

export const shareOfferOnWhatsApp = (
  offer: Offer,
  clientInfo: ClientInfo,
  quantity: number,
  language: string,
  t: (english: string, arabic: string) => string
) => {
  try {
    const message = encodeURIComponent(
      `New Offer Claim:\n\n` +
      `${t('Offer', 'العرض')}: ${language === 'en' ? offer.titleEn : offer.titleAr}\n` +
      `${t('Quantity', 'الكمية')}: ${quantity}\n` +
      `${t('Price', 'السعر')}: ${offer.price} SAR\n` +
      `${t('Total', 'المجموع')}: ${offer.price * quantity} SAR\n\n` +
      `${t('Client', 'العميل')}:\n` +
      `${t('Name', 'الاسم')}: ${clientInfo.name}\n` +
      `${t('Phone', 'الهاتف')}: ${clientInfo.phone}\n` +
      `${t('Address', 'العنوان')}: ${clientInfo.address}`
    );
    
    const whatsappLink = `https://wa.me/${String(offer.contact).replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappLink, '_blank');
    return true;
  } catch (error) {
    console.error('WhatsApp sharing error:', error);
    throw error;
  }
};
