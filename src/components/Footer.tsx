
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { getContactInfo, ContactInfo } from '../services/contactService';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  const { t, language } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  
  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        const data = await getContactInfo();
        setContactInfo(data);
      } catch (err) {
        console.error("Failed to load contact info:", err);
      }
    };

    loadContactInfo();
  }, []);
  
  return (
    <footer className="hidden md:block bg-nama-black text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Logo and Info */}
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/uploads/logo.png" 
                alt="Nama Taiba Logo" 
                className="h-12 mr-2"
              />
            </div>
            <p className="mb-4 text-gray-300">
              {t(
                'Specializing in high-quality construction materials and solutions for modern building needs.',
                'متخصصون في مواد البناء عالية الجودة وحلول لاحتياجات البناء الحديثة.'
              )}
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-nama-gold">
              {t('Quick Links', 'روابط سريعة')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-gray-300 hover:text-white transition-colors">
                  {t('Services', 'الخدمات')}
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-gray-300 hover:text-white transition-colors">
                  {t('Projects', 'المشاريع')}
                </Link>
              </li>
              <li>
                <Link to="/offers" className="text-gray-300 hover:text-white transition-colors">
                  {t('Offers', 'العروض')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  {t('About Us', 'من نحن')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white transition-colors">
                  {t('Blog', 'المدونة')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-nama-gold">
              {t('Contact Us', 'اتصل بنا')}
            </h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-nama-gold" />
                <span>{contactInfo?.email || 'info@namataiba.com'}</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-nama-gold" />
                <span>{contactInfo?.phone || '+966 123 456 789'}</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-1 text-nama-gold" />
                <span>
                  {language === 'en' 
                    ? (contactInfo?.address_en || 'Industrial Area, Riyadh, Saudi Arabia') 
                    : (contactInfo?.address_ar || 'المنطقة الصناعية، الرياض، المملكة العربية السعودية')}
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-gray-700 mb-6" />
        
        {/* Copyright */}
        <div className="text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Nama Taiba. {t('All Rights Reserved', 'جميع الحقوق محفوظة')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
