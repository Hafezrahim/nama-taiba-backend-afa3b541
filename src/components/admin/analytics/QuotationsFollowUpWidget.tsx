import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowUpRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const QuotationsFollowUpWidget = () => {
  const { t, language } = useLanguage();

  const { data: pendingQuotes, isLoading } = useQuery({
    queryKey: ['pending-quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .is('is_processed', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('Quotations Follow-up', 'متابعة عروض الأسعار')}</CardTitle>
              <CardDescription className="mt-1">
                {t('Pending quotes requiring attention', 'طلبات عروض الأسعار المعلقة')}
              </CardDescription>
            </div>
          </div>
          <Link to="/admin/quotes">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('View All', 'عرض الكل')}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !pendingQuotes || pendingQuotes.length === 0 ? (
          <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-20" />
            <p>{t('No pending quotations', 'لا توجد طلبات معلقة')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingQuotes.map(quote => (
              <div key={quote.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                <div>
                  <h4 className="font-medium text-sm">{quote.name}</h4>
                  {quote.company && (
                    <p className="text-xs text-muted-foreground mt-0.5">{quote.company}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(quote.created_at)}</span>
                  </div>
                </div>
                <Link to={`/admin/quotes/${quote.id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    {t('Review', 'مراجعة')}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuotationsFollowUpWidget;
