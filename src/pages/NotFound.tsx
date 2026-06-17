
import { useLanguage } from "../contexts/LanguageContext";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "../components/Header";
import Footer from "../components/Footer";

const NotFound = () => {
  const { t, isRTL } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-9xl font-bold text-nama-purple mb-4">404</h1>
          <p className="text-2xl text-gray-600 mb-8">
            {t('Oops! Page not found', 'عفواً! الصفحة غير موجودة')}
          </p>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {t(
              'The page you are looking for might have been removed or is temporarily unavailable.',
              'الصفحة التي تبحث عنها ربما تم إزالتها أو غير متوفرة مؤقتًا.'
            )}
          </p>
          <Link to="/">
            <Button className="bg-nama-purple hover:bg-nama-orange">
              {t('Return to Home', 'العودة للرئيسية')}
            </Button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
