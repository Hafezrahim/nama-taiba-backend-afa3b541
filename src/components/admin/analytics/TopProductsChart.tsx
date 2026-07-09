import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package } from 'lucide-react';

const TopProductsChart = () => {
  const { t, language } = useLanguage();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_name_ar, product_name_en, quantity, price');
      
      if (error) throw error;

      const productMap: Record<string, { quantity: number; revenue: number; nameAr: string; nameEn: string }> = {};

      orderItems?.forEach(item => {
        const key = item.product_name_en || item.product_name_ar;
        if (!key) return;
        
        if (!productMap[key]) {
          productMap[key] = {
            quantity: 0,
            revenue: 0,
            nameAr: item.product_name_ar,
            nameEn: item.product_name_en
          };
        }
        productMap[key].quantity += (item.quantity || 1);
        productMap[key].revenue += (item.price || 0) * (item.quantity || 1);
      });

      // Sort by quantity and take top 5
      const sorted = Object.values(productMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(p => ({
          name: language === 'ar' ? (p.nameAr || p.nameEn) : (p.nameEn || p.nameAr),
          quantity: p.quantity,
          revenue: p.revenue
        }));

      return sorted;
    }
  });

  const colors = [
    'hsl(var(--primary))', 
    'hsl(var(--primary) / 0.8)', 
    'hsl(var(--primary) / 0.6)', 
    'hsl(var(--primary) / 0.4)', 
    'hsl(var(--primary) / 0.2)'
  ];

  return (
    <Card className="border-0 shadow-lg overflow-hidden h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">{t('Top Products', 'أفضل المنتجات')}</CardTitle>
            <CardDescription className="mt-1">
              {t('Most popular products by units sold', 'المنتجات الأكثر رواجاً حسب الوحدات المباعة')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full rounded-xl" />
        ) : !chartData || chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            {t('No data available', 'لا توجد بيانات')}
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [value, t('Units', 'وحدات')]}
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProductsChart;
