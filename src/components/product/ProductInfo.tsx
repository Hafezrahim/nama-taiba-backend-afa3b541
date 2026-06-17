import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tag } from 'lucide-react';
import type { Product } from '@/backend/products';
import ProductActions from './ProductActions';
import ProductMetadata from './ProductMetadata';

interface ProductInfoProps {
  product: Product;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  onShare: () => void;
  isInCart: boolean;
  isInWishlist: boolean;
}

const ProductInfo = ({ 
  product, 
  onAddToCart, 
  onAddToWishlist, 
  onShare,
  isInCart,
  isInWishlist
}: ProductInfoProps) => {
  const { t, language, isRTL } = useLanguage();
  const keywords = product.keywords ? product.keywords.split(',').map(k => k.trim()) : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 text-nama-purple">
        {language === 'en' ? product.nameEn : product.nameAr}
      </h1>
      
      <p className="text-gray-700 mb-6">
        {language === 'en' ? product.descriptionEn : product.descriptionAr}
      </p>
      
      <div className="flex items-center mb-6">
        <span className="text-2xl font-bold text-nama-purple">
          {product.price} {t('SAR', 'ر.س')}
        </span>
        <span className={`${isRTL ? 'mr-4' : 'ml-4'} px-3 py-1 rounded-full text-sm ${
          product.inStock 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {product.inStock ? t('In Stock', 'متوفر') : t('Out of Stock', 'غير متوفر')}
        </span>
      </div>
      
      <ProductActions
        productName={language === 'en' ? product.nameEn : product.nameAr}
        onAddToCart={onAddToCart}
        onAddToWishlist={onAddToWishlist}
        onShare={onShare}
        isInCart={isInCart}
        isInWishlist={isInWishlist}
        isInStock={product.inStock}
      />
      
      <Separator className="my-6" />
      
      <ProductMetadata 
        product={product}
        keywords={keywords}
      />
    </div>
  );
};

export default ProductInfo;
