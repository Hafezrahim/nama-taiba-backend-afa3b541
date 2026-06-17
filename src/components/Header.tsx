import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from './header/Logo';
import DesktopNav from './header/DesktopNav';
import UserActions from './header/UserActions';
import MobileNav from './header/MobileNav';
import BottomNav from './BottomNav';
import TopHeader from './header/TopHeader';

const Header = () => {
  const { isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="shadow-lg sticky top-0 z-50">
      {/* Top Header with contact info and utilities */}
      <TopHeader />
      
      {/* Main Header */}
      <div className="bg-nama-black">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />
          <DesktopNav />
          <UserActions toggleMobileMenu={toggleMobileMenu} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </header>
  );
};

export default Header;
