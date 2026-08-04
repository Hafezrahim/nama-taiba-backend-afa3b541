import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProducts } from '@/backend/products';
import ProductFilters from '@/components/product/ProductFilters';
import ProductList from '@/components/product/ProductList';
import SEO from '@/components/SEO';
import { smartIncludes, suggestCorrection } from '@/lib/smartSearch';

const Products = () => {
  const { t, isRTL } = useLanguage();
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  // Extract unique categories and sizes for filter options
  const categories = products ? ['all', ...new Set(products.map(product => product.category))] : ['all'];
  const sizes = products ? ['all', ...new Set(products.map(product => product.size))] : ['all'];

  // Filter products based on selected filters (typo & keyboard-layout tolerant)
  const filteredProducts = products?.filter(product => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSize = sizeFilter === 'all' || product.size === sizeFilter;
    const matchesSearch = searchQuery.trim() === '' ||
      smartIncludes(
        `${product.nameEn} ${product.nameAr} ${product.descriptionEn || ''} ${product.descriptionAr || ''} ${product.category || ''} ${product.size || ''} ${product.keywords || ''}`,
        searchQuery
      );

    return matchesCategory && matchesSize && matchesSearch;
  });

  // Build a dictionary of known terms to power "Did you mean ...?" (AR + EN)
  const dictionary = (products || []).flatMap(p =>
    [p.nameEn, p.nameAr, p.category, ...String(p.keywords || '').split(/[,،]/)]
      .map(s => (s || '').trim())
      .filter(Boolean)
  );


  const suggestion =
    searchQuery.trim().length > 1 && (filteredProducts?.length ?? 0) === 0
      ? suggestCorrection(searchQuery, dictionary)
      : null;


  return (
    <div className={isRTL ? 'rtl' : 'ltr'}>
      <SEO 
        url="/products"
        titleEn="Products - Building Materials"
        titleAr="المنتجات - مواد البناء"
        descriptionEn="Browse our complete range of premium building materials including GRC, GRP, decorative elements, and construction solutions."
        descriptionAr="تصفح مجموعتنا الكاملة من مواد البناء عالية الجودة بما في ذلك GRC و GRP والعناصر الزخرفية وحلول البناء."
        keywords="products, building materials, GRC, GRP, construction, منتجات, مواد بناء"
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-8">
            {t('Our Products', 'منتجاتنا')}
          </h1>
          
          <ProductFilters
            categories={categories}
            sizes={sizes}
            categoryFilter={categoryFilter}
            sizeFilter={sizeFilter}
            searchQuery={searchQuery}
            setCategoryFilter={setCategoryFilter}
            setSizeFilter={setSizeFilter}
            setSearchQuery={setSearchQuery}
          />

          {suggestion && (
            <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
              {t('Did you mean', 'هل تقصد')}{' '}
              <button
                type="button"
                onClick={() => setSearchQuery(suggestion.suggestion)}
                className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
              >
                {suggestion.suggestion}
              </button>
              {t('?', '؟')}
            </div>
          )}


          <ProductList 
            products={filteredProducts}
            isLoading={isLoading}
            error={error as Error | null}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
