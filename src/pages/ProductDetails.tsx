import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProducts } from '@/backend/products';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfo from '@/components/product/ProductInfo';
import SimilarProducts from '@/components/product/SimilarProducts';
import SEO from '@/components/SEO';

const ProductDetails = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { addToCart, cartItems } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  const product = products?.find(p => {
    if (p.id === productSlug) return true;
    if (p.slug === productSlug) return true;
    return false;
  });

  // Get similar products by category
  const similarProducts = products?.filter(p => 
    p.category === product?.category && p.id !== product?.id
  ) || [];

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        price: product.price,
        imageUrl: product.image || '',
        size: product.size
      }, product.moq || 1);
    }
  };

  const handleAddToWishlist = () => {
    if (product) {
      addToWishlist({
        id: product.id,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        price: product.price,
        imageUrl: product.image || '',
        inStock: product.inStock,
        size: product.size
      });
    }
  };

  const handleShare = () => {
    if (product) {
      try {
        if (navigator.share) {
          navigator.share({
            title: language === 'en' ? product.nameEn : product.nameAr,
            text: language === 'en' ? product.descriptionEn : product.descriptionAr,
            url: window.location.href,
          }).catch((error) => {
            console.error('Sharing failed:', error);
            toast({
              title: t('Sharing failed', 'فشلت المشاركة'),
              variant: 'destructive'
            });
          });
        } else {
          const tempInput = document.createElement('input');
          tempInput.value = window.location.href;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          
          toast({
            title: t('Link copied to clipboard', 'تم نسخ الرابط إلى الحافظة'),
            description: t('You can now share this link', 'يمكنك الآن مشاركة هذا الرابط')
          });
        }
      } catch (error) {
        console.error('Share error:', error);
        toast({
          title: t('Sharing failed', 'فشلت المشاركة'),
          variant: 'destructive'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className={isRTL ? 'rtl' : 'ltr'}>
        <Header />
        <main className="min-h-screen container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-3/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div>
                <div className="h-6 bg-gray-200 w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 w-3/4 mb-6"></div>
                <div className="h-8 bg-gray-200 w-1/3 mb-6"></div>
                <div className="h-10 bg-gray-200 w-full mb-4"></div>
                <div className="h-10 bg-gray-200 w-full"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={isRTL ? 'rtl' : 'ltr'}>
        <Header />
        <main className="min-h-screen container mx-auto px-4 py-16">
          <Button variant="ghost" onClick={() => navigate('/products')} className="mb-6">
            <ArrowLeft className="mr-2" />
            {t('Back to Products', 'العودة إلى المنتجات')}
          </Button>
          <div className="text-center py-16">
            <h2 className="text-2xl font-medium text-red-600 mb-4">
              {t('Product not found', 'لم يتم العثور على المنتج')}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('The product you are looking for does not exist or has been removed.', 'المنتج الذي تبحث عنه غير موجود أو تمت إزالته.')}
            </p>
            <Button 
              onClick={() => navigate('/products')}
              className="bg-nama-purple hover:bg-nama-gold"
            >
              {t('View All Products', 'عرض جميع المنتجات')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url={`/products/${productSlug}`}
        titleEn={product.nameEn}
        titleAr={product.nameAr}
        descriptionEn={product.descriptionEn || `${product.nameEn} - Premium building material from Nama Taiba`}
        descriptionAr={product.descriptionAr || `${product.nameAr} - مواد بناء عالية الجودة من نما طيبة`}
        keywords={product.keywords}
        image={product.image || undefined}
        type="product"
        product={{
          price: product.price,
          currency: 'SAR',
          availability: product.inStock ? 'in stock' : 'out of stock'
        }}
      />
      <Header />
      <main className="min-h-screen container mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate('/products')} className="mb-6">
          <ArrowLeft className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('Back to Products', 'العودة إلى المنتجات')}
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProductImageGallery 
            image={product.image}
            productName={language === 'en' ? product.nameEn : product.nameAr}
            size={product.size}
          />
          
          <ProductInfo
            product={product}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            onShare={handleShare}
            isInCart={cartItems.some(item => item.id === product.id)}
            isInWishlist={isInWishlist(product.id)}
          />
        </div>

        {similarProducts.length > 0 && (
          <SimilarProducts 
            products={similarProducts} 
            currentProductId={product.id} 
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetails;
