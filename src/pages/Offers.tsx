import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getOffers, getOfferCategories } from '@/backend/offers';
import { OfferCard } from '@/components/offers/OfferCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';

const Offers = () => {
  const { t, isRTL } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['offers'],
    queryFn: getOffers
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['offerCategories'],
    queryFn: getOfferCategories
  });

  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    
    return offers.filter((offer) => {
      // Category filter
      const categoryMatch = selectedCategory === 'all' || offer.category === selectedCategory;
      
      // Date filter
      const dateMatch = !selectedDate || 
        new Date(offer.validUntil) >= selectedDate;
      
      return categoryMatch && dateMatch;
    });
  }, [offers, selectedCategory, selectedDate]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedDate(undefined);
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedDate;

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      <SEO 
        url="/offers"
        titleEn="Special Offers - Nama Taiba Factory"
        titleAr="العروض الخاصة - مصنع نما طيبة"
        descriptionEn="Discover our special offers and promotions on building materials. Limited time deals on premium construction products."
        descriptionAr="اكتشف عروضنا الخاصة والترويجية على مواد البناء. صفقات محدودة الوقت على منتجات البناء المميزة."
        keywords="offers, promotions, deals, discounts, عروض, تخفيضات, صفقات"
      />
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-nama-purple">
          {t('Special Offers', 'العروض الخاصة')}
        </h1>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-medium mb-4">{t('Filters', 'التصفية')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t('Category', 'الفئة')}
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('All Categories', 'جميع الفئات')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Categories', 'جميع الفئات')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t('Valid Until', 'صالح حتى')}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : t('Pick a date', 'اختر تاريخًا')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Reset Filters */}
            <div className="self-end">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="w-full md:w-auto"
              >
                {t('Reset Filters', 'إعادة ضبط التصفية')}
              </Button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mt-4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            {t('Error loading offers. Please try again later.', 'خطأ في تحميل العروض. الرجاء المحاولة مرة أخرى لاحقًا.')}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">
              {t('No offers match your filters.', 'لا توجد عروض تطابق عوامل التصفية الخاصة بك.')}
            </p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={resetFilters} 
                className="mt-4"
              >
                {t('Reset Filters', 'إعادة ضبط التصفية')}
              </Button>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Offers;
