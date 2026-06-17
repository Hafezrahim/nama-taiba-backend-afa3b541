import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, Trash2 } from 'lucide-react';
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

export default function AdminQuotes() {
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const totalPages = Math.ceil(quotes.length / rowsPerPage);
  const paginatedQuotes = useMemo(() => quotes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [quotes, currentPage]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Quote Requests', 'طلبات عروض الأسعار')}</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name', 'الاسم')}</TableHead>
              <TableHead>{t('Email', 'البريد الإلكتروني')}</TableHead>
              <TableHead>{t('Company', 'الشركة')}</TableHead>
              <TableHead>{t('Quantity', 'الكمية')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
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
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t('No quotes found', 'لا توجد طلبات')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.name}</TableCell>
                  <TableCell>{quote.email}</TableCell>
                  <TableCell>{quote.company || '-'}</TableCell>
                  <TableCell>{quote.quantity || '-'}</TableCell>
                  <TableCell>
                    {quote.is_processed ? (
                      <Badge variant="secondary">{t('Processed', 'معالج')}</Badge>
                    ) : (
                      <Badge>{t('Pending', 'قيد الانتظار')}</Badge>
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
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(quote.id)}
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

      <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={quotes.length} itemsPerPage={rowsPerPage} />
    </div>
  );
}
