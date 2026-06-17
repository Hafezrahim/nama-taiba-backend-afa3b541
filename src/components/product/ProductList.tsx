
import type { Product } from '@/backend/products';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductListProps {
  products: Product[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const ProductList = ({ products, isLoading, error }: ProductListProps) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
          <Skeleton key={i} className="h-[400px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        {t('Error loading products. Please try again later.',
           'خطأ في تحميل المنتجات. الرجاء المحاولة مرة أخرى لاحقًا.')}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">
          {t('No products available at the moment.',
             'لا توجد منتجات متاحة في الوقت الحالي.')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
