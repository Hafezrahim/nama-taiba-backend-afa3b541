import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart, Heart, Share2, FileText } from 'lucide-react';
import GetQuoteModal from './GetQuoteModal';

interface ProductActionsProps {
  productName: string;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  onShare: () => void;
  isInCart: boolean;
  isInWishlist: boolean;
  isInStock: boolean;
}

const ProductActions = ({
  productName,
  onAddToCart,
  onAddToWishlist,
  onShare,
  isInCart,
  isInWishlist,
  isInStock
}: ProductActionsProps) => {
  const { t, isRTL } = useLanguage();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  
  return (
    <>
      <div className="space-y-4">
        <Button
          onClick={onAddToCart}
          className={`w-full ${isInCart ? 'bg-green-500 hover:bg-green-600' : ''}`}
          disabled={!isInStock}
        >
          <ShoppingCart className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('Add to Cart', 'أضف للسلة')}
        </Button>

        <Button
          onClick={() => setIsQuoteModalOpen(true)}
          className="w-full bg-nama-gold hover:bg-nama-purple text-white transition-colors"
        >
          <FileText className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('Get a Quote', 'طلب عرض سعر')}
        </Button>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={isInWishlist ? "default" : "outline"}
            onClick={onAddToWishlist}
            className={`w-full ${isInWishlist ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
          >
            <Heart className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('Add to Wishlist', 'أضف للمفضلة')}
          </Button>
          
          <Button
            variant="outline"
            onClick={onShare}
            className="w-full"
          >
            <Share2 className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('Share', 'مشاركة')}
          </Button>
        </div>
      </div>

      <GetQuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        productName={productName} 
      />
    </>
  );
};

export default ProductActions;
