
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

const DesktopNav = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const linkClass = "font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all";

  return (
    <nav className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
      <Link to="/" className={linkClass}>{t('Home', 'الرئيسية')}</Link>
      <Link to="/products" className={linkClass}>{t('Products', 'المنتجات')}</Link>
      <Link to="/about" className={linkClass}>{t('About Us', 'من نحن')}</Link>
      <Link to="/quality" className={linkClass}>{t('Quality', 'الجودة')}</Link>
      <Link to="/partners" className={linkClass}>{t('Success Partners', 'شركاء النجاح')}</Link>
      <Link to="/blog" className={linkClass}>{t('Articles', 'المقالات')}</Link>
      <Link to="/contact" className={linkClass}>{t('Contact Us', 'تواصل معنا')}</Link>

      {/* Auth Buttons — only when not logged in */}
      {!user && (
        <div className={`flex items-center gap-2 ${isRTL ? 'mr-4' : 'ml-4'} border-l border-white/20 ${isRTL ? 'pr-4' : 'pl-4'}`}>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-white border border-white/50 hover:bg-white hover:text-nama-black px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          >
            <LogIn className="h-4 w-4" />
            {t('Sign In', 'تسجيل الدخول')}
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-1.5 bg-nama-gold text-nama-purple hover:bg-yellow-400 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
          >
            <UserPlus className="h-4 w-4" />
            {t('Sign Up', 'إنشاء حساب')}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default DesktopNav;
