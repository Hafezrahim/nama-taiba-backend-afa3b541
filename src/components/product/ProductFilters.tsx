
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductFiltersProps {
  categories: string[];
  sizes: string[];
  categoryFilter: string;
  sizeFilter: string;
  searchQuery: string;
  setCategoryFilter: (value: string) => void;
  setSizeFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
}

const ProductFilters = ({
  categories,
  sizes,
  categoryFilter,
  sizeFilter,
  searchQuery,
  setCategoryFilter,
  setSizeFilter,
  setSearchQuery,
}: ProductFiltersProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <h2 className="text-xl font-medium mb-4">{t('Filter Products', 'تصفية المنتجات')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('Search', 'بحث')}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search products...', 'البحث عن منتجات...')}
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('Category', 'الفئة')}</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select category', 'اختر الفئة')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? t('All Categories', 'جميع الفئات') : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">{t('Size', 'الحجم')}</label>
          <Select value={sizeFilter} onValueChange={setSizeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select size', 'اختر الحجم')} />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size === 'all' ? t('All Sizes', 'جميع الأحجام') : size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
