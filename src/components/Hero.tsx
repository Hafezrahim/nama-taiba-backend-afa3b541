import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-400 via-gray-300 to-gray-200">
      {/* Brick Background Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cccccc' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '30px 30px'
      }}>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Hero Content */}
          <div className={`w-full lg:w-1/2 text-white ${isRTL ? 'text-right lg:order-2' : 'text-left lg:order-1'}`}>
            <h1 className={`font-bold mb-5 sm:mb-6 my-0 ${
              isRTL 
                ? 'text-3xl sm:text-4xl lg:text-5xl leading-[2.1] sm:leading-[2.3]' 
                : 'text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight'
            }`} style={{
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 4px 4px 8px rgba(0, 0, 0, 0.6)',
              ...(isRTL ? { wordSpacing: '0.15em', letterSpacing: '0.02em', lineHeight: '2.2' } : {})
            }}>
              {t(
                'Building Materials for Modern Construction',
                'مصنع نما طيبة للمنتجات البركانية والخرسانية'
              )}
            </h1>
            <p className={`text-base sm:text-lg lg:text-xl mb-8 text-white max-w-xl mx-auto lg:mx-0 ${
              isRTL ? 'leading-[1.9]' : 'leading-relaxed'
            }`} style={{
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8), 2px 2px 6px rgba(0, 0, 0, 0.6)'
            }}>
              {t(
                'Nama Taiba provides high-quality building materials and innovative solutions for construction projects of all sizes.',
                'يوفر مصنع نما طيبة مواد بناء عالية الجودة وحلولًا مبتكرة لمشاريع البناء من جميع الأحجام.'
              )}
            </p>
            <div className={`flex flex-wrap gap-4 ${isRTL ? 'justify-start' : 'justify-start'}`}>
              <Link to="/products">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 text-lg rounded-full shadow-lg">
                  {t('Shop Now', 'تسوق الآن')}
                </Button>
              </Link>
            </div>
          </div>

          
          {/* Hero Image */}
          <div className={`lg:w-1/2 mt-10 lg:mt-0 ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="bg-white p-2 rounded-lg shadow-xl transform rotate-2">
              <img 
                src="/uploads/factory-silos.png" 
                alt={t('Nama Taiba Factory Silos', 'صوامع مصنع نما طيبة')} 
                className="w-full h-auto rounded max-h-[500px] object-cover" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
