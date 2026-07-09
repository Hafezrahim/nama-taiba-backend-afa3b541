
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { getProducts, Product } from '@/backend/products';
import { ShoppingCart, Heart } from 'lucide-react';
import { Badge } from './ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';

const ProductsSection = () => {
  const { t, language, isRTL } = useLanguage();
  const { addToCart, cartItems } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const isMobile = useIsMobile();
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  const featuredProducts = products?.filter(product => product.isFeatured).slice(0, 8);

  const isInCart = (id: string) => cartItems.some(item => item.id === id);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.image || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      size: product.size
    }, product.moq || 1);
  };

  const handleAddToWishlist = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist({
      id: product.id,
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      price: product.price,
      imageUrl: product.image || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      inStock: product.inStock,
      size: product.size
    });
  };

  const ProductCardComponent = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <Link to={`/products/${product.slug}`} className="block flex-1">
        <div className="relative h-36 md:h-48 overflow-hidden">
          <img
            src={product.image || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"}
            alt={language === 'en' ? product.nameEn : product.nameAr}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          <Badge className="absolute top-2 right-2 bg-nama-purple/80 text-[10px] md:text-xs">
            {product.size}
          </Badge>
        </div>
        <CardHeader className="p-3 md:p-6 pb-1 md:pb-2">
          <CardTitle className="text-sm md:text-lg line-clamp-1">
            {language === 'en' ? product.nameEn : product.nameAr}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <p className="text-muted-foreground line-clamp-2 text-xs md:text-sm leading-relaxed md:leading-[1.7]">
            {language === 'en' ? product.descriptionEn : product.descriptionAr}
          </p>
          <p className="text-nama-purple font-bold mt-1 md:mt-2 text-sm md:text-base">
            {product.price} {t('SAR', 'ر.س')}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex justify-between gap-1 md:gap-2 p-3 md:p-6 pt-0">
        <Button
          onClick={(e) => handleAddToCart(product, e)}
          className={`flex-1 text-xs md:text-sm h-8 md:h-10 ${isInCart(product.id) ? 'bg-green-500 hover:bg-green-600' : ''}`}
          disabled={!product.inStock}
          size="sm"
        >
          <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">{t('Add to Cart', 'أضف للسلة')}</span>
          <span className="sm:hidden">{t('Add', 'أضف')}</span>
        </Button>
        <Button
          variant={isInWishlist(product.id) ? "default" : "outline"}
          onClick={(e) => handleAddToWishlist(product, e)}
          className={`p-1 md:p-2 h-8 md:h-10 w-8 md:w-10 ${isInWishlist(product.id) ? "bg-red-500 hover:bg-red-600" : ""}`}
          size="icon"
        >
          <Heart className="w-3 h-3 md:w-4 md:h-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="section-title">{t('Featured Products', 'منتجات مميزة')}</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-36 md:h-48 bg-gray-200"></div>
              <CardHeader className="p-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></CardHeader>
              <CardContent className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{t('Error loading products', 'خطأ في تحميل المنتجات')}</p>
        </div>
      ) : featuredProducts && featuredProducts.length > 0 ? (
        isMobile ? (
          <Carousel opts={{ align: "start", direction: language === 'ar' ? 'rtl' : 'ltr' }} className="w-full">
            <CarouselContent className="-ml-2">
              {featuredProducts.map((product) => (
                <CarouselItem key={product.id} className="pl-2 basis-1/2">
                  <ProductCardComponent product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCardComponent key={product.id} product={product} />
            ))}
          </div>
        )
      ) : null}
      
      <div className="text-center mt-10">
        <Link to="/products">
          <Button size="lg" variant="outline" className="border-2 border-nama-purple text-nama-purple hover:bg-nama-purple hover:text-white">
            {t('View All Products', 'عرض جميع المنتجات')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProductsSection;
