
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Logo = () => {
  const { language, isRTL } = useLanguage();

  return (
    <Link to="/" className="flex items-center">
      <img 
        src="/uploads/logo.png"
        alt="Nama Taiba Logo"
        className="h-12 w-auto"
      />
    </Link>
  );
};

export default Logo;
