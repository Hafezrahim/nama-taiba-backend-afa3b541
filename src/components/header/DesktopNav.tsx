
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const DesktopNav = () => {
  const { t, isRTL } = useLanguage();

  return (
    <nav className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
      <Link to="/" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('Home', 'الرئيسية')}
      </Link>
      <Link to="/products" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('Products', 'المنتجات')}
      </Link>
      <Link to="/about" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('About Us', 'من نحن')}
      </Link>
      <Link to="/quality" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('Quality', 'الجودة')}
      </Link>
      <Link to="/partners" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('Success Partners', 'شركاء النجاح')}
      </Link>
      <Link to="/blog" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('Articles', 'المقالات')}
      </Link>
      <Link to="/contact" className="font-medium text-white hover:text-white hover:bg-green-600 px-4 py-2 rounded-lg transition-all">
        {t('Contact Us', 'تواصل معنا')}
      </Link>
    </nav>
  );
};

export default DesktopNav;
