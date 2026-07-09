import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const OrderTrendsChart = () => {
  const { t, language } = useLanguage();
  const [days, setDays] = useState<7 | 30 | 365>(7);

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['order-trends', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group orders by date
      const ordersByDate: Record<string, { orders: number; revenue: number }> = {};
      
      // Initialize all dates with zero values
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateKey = date.toISOString().split('T')[0];
        ordersByDate[dateKey] = { orders: 0, revenue: 0 };
      }

      // Fill in actual order data
      orders?.forEach(order => {
        const dateKey = order.created_at!.split('T')[0];
        if (ordersByDate[dateKey]) {
          ordersByDate[dateKey].orders += 1;
          ordersByDate[dateKey].revenue += order.total || 0;
        }
      });

      // Convert to array for chart
      return Object.entries(ordersByDate).map(([date, data]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-SA', {
          month: 'short',
          day: 'numeric'
        }),
        orders: data.orders,
        revenue: data.revenue
      }));
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('Order Trends', 'اتجاهات الطلبات')}</CardTitle>
              <CardDescription className="mt-1">
                {t(`Orders and revenue over the past ${days} days`, `الطلبات والإيرادات خلال الـ ${days} يوماً الماضية`)}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={days === 7 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(7)}
              className="transition-all"
            >
              {t('7 Days', '7 أيام')}
            </Button>
            <Button
              variant={days === 30 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(30)}
              className="transition-all"
            >
              {t('30 Days', '30 يوم')}
            </Button>
            <Button
              variant={days === 365 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDays(365)}
              className="transition-all"
            >
              {t('This Year', 'هذا العام')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-xl" />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'orders' ? t('Orders', 'الطلبات') : t('Revenue', 'الإيرادات')
                  ]}
                  labelFormatter={(label) => label}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  name="orders"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">{t('Orders', 'الطلبات')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
            <span className="text-muted-foreground">{t('Revenue', 'الإيرادات')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTrendsChart;
