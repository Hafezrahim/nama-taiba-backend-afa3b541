
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import productPlaceholder from '@/assets/product-placeholder.jpg';

interface ProductImageGalleryProps {
  image: string | undefined;
  productName: string;
  size?: string;
}

const ProductImageGallery = ({ image, productName, size }: ProductImageGalleryProps) => {
  return (
    <div className="relative overflow-hidden rounded-lg border">
      <img 
        src={image || productPlaceholder} 
        alt={productName}
        className="w-full h-auto object-cover"
      />
      {size && (
        <Badge className="absolute top-4 right-4 text-lg bg-nama-purple/80">
          {size}
        </Badge>
      )}
    </div>
  );
};

export default ProductImageGallery;
