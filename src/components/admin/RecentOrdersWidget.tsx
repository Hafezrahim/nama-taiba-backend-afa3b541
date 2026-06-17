import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

interface RecentOrdersWidgetProps {
  language: string;
  t: (en: string, ar: string) => string;
  formatCurrency: (value: number) => string;
}

const RecentOrdersWidget = ({ language, t, formatCurrency }: RecentOrdersWidgetProps) => {
  const { data: recentOrders, isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_phone, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const statusLabels: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Pending', ar: 'معلق' },
    processing: { en: 'Processing', ar: 'قيد المعالجة' },
    shipped: { en: 'Shipped', ar: 'تم الشحن' },
    delivered: { en: 'Delivered', ar: 'تم التسليم' },
    cancelled: { en: 'Cancelled', ar: 'ملغى' },
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('Recent Orders', 'أحدث الطلبات')}</CardTitle>
              <CardDescription className="mt-1">
                {t('Last 5 orders received', 'آخر 5 طلبات تم استلامها')}
              </CardDescription>
            </div>
          </div>
          <Link to="/admin/orders">
            <Button variant="outline" size="sm" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
              {t('View All', 'عرض الكل')}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : recentOrders && recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{order.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(order.total)}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(order.created_at!)}</div>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', statusColors[order.status] || '')}>
                    {language === 'ar'
                      ? statusLabels[order.status]?.ar || order.status
                      : statusLabels[order.status]?.en || order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('No orders yet', 'لا توجد طلبات بعد')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrdersWidget;
