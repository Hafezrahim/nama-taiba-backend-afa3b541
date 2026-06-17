
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

const Wishlist = () => {
  const { t, language, isRTL } = useLanguage();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.id,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      price: item.price,
      imageUrl: item.imageUrl,
      size: item.size
    });
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      <SEO
        titleEn="My Wishlist - Nama Taiba"
        titleAr="المفضلة - نما طيبة"
        descriptionEn="View and manage your saved favorite products. Add items to cart when ready to purchase."
        descriptionAr="عرض وإدارة منتجاتك المفضلة المحفوظة. أضف المنتجات إلى السلة عندما تكون مستعداً للشراء."
        keywords="wishlist, favorites, saved products, Nama Taiba, المفضلة, المنتجات المحفوظة, نما طيبة"
      />
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-nama-purple">
          {t('Wishlist', 'المفضلة')}
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-medium text-gray-600 mb-4">
              {t('Your wishlist is empty', 'قائمة المفضلة فارغة')}
            </h2>
            <p className="text-gray-500 mb-8">
              {t('Add items to your wishlist to see them here', 'أضف منتجات إلى قائمة المفضلة لتظهر هنا')}
            </p>
            <Link to="/products">
              <Button className="bg-nama-purple hover:bg-nama-gold">
                {t('Browse Products', 'تصفح المنتجات')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/products/${item.id}`}>
                  <div className="relative">
                    <AspectRatio ratio={4/3}>
                      <img 
                        src={item.imageUrl} 
                        alt={language === 'en' ? item.nameEn : item.nameAr}
                        className="object-cover w-full h-full"
                      />
                    </AspectRatio>
                    {!item.inStock && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        {t('Out of Stock', 'غير متوفر')}
                      </Badge>
                    )}
                    {item.size && (
                      <Badge className="absolute top-2 left-2 bg-nama-purple/80">
                        {item.size}
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-2">
                    {language === 'en' ? item.nameEn : item.nameAr}
                  </h3>
                  <p className="text-nama-purple font-bold mb-4">
                    {item.price.toFixed(2)} {t('SAR', 'ر.س')}
                  </p>
                  
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button 
                      className="flex-1 bg-nama-purple hover:bg-nama-gold"
                      disabled={!item.inStock}
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('Add to Cart', 'أضف إلى السلة')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Wishlist;
