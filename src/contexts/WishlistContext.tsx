
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from './LanguageContext';

export interface WishlistItem {
  id: string;
  nameEn: string;
  nameAr: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  size?: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { t, language } = useLanguage();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    // Load wishlist items from localStorage on initial render
    const savedWishlist = localStorage.getItem('wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  // Save to localStorage whenever wishlistItems changes
  React.useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = (item: WishlistItem) => {
    setWishlistItems(prevItems => {
      // Check if item already exists in wishlist
      const existingItem = prevItems.find(wishlistItem => wishlistItem.id === item.id);
      
      if (existingItem) {
        // If item exists, don't add it again
        toast({
          title: t('Already in Wishlist', 'موجود بالفعل في المفضلة'),
          description: language === 'en' ? item.nameEn : item.nameAr
        });
        return prevItems;
      } else {
        // If item doesn't exist, add it
        toast({
          title: t('Added to Wishlist', 'تمت الإضافة إلى المفضلة'),
          description: language === 'en' ? item.nameEn : item.nameAr
        });
        return [...prevItems, item];
      }
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const isInWishlist = (id: string) => {
    return wishlistItems.some(item => item.id === id);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlistItems, 
      addToWishlist, 
      removeFromWishlist,
      isInWishlist,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
