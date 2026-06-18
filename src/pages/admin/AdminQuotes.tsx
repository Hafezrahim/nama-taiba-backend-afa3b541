import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, Trash2, FilterX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  quantity?: number;
  is_processed: boolean;
  created_at: string;
}

const extractProduct = (message?: string) => {
  if (!message) return '-';
  const match = message.match(/Product:\s*(.*?)\n/);
  return match ? match[1] : '-';
};

export default function AdminQuotes() {
  const { t, isRTL } = useLanguage();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [productFilter, setProductFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load quotes', 'فشل تحميل طلبات الأسعار'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsProcessed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ is_processed: true })
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Marked as processed', 'تم التعليم كمعالج'));
      fetchQuotes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure?', 'هل أنت متأكد؟'))) return;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Deleted successfully', 'تم الحذف بنجاح'));
      fetchQuotes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Get unique products for filter dropdown
  const uniqueProducts = useMemo(() => {
    const products = new Set<string>();
    quotes.forEach(q => {
      const prod = extractProduct(q.message);
      if (prod && prod !== '-') {
        products.add(prod);
      }
    });
    return Array.from(products);
  }, [quotes]);

  // Apply filters
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Status Filter
      if (statusFilter === 'pending' && quote.is_processed) return false;
      if (statusFilter === 'processed' && !quote.is_processed) return false;

      // Date Filter
      if (dateFilter) {
        const quoteDate = new Date(quote.created_at).toISOString().split('T')[0];
        if (quoteDate !== dateFilter) return false;
      }

      // Product Filter
      if (productFilter !== 'all') {
        const prod = extractProduct(quote.message);
        if (prod !== productFilter) return false;
      }

      return true;
    });
  }, [quotes, statusFilter, dateFilter, productFilter]);

  const totalPages = Math.ceil(filteredQuotes.length / rowsPerPage);
  const paginatedQuotes = useMemo(() => filteredQuotes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredQuotes, currentPage]);

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setProductFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Quote Requests', 'طلبات عروض الأسعار')}</h1>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">{t('Status', 'الحالة')}</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Statuses', 'كل الحالات')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Statuses', 'كل الحالات')}</SelectItem>
                <SelectItem value="pending">{t('Pending', 'قيد الانتظار')}</SelectItem>
                <SelectItem value="processed">{t('Processed', 'معالج')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">{t('Product', 'المنتج')}</label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('All Products', 'كل المنتجات')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Products', 'كل المنتجات')}</SelectItem>
                {uniqueProducts.map(prod => (
                  <SelectItem key={prod} value={prod}>{prod}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-sm font-medium">{t('Date', 'التاريخ')}</label>
            <Input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="w-full"
            />
          </div>

          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto h-[40px]">
            <FilterX className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('Clear', 'مسح')}
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name', 'الاسم')}</TableHead>
              <TableHead>{t('Email', 'البريد الإلكتروني')}</TableHead>
              <TableHead>{t('Phone', 'الهاتف')}</TableHead>
              <TableHead>{t('Product', 'المنتج')}</TableHead>
              <TableHead>{t('Quantity', 'الكمية')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('Loading...', 'جاري التحميل...')}
                </TableCell>
              </TableRow>
            ) : filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {t('No quotes found', 'لا توجد طلبات')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.name}</TableCell>
                  <TableCell>{quote.email}</TableCell>
                  <TableCell dir="ltr" className={isRTL ? "text-right" : "text-left"}>{quote.phone || '-'}</TableCell>
                  <TableCell>{extractProduct(quote.message)}</TableCell>
                  <TableCell>{quote.quantity || '-'}</TableCell>
                  <TableCell>
                    {quote.is_processed ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">{t('Processed', 'معالج')}</Badge>
                    ) : (
                      <Badge className="bg-nama-purple hover:bg-nama-purple/90">{t('Pending', 'قيد الانتظار')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {!quote.is_processed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsProcessed(quote.id)}
                          title={t('Mark as Processed', 'تحديد كمعالج')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(quote.id)}
                        title={t('Delete', 'حذف')}
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

      {totalPages > 1 && (
        <AdminTablePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={filteredQuotes.length} 
          itemsPerPage={rowsPerPage} 
        />
      )}
    </div>
  );
}
