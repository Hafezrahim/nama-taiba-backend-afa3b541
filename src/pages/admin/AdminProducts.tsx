import { useState, useEffect, useMemo } from 'react';
import { pingIndexNowForEntity } from '@/utils/indexNow';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight, Filter, X, Upload, ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ExcelImportButtons from '@/components/admin/ExcelImportButtons';

interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  image?: string;
  category: string;
  size?: string;
  price: number;
  moq: number;
  is_featured: boolean;
  in_stock: boolean;
  is_active: boolean;
  keywords?: string;
}

export default function AdminProducts() {
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    image: '',
    category: '',
    size: '',
    price: 0,
    moq: 1,
    is_featured: false,
    in_stock: true,
    is_active: true,
    keywords: ''
  });
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleGenerateAIImage = async () => {
    if (!formData.name_en && !formData.name_ar) {
      toast.error(t('Enter product name first', 'أدخل اسم المنتج أولاً'));
      return;
    }
    try {
      setGeneratingAI(true);
      toast.loading(t('Generating AI image...', 'جاري إنشاء الصورة...'), { id: 'ai-img' });
      const { data, error } = await supabase.functions.invoke('generate-product-image', {
        body: {
          productId: editingProduct?.id,
          nameEn: formData.name_en,
          nameAr: formData.name_ar,
          descriptionEn: formData.description_en,
          category: formData.category,
          size: formData.size,
        },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setFormData((prev) => ({ ...prev, image: data.imageUrl }));
        toast.success(t('Image generated', 'تم إنشاء الصورة'), { id: 'ai-img' });
        if (editingProduct?.id) fetchProducts();
      } else {
        throw new Error(data?.error || 'Failed');
      }
    } catch (err: any) {
      toast.error(err.message || t('Generation failed', 'فشل الإنشاء'), { id: 'ai-img' });
    } finally {
      setGeneratingAI(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load categories', 'فشل تحميل الفئات'));
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load products', 'فشل تحميل المنتجات'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name_ar || !formData.name_en || !formData.category) {
        toast.error(t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
        return;
      }

      const dataToSave = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        description_ar: formData.description_ar,
        description_en: formData.description_en,
        image: formData.image,
        category: formData.category,
        size: formData.size,
        price: formData.price || 0,
        moq: formData.moq || 1,
        is_featured: formData.is_featured || false,
        in_stock: formData.in_stock !== undefined ? formData.in_stock : true,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        keywords: formData.keywords
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success(t('Product updated successfully', 'تم تحديث المنتج بنجاح'));
      } else {
        const { error } = await supabase
          .from('products')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success(t('Product created successfully', 'تم إنشاء المنتج بنجاح'));
      }

      // Notify Bing/Yandex via IndexNow that this product URL changed.
      if (dataToSave.is_active) {
        pingIndexNowForEntity({ type: 'product', nameEn: dataToSave.name_en });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this product?', 'هل أنت متأكد من حذف هذا المنتج؟'))) {
      return;
    }
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('Product deleted successfully', 'تم حذف المنتج بنجاح'));
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t(`Delete ${selectedIds.length} products?`, `حذف ${selectedIds.length} منتجات؟`))) return;
    try {
      const { error } = await supabase.from('products').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(t(`${selectedIds.length} products deleted`, `تم حذف ${selectedIds.length} منتجات`));
      setSelectedIds([]);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const { error } = await supabase.from('products').update({ is_active: status }).in('id', selectedIds);
      if (error) throw error;
      toast.success(t(
        status ? `${selectedIds.length} products activated` : `${selectedIds.length} products deactivated`,
        status ? `تم تفعيل ${selectedIds.length} منتجات` : `تم إلغاء تفعيل ${selectedIds.length} منتجات`
      ));
      setSelectedIds([]);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'ID', 'Name (EN)', 'Name (AR)', 'Category', 'Size', 'Price',
      'Featured', 'In Stock', 'Active', 'Keywords'
    ];
    const rows = filteredProducts.map(p => [
      p.id, p.name_en, p.name_ar, p.category, p.size || '',
      p.price, p.is_featured ? 'Yes' : 'No', p.in_stock ? 'Yes' : 'No',
      p.is_active ? 'Active' : 'Inactive', p.keywords || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(t('Products exported successfully', 'تم تصدير المنتجات بنجاح'));
  };

  const resetForm = () => {
    setFormData({
      name_ar: '', name_en: '', description_ar: '', description_en: '',
      image: '', category: '', size: '', price: 0, moq: 1,
      is_featured: false, in_stock: true, is_active: true, keywords: ''
    });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return [...new Set(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch =
        product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name_ar.includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active) ||
        (statusFilter === 'featured' && product.is_featured) ||
        (statusFilter === 'out_of_stock' && !product.in_stock);
      
      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Products Management', 'إدارة المنتجات')}</h1>
          <p className="text-muted-foreground mt-1">
            {t(`Showing ${filteredProducts.length} of ${products.length} products`, `عرض ${filteredProducts.length} من ${products.length} منتج`)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            {t('Export CSV', 'تصدير CSV')}
          </Button>
          <ExcelImportButtons type="products" onImported={fetchProducts} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('Add Product', 'إضافة منتج')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct 
                    ? t('Edit Product', 'تعديل المنتج')
                    : t('Add New Product', 'إضافة منتج جديد')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                    <Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                    <Input value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                    <Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={3} />
                  </div>
                  <div>
                    <Label>{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                    <Textarea value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} rows={3} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Category', 'الفئة')}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger><SelectValue placeholder={t('Select category', 'اختر الفئة')} /></SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {isRTL ? category.name_ar : category.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('Size', 'الحجم')}</Label>
                    <Input value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Price', 'السعر')}</Label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <Label>{t('MOQ (Minimum Order Quantity)', 'الحد الأدنى للطلب')}</Label>
                    <Input type="number" min={1} value={formData.moq} onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) || 1 })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('Product Image', 'صورة المنتج')}</Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder={t('Image URL or upload a file', 'رابط الصورة أو ارفع ملف')}
                      />
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(t('File too large (max 5MB)', 'الملف كبير جداً (الحد الأقصى 5 ميغابايت)'));
                            return;
                          }
                          const ext = file.name.split('.').pop();
                          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
                          toast.loading(t('Uploading...', 'جاري الرفع...'), { id: 'product-upload' });
                          const { data, error } = await supabase.storage
                            .from('products')
                            .upload(fileName, file, { cacheControl: '3600', upsert: false });
                          if (error) {
                            toast.error(t('Upload failed', 'فشل الرفع'), { id: 'product-upload' });
                            return;
                          }
                          const { data: urlData } = supabase.storage.from('products').getPublicUrl(data.path);
                          setFormData({ ...formData, image: urlData.publicUrl });
                          toast.success(t('Image uploaded', 'تم رفع الصورة'), { id: 'product-upload' });
                          e.target.value = '';
                        }}
                      />
                      <div className="flex items-center gap-1 px-3 py-2 border rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm">
                        <Upload className="h-4 w-4" />
                        {t('Upload', 'رفع')}
                      </div>
                    </label>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateAIImage} disabled={generatingAI}>
                      <Sparkles className="h-4 w-4 me-1" />
                      {generatingAI ? t('Generating...', 'جاري الإنشاء...') : t('AI Generate', 'إنشاء بالذكاء')}
                    </Button>
                  </div>
                  {formData.image && (
                    <div className="flex items-center gap-2 mt-2">
                      <img src={formData.image} alt="preview" className="h-16 w-16 object-cover rounded-md border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, image: '' })}>
                        <X className="h-3 w-3 me-1" />{t('Remove', 'إزالة')}
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>{t('Keywords', 'الكلمات المفتاحية')}</Label>
                  <Input value={formData.keywords} onChange={(e) => setFormData({ ...formData, keywords: e.target.value })} placeholder={t('SEO keywords, comma separated', 'كلمات مفتاحية، مفصولة بفواصل')} />
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
                    <Label>{t('Featured', 'مميز')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.in_stock} onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })} />
                    <Label>{t('In Stock', 'متوفر')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                    <Label>{t('Active', 'نشط')}</Label>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
                  <Button type="submit">{editingProduct ? t('Update', 'تحديث') : t('Create', 'إنشاء')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search products...', 'البحث عن المنتجات...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {t('Filters', 'الفلاتر')}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  {t('Clear', 'مسح')}
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-2 border-t">
                <div className="min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">{t('Status', 'الحالة')}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All Statuses', 'جميع الحالات')}</SelectItem>
                      <SelectItem value="active">{t('Active', 'نشط')}</SelectItem>
                      <SelectItem value="inactive">{t('Inactive', 'غير نشط')}</SelectItem>
                      <SelectItem value="featured">{t('Featured', 'مميز')}</SelectItem>
                      <SelectItem value="out_of_stock">{t('Out of Stock', 'غير متوفر')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">{t('Category', 'الفئة')}</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All Categories', 'جميع الفئات')}</SelectItem>
                      {uniqueCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-primary">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">
                {t(`${selectedIds.length} selected`, `${selectedIds.length} محدد`)}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange(true)} className="gap-2">
                  <CheckCircle className="h-4 w-4" />{t('Activate', 'تفعيل')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange(false)} className="gap-2">
                  <XCircle className="h-4 w-4" />{t('Deactivate', 'إلغاء التفعيل')}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />{t('Delete', 'حذف')}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>{t('Clear Selection', 'مسح التحديد')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>{t('Image', 'الصورة')}</TableHead>
              <TableHead>{t('Name', 'الاسم')}</TableHead>
              <TableHead>{t('Category', 'الفئة')}</TableHead>
              <TableHead>{t('Price', 'السعر')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</TableCell>
              </TableRow>
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">{t('No products found', 'لا توجد منتجات')}</TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id} className={selectedIds.includes(product.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(product.id)} onCheckedChange={() => toggleSelection(product.id)} />
                  </TableCell>
                  <TableCell>
                    {product.image && (
                      <img src={product.image} alt={isRTL ? product.name_ar : product.name_en} className="w-16 h-16 object-cover rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{isRTL ? product.name_ar : product.name_en}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.price} {t('SAR', 'ريال')}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {product.is_active ? (
                        <Badge variant="default">{t('Active', 'نشط')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('Inactive', 'غير نشط')}</Badge>
                      )}
                      {product.is_featured && <Badge variant="secondary">{t('Featured', 'مميز')}</Badge>}
                      {!product.in_stock && <Badge variant="outline">{t('Out of Stock', 'غير متوفر')}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">{t('Rows per page:', 'عدد الصفوف:')}</Label>
            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t(`Page ${currentPage} of ${totalPages} (${filteredProducts.length} items)`, `صفحة ${currentPage} من ${totalPages} (${filteredProducts.length} عنصر)`)}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" /><ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" /><ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
