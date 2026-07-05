import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, LogIn, LogOut, Menu, User, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ukFlag from '@/assets/uk-flag.png';
import saFlag from '@/assets/sa-flag.png';

interface UserActionsProps {
  toggleMobileMenu: () => void;
}

const UserActions = ({ toggleMobileMenu }: UserActionsProps) => {
  const { language, setLanguage, isRTL, t } = useLanguage();
  const { wishlistItems } = useWishlist();
  const { user, isAdmin } = useAuth();

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

  return (
    <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
      {/* Wishlist - only visible on mobile, hidden on desktop since it's in TopHeader */}
      <Link to="/wishlist" className="sm:hidden">
        <Button variant="ghost" size="icon" className="relative text-white hover:text-white hover:bg-white/10">
          <Heart className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-green-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {wishlistItems.length}
          </span>
        </Button>
      </Link>

      {/* Auth: Sign In / User Menu (moved from TopHeader) */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-2 text-white hover:text-white/80 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
              aria-label={t('Account menu', 'قائمة الحساب')}
            >
              {userProfile?.avatar_url ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={userProfile.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">
                {user.email?.split('@')[0] || t('Account', 'الحساب')}
              </span>
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
      ) : null}

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
        aria-label={t('Open menu', 'فتح القائمة')}
      >
        <Menu />
      </Button>
    </div>
  );
};

export default UserActions;
