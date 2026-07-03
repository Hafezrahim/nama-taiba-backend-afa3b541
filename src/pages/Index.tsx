import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import ProductsSection from '../components/ProductsSection';
import ServicesSection from '../components/ServicesSection';
import ProjectsSection from '../components/ProjectsSection';
import AboutSection from '../components/AboutSection';
import ContactForm from '../components/ContactForm';
import OffersSection from '../components/OffersSection';
import CertificationsSection from '../components/about/CertificationsSection';
import PartnersSection from '../components/about/PartnersSection';
import { Phone, MapPin } from 'lucide-react';
import whatsappIcon from '../assets/whatsapp-icon.svg';
import { getContactInfo, type ContactInfo } from '@/backend/contact';
import { getCertifications } from '@/backend/certifications';
import { getPartners } from '@/backend/partners';
import { type Certification, type Partner } from '@/backend/index';
import { MarketerApplicationForm } from '@/components/MarketerApplicationForm';
import LeafletMap from '@/components/ui/leaflet-map';
import SEO from '@/components/SEO';
import ChatbotWidget from '@/components/ChatbotWidget';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

import { getMapLocations, type MapLocation } from '@/backend/mapLocations';
import { buildLocationPopup, getLocationTitle } from '@/lib/mapPopup';

const Index = () => {
  const {
    t,
    isRTL
  } = useLanguage();
  const isMobile = useIsMobile();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactData, certsData, partnersData, locationsData] = await Promise.all([getContactInfo(), getCertifications(), getPartners(), getMapLocations()]);
        setContactInfo(contactData);
        setCertifications(certsData);
        setPartners(partnersData);
        setMapLocations(locationsData);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, []);
  return <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url="/"
        titleEn="Nama Taiba Factory - Premium Building Materials"
        titleAr="مصنع نما طيبة - مواد بناء عالية الجودة"
        descriptionEn="Leading manufacturer of premium building materials, GRC, GRP, and modern construction solutions in Saudi Arabia. Quality products for modern architecture."
        descriptionAr="مصنع رائد لمواد البناء عالية الجودة، GRC، GRP، والحلول الإنشائية الحديثة في المملكة العربية السعودية. منتجات عالية الجودة للعمارة الحديثة."
        keywords="building materials, construction, GRC, GRP, Saudi Arabia, Nama Taiba, مصنع نما طيبة, مواد بناء, منتجات بناء"
      />
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* Offers Section - Added this section */}
        <OffersSection />
        
        {/* Products Section */}
        <ProductsSection />
        
        {/* Services Section */}
        <ServicesSection />
        
        {/* Projects Section */}
        <ProjectsSection />
        
        {/* About Section */}
        <AboutSection />
        
        {/* Certifications Section */}
        {certifications.length > 0 && <CertificationsSection certifications={certifications} />}
        
        {/* Partners Section */}
        {partners.length > 0 && <PartnersSection partners={partners} />}
        
        {/* Contact Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="section-title">{t('Get In Touch', 'تواصل معنا')}</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Leaflet Map - Desktop: full map, Mobile: button */}
            {isMobile ? (
              <div className="flex justify-center">
                <a
                  href={`https://www.google.com/maps?q=${contactInfo?.latitude || 24.7136},${contactInfo?.longitude || 46.6753}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('View on Map', 'عرض على الخريطة')}
                  </Button>
                </a>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden h-[450px]">
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
                />
              </div>
            )}
            
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </section>
        
        {/* Marketer Button - Desktop: Fixed Left Top, Mobile: Above WhatsApp */}
        <div className="hidden lg:flex fixed left-4 top-1/4 z-50">
          <MarketerApplicationForm />
        </div>

        {/* Marketer Button - Mobile Only: Positioned above WhatsApp */}
        <div className="lg:hidden fixed bottom-56 right-4 z-50">
          <MarketerApplicationForm />
        </div>

        {/* Social Media Icons - Fixed Left Bottom */}
        <div className="hidden lg:flex fixed left-4 bottom-1/4 z-50 flex-col gap-3">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-sky-500 text-white p-3 rounded-full shadow-lg hover:bg-sky-600 transition-all">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white p-3 rounded-full shadow-lg hover:opacity-90 transition-all">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
          </a>
          <a href="https://snapchat.com" target="_blank" rel="noopener noreferrer" className="bg-yellow-400 text-white p-3 rounded-full shadow-lg hover:bg-yellow-500 transition-all">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.11-.07-.173-.023-.08-.033-.15-.033-.224.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" /></svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
          </a>
        </div>

        {/* Floating Action Buttons */}
        {contactInfo?.whatsapp && <div className="fixed bottom-20 md:bottom-4 right-4 z-[60] flex flex-col gap-3">
            {/* WhatsApp Button */}
            <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform" aria-label="Contact on WhatsApp">
              <img src={whatsappIcon} alt="WhatsApp" className="h-8 w-8" />
            </a>
            
            {/* Call Button */}
            <a href={`tel:${contactInfo.whatsapp.replace(/\D/g, '')}`} className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform" aria-label="Call us">
              <Phone className="h-8 w-8" />
            </a>
          </div>}
      </main>
      
      <ChatbotWidget />
      <Footer />
    </div>;
};
export default Index;