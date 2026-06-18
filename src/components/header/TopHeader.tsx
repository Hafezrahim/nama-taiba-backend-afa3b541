import { Link } from 'react-router-dom';
import { Phone, Mail, ShoppingCart, Heart, LogIn, LogOut, User, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ukFlag from '@/assets/uk-flag.png';
import saFlag from '@/assets/sa-flag.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const TopHeader = () => {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { getCartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const { user, isAdmin } = useAuth();

  const { data: contactInfo } = useQuery({
    queryKey: ['contact-info-header'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_info')
        .select('phone, email')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-header', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name_en, full_name_ar')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '';
    // Add + if not present
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  return (
    <div className="bg-nama-gold text-nama-purple font-medium text-sm py-3 hidden md:block">
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Contact Info */}
          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {contactInfo?.phone && (
              <a 
                href={`tel:${formatPhone(contactInfo.phone)}`} 
                className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Phone className="h-4 w-4" />
                <span dir="ltr">{formatPhone(contactInfo.phone)}</span>
              </a>
            )}
            {contactInfo?.email && (
              <a 
                href={`mailto:${contactInfo.email}`} 
                className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <Mail className="h-4 w-4" />
                <span>{contactInfo.email}</span>
              </a>
            )}
          </div>

          {/* Utility Links */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Link 
              to="/cart" 
              className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="relative">
                <ShoppingCart className="h-4 w-4" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-nama-orange text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {getCartCount()}
                  </span>
                )}
              </div>
              <span>{t('Cart', 'السلة')}</span>
            </Link>
            
            <Link 
              to="/wishlist" 
              className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="relative">
                <Heart className="h-4 w-4" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-nama-orange text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </div>
              <span>{t('Wishlist', 'المفضلة')}</span>
            </Link>

            {/* User Menu / Login Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {userProfile?.avatar_url ? (
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={userProfile.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span>{user.email?.split('@')[0] || t('Account', 'الحساب')}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48 bg-popover text-popover-foreground">
                  <DropdownMenuLabel className="text-foreground">
                    {t('My Account', 'حسابي')}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span>{t('Admin Dashboard', 'لوحة التحكم')}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/client" className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>{t('Client Dashboard', 'لوحة تحكم العميل')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => supabase.auth.signOut()}
                    className={`flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('Logout', 'تسجيل الخروج')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link 
                to="/login" 
                className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <LogIn className="h-4 w-4" />
                <span>{t('Login', 'تسجيل الدخول')}</span>
              </Link>
            )}

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className={`flex items-center gap-2 hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <img 
                src={language === 'en' ? saFlag : ukFlag} 
                alt={language === 'en' ? 'العربية' : 'English'}
                className="h-4 w-4 rounded-full object-cover"
              />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
