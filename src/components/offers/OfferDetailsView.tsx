
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';

interface OfferDetailsViewProps {
  offerName: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  minQuantity: number;
  onQuantityChange: (increment: boolean) => void;
}

const OfferDetailsView = ({
  offerName,
  price,
  quantity,
  maxQuantity,
  minQuantity,
  onQuantityChange
}: OfferDetailsViewProps) => {
  const { t } = useLanguage();

  return (
    <div className="border p-4 rounded-md mb-4">
      <h3 className="font-medium mb-2">{t('Offer Details', 'تفاصيل العرض')}</h3>
      <p className="text-sm mb-2">{t('Price', 'السعر')}: {price} SAR</p>
      
      <div className="flex items-center">
        <Label htmlFor="quantity" className="mr-4">
          {t('Quantity', 'الكمية')}:
        </Label>
        <div className="flex items-center border rounded">
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => onQuantityChange(false)}
            disabled={quantity <= minQuantity}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => onQuantityChange(true)}
            disabled={quantity >= maxQuantity}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <p className="text-sm mt-2 font-medium">
        {t('Total', 'المجموع')}: {(price * quantity).toFixed(2)} SAR
      </p>
      {minQuantity > 1 && (
        <p className="text-xs text-gray-500 mt-1">
          {t('Minimum quantity', 'الحد الأدنى للكمية')}: {minQuantity}
        </p>
      )}
      {maxQuantity > 1 && (
        <p className="text-xs text-gray-500 mt-1">
          {t('Maximum quantity', 'الكمية القصوى')}: {maxQuantity}
        </p>
      )}
    </div>
  );
};

export default OfferDetailsView;
