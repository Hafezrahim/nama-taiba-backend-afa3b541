import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TopClientsWidget = () => {
  const { t, language } = useLanguage();

  const { data: topClients, isLoading } = useQuery({
    queryKey: ['top-clients'],
    queryFn: async () => {
      // Fetch orders to aggregate by user_id
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total, customer_name')
        .not('user_id', 'is', null);
      
      if (ordersError) throw ordersError;

      const clientMap: Record<string, { id: string; name: string; totalRevenue: number; orderCount: number }> = {};

      orders?.forEach(order => {
        const uid = order.user_id!;
        if (!clientMap[uid]) {
          clientMap[uid] = {
            id: uid,
            name: order.customer_name || 'Unknown',
            totalRevenue: 0,
            orderCount: 0
          };
        }
        clientMap[uid].totalRevenue += (order.total || 0);
        clientMap[uid].orderCount += 1;
      });

      // Sort by total revenue
      const sortedClients = Object.values(clientMap)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5);

      return sortedClients;
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
    <Card className="border-0 shadow-lg overflow-hidden h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">{t('Top Clients', 'أفضل العملاء')}</CardTitle>
            <CardDescription className="mt-1">
              {t('Clients with the highest purchase volume', 'العملاء أصحاب أعلى حجم مشتريات')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !topClients || topClients.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            {t('No data available', 'لا توجد بيانات')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Client', 'العميل')}</TableHead>
                  <TableHead className="text-center">{t('Orders', 'الطلبات')}</TableHead>
                  <TableHead className="text-right">{t('Revenue', 'الإيرادات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClients.map((client, idx) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {idx + 1}
                        </Badge>
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{client.orderCount}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(client.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopClientsWidget;
