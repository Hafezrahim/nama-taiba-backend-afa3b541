
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/contexts/CartContext';
import { generateInvoice } from '@/utils/invoiceGenerator';
import { handleWhatsAppShare } from '@/utils/whatsAppShare';

interface CartOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  isProcessing: boolean;
  clientInfo: {
    name: string;
    phone: string;
    address: string;
  };
  onCheckout: () => void;
  onCouponApply: (code: string) => void;
}

const CartOrderSummary = ({
  cartItems,
  subtotal,
  shipping,
  discount,
  total,
  isProcessing,
  clientInfo,
  onCheckout,
  onCouponApply,
}: CartOrderSummaryProps) => {
  const { t, language } = useLanguage();
  const [couponCode, setCouponCode] = useState('');

  const validateClientInfo = () => {
    if (!clientInfo.name || !clientInfo.phone || !clientInfo.address) {
      toast({
        title: t('Missing information', 'معلومات ناقصة'),
        description: t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'),
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        <h2 className="font-bold text-xl mb-4">
          {t('Order Summary', 'ملخص الطلب')}
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>{t('Subtotal', 'المجموع الفرعي')}</span>
            <span>{subtotal.toFixed(2)} {t('SAR', 'ر.س')}</span>
          </div>

          {shipping > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>{t('Shipping', 'الشحن')}</span>
              <span>{shipping.toFixed(2)} {t('SAR', 'ر.س')}</span>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Label htmlFor="coupon">{t('Coupon Code', 'رمز الكوبون')}</Label>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Input 
                id="coupon" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                placeholder={t('Enter coupon code', 'أدخل رمز الكوبون')}
                className="flex-grow"
              />
              <Button 
                variant="outline" 
                onClick={() => onCouponApply(couponCode)}
                disabled={!couponCode}
              >
                {t('Apply', 'تطبيق')}
              </Button>
            </div>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t('Discount', 'الخصم')}</span>
              <span>-{discount.toFixed(2)} {t('SAR', 'ر.س')}</span>
            </div>
          )}
          
          <Separator />
          <div className="flex justify-between font-bold">
            <span>{t('Total', 'المجموع')}</span>
            <span>{total.toFixed(2)} {t('SAR', 'ر.س')}</span>
          </div>
        </div>
        
        <Button 
          className="w-full mt-6 bg-green-500 hover:bg-green-600"
          onClick={onCheckout}
          disabled={isProcessing || cartItems.length === 0}
        >
          {isProcessing ? (
            t('Processing...', 'جاري المعالجة...')
          ) : (
            t('Checkout', 'إتمام الشراء')
          )}
        </Button>
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            className="flex-1 mr-2"
            onClick={async () => {
              if (!validateClientInfo()) return;
              try {
                const { pdf } = await generateInvoice(cartItems, clientInfo, { subtotal, shipping, discount, vat: 0, total }, { language });
                pdf.save(`invoice-${Date.now()}.pdf`);
                toast({
                  title: t('Invoice generated', 'تم إنشاء الفاتورة'),
                  description: t('Your invoice has been downloaded', 'تم تنزيل فاتورتك')
                });
              } catch (error) {
                console.error('Invoice generation error:', error);
                toast({
                  title: t('Failed to generate invoice', 'فشل في إنشاء الفاتورة'),
                  description: t('Please try again', 'يرجى المحاولة مرة أخرى'),
                  variant: 'destructive'
                });
              }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            {t('Invoice', 'الفاتورة')}
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 ml-2"
            onClick={() => {
              if (!validateClientInfo()) return;
              handleWhatsAppShare(cartItems, clientInfo, { subtotal, shipping, discount, vat: 0, total });
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('WhatsApp', 'واتساب')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartOrderSummary;
