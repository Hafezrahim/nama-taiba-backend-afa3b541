import { Link, useLocation } from 'react-router-dom';
import { Home, Package, ShoppingCart, Tag, Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const BottomNav = () => {
  const { t, isRTL } = useLanguage();
  const { getCartCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: t('Home', 'الرئيسية') },
    { path: '/products', icon: Package, label: t('Products', 'المنتجات') },
    { path: '/cart', icon: ShoppingCart, label: t('Cart', 'السلة'), badge: getCartCount() },
    { path: '/offers', icon: Tag, label: t('Offers', 'العروض') },
  ];

  const moreItems = [
    { path: '/services', label: t('Services', 'الخدمات') },
    { path: '/projects', label: t('Projects', 'المشاريع') },
    { path: '/blog', label: t('Blog', 'المدونة') },
    { path: '/support', label: t('Support', 'الدعم') },
    { path: '/about', label: t('About Us', 'من نحن') },
    { path: '/contact', label: t('Contact', 'اتصل بنا') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <div className="relative">
              <item.icon className="h-6 w-6" />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}

        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center min-w-[60px] py-1 px-2 text-muted-foreground">
              <Menu className="h-6 w-6" />
              <span className="text-xs mt-1">{t('More', 'المزيد')}</span>
            </button>
          </SheetTrigger>
          <SheetContent side={isRTL ? 'left' : 'right'}>
            <SheetHeader>
              <SheetTitle>{t('More', 'المزيد')}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-6">
              {moreItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-lg font-medium py-2 px-4 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNav;
