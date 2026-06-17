
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const { t, language, setLanguage } = useLanguage();
  const { getCartCount } = useCart();
  const { wishlistItems } = useWishlist();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="container mx-auto px-4 sm:hidden bg-white pb-4">
      <nav className="flex flex-col space-y-3">
        <Link 
          to="/" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Home', 'الرئيسية')}
        </Link>
        <Link 
          to="/products" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Products', 'المنتجات')}
        </Link>
        <Link 
          to="/about" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('About Us', 'من نحن')}
        </Link>
        <Link 
          to="/quality" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Quality', 'الجودة')}
        </Link>
        <Link 
          to="/partners" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Success Partners', 'شركاء النجاح')}
        </Link>
        <Link 
          to="/blog" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Articles', 'المقالات')}
        </Link>
        <Link 
          to="/contact" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Contact Us', 'تواصل معنا')}
        </Link>
        <Link 
          to="/cart" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Cart', 'السلة')} ({getCartCount()})
        </Link>
        <Link 
          to="/wishlist" 
          className="font-medium hover:text-nama-purple transition-colors py-2"
          onClick={onClose}
        >
          {t('Wishlist', 'المفضلة')} ({wishlistItems.length})
        </Link>
        {/* Sign In link also hidden from mobile menu but kept in code */}
        <Link 
          to="/login" 
          className="hidden"
          onClick={onClose}
        >
          {t('Sign In', 'تسجيل الدخول')}
        </Link>
        {/* Sign Up link also hidden for consistency */}
        <Link 
          to="/signup" 
          className="hidden"
          onClick={onClose}
        >
          {t('Sign Up', 'إنشاء حساب')}
        </Link>
        <Button 
          variant="ghost" 
          className="font-bold justify-start px-0 hover:bg-transparent"
          onClick={toggleLanguage}
        >
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </nav>
    </div>
  );
};

export default MobileNav;
