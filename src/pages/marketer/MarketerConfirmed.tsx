import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketerConfirmed() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['marketer-quotes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('company', `marketer:${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const confirmedQuotes = useMemo(() => {
    return (quotes || []).filter(q => {
      if (!q.is_processed) return false;
      // Only show if marketer has submitted their decision
      try {
        const reply = JSON.parse(q.admin_reply || '{}');
        return reply.marketer_replied === true;
      } catch {
        // Legacy quotes with no JSON reply — show them as confirmed
        return true;
      }
    });
  }, [quotes]);

  const renderQuoteProductSummary = (quote: any) => {
    try {
      const msg = JSON.parse(quote.message || '{}');
      if (msg.items && Array.isArray(msg.items) && msg.items.length > 0) {
        if (msg.items.length === 1) {
          return isRTL ? msg.items[0].productNameAr : msg.items[0].productNameEn;
        }
        return `${msg.items.length} ${t('Items', 'عناصر')}`;
      }
    } catch (e) {
      // ignore
    }
    return quote.products ? (isRTL ? quote.products.name_ar : quote.products.name_en) : '-';
  };

  const renderAdminReplySummary = (replyStr?: string) => {
    if (!replyStr) return '-';
    try {
      const parsed = JSON.parse(replyStr);
      if (parsed.generalNote) {
        return parsed.generalNote;
      }
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return `${t('Priced', 'تم تسعير')} ${parsed.items.length} ${t('Items', 'عناصر')}`;
      }
      return t('Replied', 'تم الرد');
    } catch (e) {
      return replyStr; // fallback for old text replies
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          {t('Confirmed Quotations', 'عروض الأسعار المؤكدة')}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Client', 'العميل')}</TableHead>
              <TableHead>{t('Products', 'المنتجات')}</TableHead>
              <TableHead>{t('Factory Reply', 'رد المصنع')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead className="text-end">{t('Actions', 'إجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : confirmedQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('No confirmed quotations found.', 'لا توجد عروض أسعار مؤكدة.')}
                </TableCell>
              </TableRow>
            ) : (
              confirmedQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="font-medium">{quote.name}</div>
                    <div className="text-xs text-muted-foreground">{quote.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">
                      {renderQuoteProductSummary(quote)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {renderAdminReplySummary(quote.admin_reply)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100/80">
                      {t('Confirmed', 'مؤكد')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(quote.created_at || '').toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/marketer/quotes/${quote.id}`)} className="gap-2">
                      <Eye className="h-4 w-4" />
                      {t('View', 'عرض')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
