import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import ContactForm from '../components/ContactForm';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getContactInfo, ContactInfo } from '../backend/contact';
import { getMapLocations, type MapLocation } from '@/backend/mapLocations';
import { buildLocationPopup, getLocationTitle } from '@/lib/mapPopup';
import { MessageSquare, Phone, Mail, MapPin } from 'lucide-react';
import LeafletMap from '@/components/ui/leaflet-map';
import SEO from '@/components/SEO';

const Contact = () => {
  const { t, isRTL, language } = useLanguage();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContactInfo = async () => {
      try {
        setLoading(true);
        const [data, locations] = await Promise.all([getContactInfo(), getMapLocations()]);
        setContactInfo(data);
        setMapLocations(locations);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load contact info:", err);
        setLoading(false);
      }
    };

    loadContactInfo();
  }, []);

  const getAddress = () => {
    return language === 'en' ? contactInfo?.address_en : contactInfo?.address_ar;
  };

  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url="/contact"
        titleEn="Contact Us - Nama Taiba Factory"
        titleAr="اتصل بنا - مصنع نما طيبة"
        descriptionEn="Get in touch with Nama Taiba Factory. Contact us for inquiries, quotes, and support. We're here to help with your building material needs."
        descriptionAr="تواصل مع مصنع نما طيبة. اتصل بنا للاستفسارات والعروض والدعم. نحن هنا لمساعدتك في احتياجات مواد البناء الخاصة بك."
        keywords="contact, support, inquiries, اتصل بنا, دعم, استفسارات"
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-12">
            {t('Contact Us', 'اتصل بنا')}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Leaflet Map */}
            <div className="bg-white rounded-lg overflow-hidden shadow-lg h-[450px]">
              {loading ? (
                <div className="w-full h-full bg-gray-100 animate-pulse"></div>
              ) : (
                <LeafletMap
                  markers={mapLocations.map(l => ({
                    id: l.id,
                    latitude: l.latitude,
                    longitude: l.longitude,
                    title: isRTL ? l.name_ar : l.name_en,
                    iconColor: l.icon_color || '#630d5f',
                    popupHtml: `
                      <div style="min-width:200px;font-family:inherit">
                        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${isRTL ? l.name_ar : l.name_en}</div>
                        ${(isRTL ? l.address_ar : l.address_en) ? `<div style="font-size:12px;color:#555;margin-bottom:6px">${isRTL ? l.address_ar : l.address_en}</div>` : ''}
                        ${l.phone ? `<div style="font-size:12px">📞 <a href="tel:${l.phone}">${l.phone}</a></div>` : ''}
                        ${l.email ? `<div style="font-size:12px">✉️ <a href="mailto:${l.email}">${l.email}</a></div>` : ''}
                        ${l.whatsapp ? `<div style="font-size:12px">💬 <a href="https://wa.me/${l.whatsapp.replace(/\\D/g,'')}" target="_blank">WhatsApp</a></div>` : ''}
                        ${l.map_url ? `<div style="font-size:12px;margin-top:4px"><a href="${l.map_url}" target="_blank">${isRTL ? 'الاتجاهات ↗' : 'Directions ↗'}</a></div>` : ''}
                      </div>`
                  }))}
                  zoom={6}
                  fitBounds
                  className="h-full w-full rounded-lg"
                />
              )}
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <ContactForm />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <MapPin className="h-8 w-8 text-nama-purple" />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('Address', 'العنوان')}</h3>
              {loading ? (
                <div className="h-6 bg-gray-100 rounded animate-pulse mx-auto w-3/4"></div>
              ) : (
                <p className="text-gray-600">
                  {language === 'en' ? contactInfo?.address_en : contactInfo?.address_ar}
                </p>
              )}
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <Mail className="h-8 w-8 text-nama-purple" />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('Email', 'البريد الإلكتروني')}</h3>
              {loading ? (
                <div className="h-6 bg-gray-100 rounded animate-pulse mx-auto w-3/4"></div>
              ) : (
                <a href={`mailto:${contactInfo?.email}`} className="text-nama-purple hover:underline">
                  {contactInfo?.email}
                </a>
              )}
            </div>
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-center mb-4">
                <Phone className="h-8 w-8 text-nama-purple" />
              </div>
              <h3 className="text-xl font-bold mb-4">{t('Phone', 'الهاتف')}</h3>
              {loading ? (
                <div className="h-6 bg-gray-100 rounded animate-pulse mx-auto w-3/4"></div>
              ) : (
                <a href={`tel:${contactInfo?.phone}`} className="text-nama-purple hover:underline">
                  {contactInfo?.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* WhatsApp Button */}
      {!loading && contactInfo?.whatsapp && (
        <div className="fixed bottom-4 right-4 z-50">
          <a 
            href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-green-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
            aria-label="Contact on WhatsApp"
          >
            <MessageSquare className="h-6 w-6" />
          </a>
        </div>
      )}
    </div>
  );
};

export default Contact;
