import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getProducts } from '@/backend/products';
import ProductFilters from '@/components/product/ProductFilters';
import ProductList from '@/components/product/ProductList';
import SEO from '@/components/SEO';

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

  // Filter products based on selected filters
  const filteredProducts = products?.filter(product => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSize = sizeFilter === 'all' || product.size === sizeFilter;
    const matchesSearch = searchQuery === '' || 
                         (product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.keywords.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSize && matchesSearch;
  });

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
