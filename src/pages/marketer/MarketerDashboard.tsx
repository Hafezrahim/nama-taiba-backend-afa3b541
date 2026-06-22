import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MarketerDashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  // Fetch stats for the marketer
  const { data: stats, isLoading } = useQuery({
    queryKey: ['marketer-dashboard-stats', user?.id],
    queryFn: async () => {
      const { count: totalQuotes, error: e1 } = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company', `marketer:${user?.id}`);

      const { count: pendingQuotes, error: e2 } = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company', `marketer:${user?.id}`)
        .eq('is_processed', false);

      const { count: confirmedQuotes, error: e3 } = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact', head: true })
        .eq('company', `marketer:${user?.id}`)
        .eq('is_processed', true);

      return {
        totalQuotes: totalQuotes || 0,
        pendingQuotes: pendingQuotes || 0,
        confirmedQuotes: confirmedQuotes || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('Dashboard', 'لوحة القيادة')}</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">{t('Marketer Dashboard', 'لوحة تحكم المسوق')}</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {t('Total Quotations', 'إجمالي عروض الأسعار')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {t('Waiting for Reply', 'بانتظار الرد')}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingQuotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {t('Confirmed', 'المؤكدة')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmedQuotes}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
