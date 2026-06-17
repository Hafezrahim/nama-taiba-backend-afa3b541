
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (english: string, arabic: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as Language) || 'en';
  });
  
  const isRTL = language === 'ar';

  // Simple translation function
  const t = (english: string, arabic: string) => {
    return language === 'en' ? english : arabic;
  };

  // Handle navigation to the correct URL when language changes
  const handleLanguageChange = (newLang: Language) => {
    // Store the current path to check for detail pages
    const currentPath = location.pathname;
    
    // Update language state and storage
    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
    
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.body.className = newLang === 'ar' ? 'rtl' : 'ltr';
    
    // Handle detail pages redirections
    if (currentPath.startsWith('/products/') || 
        currentPath.startsWith('/blog/') || 
        currentPath.startsWith('/offers/')) {
      // If we're on a detail page, navigate to the listing page
      const basePath = currentPath.split('/')[1];
      navigate(`/${basePath}`);
    }
  };

  // Update language setter to use our new handler
  const setLanguage = (lang: Language) => {
    handleLanguageChange(lang);
  };

  // Set initial direction on page load
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.className = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
