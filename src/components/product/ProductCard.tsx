
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { type Product } from '@/backend/products';
import productPlaceholder from '@/assets/product-placeholder.jpg';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { language } = useLanguage();
  const { addToCart, cartItems } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();

  // Use the slug from the product
  const productSlug = product.slug;

  // Check if product is in cart
  const isInCart = cartItems.some(item => item.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.image,
      size: product.size
    }, product.moq || 1);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.image || productPlaceholder,
      inStock: product.inStock,
      size: product.size
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/products/${productSlug}`} className="block">
        <div className="relative">
          <div className="h-48 overflow-hidden">
            <img 
              src={product.image || productPlaceholder} 
              alt={language === 'en' ? product.nameEn : product.nameAr}
              className="w-full h-full object-cover"
            />
          </div>
          {product.size && (
            <Badge className="absolute top-2 right-2 bg-nama-purple">
              {product.size}
            </Badge>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge variant="outline" className="bg-red-500 text-white border-none px-3 py-1 text-sm">
                {language === 'en' ? 'Out of Stock' : 'غير متوفر'}
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {language === 'en' ? product.nameEn : product.nameAr}
          </h3>
          <p className="text-nama-purple font-semibold">
            {product.price.toFixed(2)} {language === 'en' ? 'SAR' : 'ر.س'}
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-between gap-2">
          <Button
            onClick={handleAddToCart}
            className={`flex-1 ${isInCart ? 'bg-green-500 hover:bg-green-600' : 'bg-nama-purple hover:bg-nama-gold'}`}
            disabled={!product.inStock}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isInCart 
              ? (language === 'en' ? 'Added to Cart' : 'تمت الإضافة') 
              : (language === 'en' ? 'Add to Cart' : 'أضف للسلة')}
          </Button>
          
          <Button
            variant={isInWishlist(product.id) ? "default" : "outline"}
            onClick={handleAddToWishlist}
            className={`p-2 ${isInWishlist(product.id) ? "bg-red-500 hover:bg-red-600" : ""}`}
            aria-label={language === 'en' ? 'Add to Wishlist' : 'أضف للمفضلة'}
          >
            <Heart className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default ProductCard;
