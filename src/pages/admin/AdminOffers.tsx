import { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Filter, X, Download, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Offer {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  image?: string;
  valid_until?: string;
  price: number;
  min_qty: number;
  max_qty: number;
  category: string;
  contact?: string;
  is_active: boolean;
  created_at?: string;
}

export default function AdminOffers() {
  const { t, isRTL, language } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<Partial<Offer>>({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    image: '',
    valid_until: '',
    price: 0,
    min_qty: 1,
    max_qty: 1,
    category: '',
    contact: '',
    is_active: true
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load offers', 'فشل تحميل العروض'));
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = offers.map(o => o.category).filter(Boolean);
    return [...new Set(categories)];
  }, [offers]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const matchesSearch = 
        offer.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.title_ar.includes(searchTerm) ||
        offer.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && offer.is_active) ||
        (statusFilter === 'inactive' && !offer.is_active);
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        offer.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [offers, searchTerm, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / pageSize);
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOffers.slice(startIndex, startIndex + pageSize);
  }, [filteredOffers, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, pageSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title_ar || !formData.title_en || !formData.category) {
        toast.error(t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
        return;
      }

      const dataToSave = {
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        description_ar: formData.description_ar,
        description_en: formData.description_en,
        image: formData.image,
        valid_until: formData.valid_until,
        price: formData.price || 0,
        min_qty: formData.min_qty || 1,
        max_qty: formData.max_qty || 1,
        category: formData.category,
        contact: formData.contact,
        is_active: formData.is_active !== undefined ? formData.is_active : true
      };
      
      if (editingOffer) {
        const { error } = await supabase
          .from('offers')
          .update(dataToSave)
          .eq('id', editingOffer.id);

        if (error) throw error;
        toast.success(t('Offer updated successfully', 'تم تحديث العرض بنجاح'));
      } else {
        const { error } = await supabase
          .from('offers')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success(t('Offer created successfully', 'تم إنشاء العرض بنجاح'));
      }

      setIsDialogOpen(false);
      setEditingOffer(null);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this offer?', 'هل أنت متأكد من حذف هذا العرض؟'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Offer deleted successfully', 'تم حذف العرض بنجاح'));
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t(`Delete ${selectedIds.length} offers?`, `حذف ${selectedIds.length} عروض؟`))) return;

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;
      toast.success(t(`${selectedIds.length} offers deleted`, `تم حذف ${selectedIds.length} عروض`));
      setSelectedIds([]);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: status })
        .in('id', selectedIds);

      if (error) throw error;
      toast.success(t(
        status ? `${selectedIds.length} offers activated` : `${selectedIds.length} offers deactivated`,
        status ? `تم تفعيل ${selectedIds.length} عروض` : `تم إلغاء تفعيل ${selectedIds.length} عروض`
      ));
      setSelectedIds([]);
      fetchOffers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === filteredOffers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOffers.map(o => o.id));
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'ID', 'Title (EN)', 'Title (AR)', 'Category', 'Price', 'Min Qty', 'Max Qty', 
      'Valid Until', 'Status', 'Contact', 'Created At'
    ];
    
    const rows = filteredOffers.map(offer => [
      offer.id,
      offer.title_en,
      offer.title_ar,
      offer.category,
      offer.price,
      offer.min_qty,
      offer.max_qty,
      offer.valid_until || '',
      offer.is_active ? 'Active' : 'Inactive',
      offer.contact || '',
      offer.created_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `offers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(t('Offers exported successfully', 'تم تصدير العروض بنجاح'));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const resetForm = () => {
    setFormData({
      title_ar: '',
      title_en: '',
      description_ar: '',
      description_en: '',
      image: '',
      valid_until: '',
      price: 0,
      min_qty: 1,
      max_qty: 1,
      category: '',
      contact: '',
      is_active: true
    });
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData(offer);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingOffer(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Offers Management', 'إدارة العروض')}</h1>
          <p className="text-muted-foreground mt-1">
            {t(`Showing ${filteredOffers.length} of ${offers.length} offers`, `عرض ${filteredOffers.length} من ${offers.length} عرض`)}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('Add Offer', 'إضافة عرض')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOffer 
                  ? t('Edit Offer', 'تعديل العرض')
                  : t('Add New Offer', 'إضافة عرض جديد')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('Title (English)', 'العنوان (إنجليزي)')}</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Title (Arabic)', 'العنوان (عربي)')}</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                  <Textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>{t('Price', 'السعر')}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Min Qty', 'الحد الأدنى')}</Label>
                  <Input
                    type="number"
                    value={formData.min_qty}
                    onChange={(e) => setFormData({ ...formData, min_qty: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Max Qty', 'الحد الأقصى')}</Label>
                  <Input
                    type="number"
                    value={formData.max_qty}
                    onChange={(e) => setFormData({ ...formData, max_qty: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Valid Until', 'صالح حتى')}</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('Category', 'الفئة')}</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Contact', 'التواصل')}</Label>
                  <Input
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{t('Image URL', 'رابط الصورة')}</Label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>{t('Active', 'نشط')}</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button type="submit">
                  {editingOffer ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search offers...', 'البحث عن العروض...')}
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
              <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                {t('Export CSV', 'تصدير CSV')}
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-2 border-t">
                <div className="min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">{t('Status', 'الحالة')}</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All Statuses', 'جميع الحالات')}</SelectItem>
                      <SelectItem value="active">{t('Active', 'نشط')}</SelectItem>
                      <SelectItem value="inactive">{t('Inactive', 'غير نشط')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[150px]">
                  <Label className="text-xs text-muted-foreground">{t('Category', 'الفئة')}</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('All Categories', 'جميع الفئات')}</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(true)}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('Activate', 'تفعيل')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange(false)}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {t('Deactivate', 'إلغاء التفعيل')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('Delete', 'حذف')}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                {t('Clear Selection', 'مسح التحديد')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedOffers.length > 0 && selectedIds.length === paginatedOffers.length}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>{t('Title', 'العنوان')}</TableHead>
              <TableHead>{t('Category', 'الفئة')}</TableHead>
              <TableHead>{t('Price', 'السعر')}</TableHead>
              <TableHead>{t('Valid Until', 'صالح حتى')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t('Loading...', 'جاري التحميل...')}
                </TableCell>
              </TableRow>
            ) : paginatedOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t('No offers found', 'لا توجد عروض')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedOffers.map((offer) => (
                <TableRow key={offer.id} className={selectedIds.includes(offer.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(offer.id)}
                      onCheckedChange={() => toggleSelection(offer.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {isRTL ? offer.title_ar : offer.title_en}
                  </TableCell>
                  <TableCell>{offer.category}</TableCell>
                  <TableCell>{offer.price} {t('SAR', 'ريال')}</TableCell>
                  <TableCell>{offer.valid_until || '-'}</TableCell>
                  <TableCell>
                    {offer.is_active ? (
                      <Badge variant="default">{t('Active', 'نشط')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('Inactive', 'غير نشط')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(offer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(offer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredOffers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">{t('Rows per page:', 'عدد الصفوف:')}</Label>
            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
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
              {t(
                `Page ${currentPage} of ${totalPages} (${filteredOffers.length} items)`,
                `صفحة ${currentPage} من ${totalPages} (${filteredOffers.length} عنصر)`
              )}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
