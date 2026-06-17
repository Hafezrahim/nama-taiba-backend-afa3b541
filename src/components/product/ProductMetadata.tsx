
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import type { Product } from '@/backend/products';

interface ProductMetadataProps {
  product: Product;
  keywords: string[];
}

const ProductMetadata = ({ product, keywords }: ProductMetadataProps) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-600">{t('Category', 'الفئة')}:</span>
        <span>{product.category}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">{t('Size', 'الحجم')}:</span>
        <span>{product.size}</span>
      </div>
      
      {keywords.length > 0 && (
        <div className="mt-4">
          <span className="text-gray-600 inline-block mb-2">{t('Tags', 'الوسوم')}:</span>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="flex items-center gap-1 text-nama-purple"
              >
                <Tag className="h-3 w-3" />
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMetadata;
