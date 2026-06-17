import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import type { Product } from '@/backend/products';
import productPlaceholder from '@/assets/product-placeholder.jpg';

interface SimilarProductsProps {
  products: Product[];
  currentProductId: string;
}

const SimilarProducts = ({ products, currentProductId }: SimilarProductsProps) => {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  const similarProducts = products
    .filter(p => p.id !== currentProductId)
    .slice(0, 4);

  if (similarProducts.length === 0) return null;

  const handleProductClick = (product: Product) => {
    navigate(`/products/${product.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.image || '',
      size: product.size
    }, product.moq || 1);
  };

  const handleAddToWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToWishlist({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.image || '',
      inStock: product.inStock,
      size: product.size
    });
  };

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        {t('Similar Products', 'منتجات مشابهة')}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similarProducts.map((product) => {
          const isInCart = cartItems.some(item => item.id === product.id);
          const inWishlist = isInWishlist(product.id);

          return (
            <Card 
              key={product.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => handleProductClick(product)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image || productPlaceholder}
                  alt={language === 'en' ? product.nameEn : product.nameAr}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                  {language === 'en' ? product.nameEn : product.nameAr}
                </h3>
                <p className="text-primary font-bold text-sm">
                  {product.price.toFixed(2)} {t('SAR', 'ر.س')}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={isInCart ? "default" : "outline"}
                    className={`flex-1 text-xs h-8 ${isInCart ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {isInCart ? t('Added', 'تمت') : t('Cart', 'سلة')}
                  </Button>
                  <Button
                    size="sm"
                    variant={inWishlist ? "default" : "outline"}
                    className={`h-8 w-8 p-0 ${inWishlist ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    onClick={(e) => handleAddToWishlist(product, e)}
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default SimilarProducts;
