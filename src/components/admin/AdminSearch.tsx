import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, ShoppingBag, Users, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'user';
  title: string;
  subtitle: string;
  url: string;
}

export function AdminSearch() {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search products
        const { data: products } = await supabase
          .from('products')
          .select('id, name_ar, name_en, category')
          .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%`)
          .limit(5);

        if (products) {
          searchResults.push(...products.map(p => ({
            id: p.id,
            type: 'product' as const,
            title: language === 'ar' ? p.name_ar : p.name_en,
            subtitle: p.category,
            url: `/admin/products`
          })));
        }

        // Search orders
        const { data: orders } = await supabase
          .from('orders')
          .select('id, customer_name, customer_phone, status, total')
          .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
          .limit(5);

        if (orders) {
          searchResults.push(...orders.map(o => ({
            id: o.id,
            type: 'order' as const,
            title: o.customer_name,
            subtitle: `${o.status} - ${o.total} ${t('SAR', 'ر.س')}`,
            url: `/admin/orders`
          })));
        }

        // Search users/profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name_ar, full_name_en, phone')
          .or(`full_name_ar.ilike.%${query}%,full_name_en.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(5);

        if (profiles) {
          searchResults.push(...profiles.map(p => ({
            id: p.id,
            type: 'user' as const,
            title: (language === 'ar' ? p.full_name_ar : p.full_name_en) || t('Unknown User', 'مستخدم غير معروف'),
            subtitle: p.phone || '',
            url: `/admin/users`
          })));
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, language, t]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'product': return <Package className="h-4 w-4 text-blue-500" />;
      case 'order': return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case 'user': return <Users className="h-4 w-4 text-purple-500" />;
    }
  };

  const getTypeBadge = (type: SearchResult['type']) => {
    const labels = {
      product: t('Product', 'منتج'),
      order: t('Order', 'طلب'),
      user: t('User', 'مستخدم')
    };
    const colors = {
      product: 'bg-blue-100 text-blue-700',
      order: 'bg-emerald-100 text-emerald-700',
      user: 'bg-purple-100 text-purple-700'
    };
    return (
      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", colors[type])}>
        {labels[type]}
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative hidden md:block flex-1 max-w-md mx-4">
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
          isRTL ? "right-3" : "left-3"
        )} />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('Search products, orders, users...', 'بحث في المنتجات، الطلبات، المستخدمين...')}
          className={cn(
            "bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all",
            isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-6 w-6",
              isRTL ? "left-2" : "right-2"
            )}
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {t('No results found', 'لا توجد نتائج')}
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-start"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.subtitle}</div>
                  </div>
                  {getTypeBadge(result.type)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
