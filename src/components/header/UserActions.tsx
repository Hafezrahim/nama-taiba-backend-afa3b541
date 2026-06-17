import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, LogIn, Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import UserNotifications from '@/components/UserNotifications';
import ukFlag from '@/assets/uk-flag.png';
import saFlag from '@/assets/sa-flag.png';

interface UserActionsProps {
  toggleMobileMenu: () => void;
}

const UserActions = ({ toggleMobileMenu }: UserActionsProps) => {
  const { language, setLanguage, isRTL } = useLanguage();
  const { getCartCount } = useCart();
  const { wishlistItems } = useWishlist();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
      {/* Cart - hidden on all views, available in TopHeader on desktop and BottomNav/MobileNav on mobile */}
      
      {/* Wishlist - only visible on mobile, hidden on desktop since it's in TopHeader */}
      <Link to="/wishlist" className="sm:hidden">
        <Button variant="ghost" size="icon" className="relative text-white hover:text-white hover:bg-white/10">
          <Heart className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-nama-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {wishlistItems.length}
          </span>
        </Button>
      </Link>

      {/* User Notifications - hidden */}
      {/* <UserNotifications /> */}
      
      {/* Sign In link is completely hidden but kept in the code for future use */}
      <Link to="/login" className="hidden">
        <Button variant="ghost" className="flex items-center gap-2 text-white">
          <LogIn className="h-5 w-5" />
          {language === 'en' ? 'Sign In' : 'تسجيل الدخول'}
        </Button>
      </Link>
      
      {/* Language Switcher - only visible on mobile, hidden on desktop since it's in TopHeader */}
      <Button 
        variant="ghost" 
        size="icon"
        className="flex sm:hidden text-white hover:text-white hover:bg-white/10"
        onClick={toggleLanguage}
      >
        <img 
          src={language === 'en' ? saFlag : ukFlag} 
          alt={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
          className="h-6 w-6 rounded-full object-cover"
        />
      </Button>

      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        className="md:hidden text-white hover:text-white hover:bg-white/10" 
        onClick={toggleMobileMenu}
      >
        <Menu />
      </Button>
    </div>
  );
};

export default UserActions;
