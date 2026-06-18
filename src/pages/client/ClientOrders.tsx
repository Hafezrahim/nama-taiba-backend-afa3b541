import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ShoppingBag, Eye, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  subtotal: number;
  shipping: number;
  discount: number;
}

interface OrderItem {
  id: string;
  product_name_en: string;
  product_name_ar: string;
  price: number;
  quantity: number;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType; en: string; ar: string }> = {
  pending:    { bg: 'bg-amber-100 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', icon: Clock, en: 'Pending', ar: 'قيد الانتظار' },
  processing: { bg: 'bg-blue-100 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-400', icon: Package, en: 'Processing', ar: 'قيد المعالجة' },
  shipped:    { bg: 'bg-purple-100 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-400', icon: Truck, en: 'Shipped', ar: 'تم الشحن' },
  delivered:  { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle, en: 'Delivered', ar: 'تم التوصيل' },
  cancelled:  { bg: 'bg-red-100 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-400', icon: XCircle, en: 'Cancelled', ar: 'ملغي' },
};

const ClientOrders = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const viewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    
    if (data) setOrderItems(data);
    setDetailsLoading(false);
  };

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('My Orders', 'طلباتي')}</h1>

      {orders.length === 0 ? (
        <Card className="text-center py-16 bg-transparent border-dashed border-2">
          <CardContent>
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('No Orders Yet', 'لا توجد طلبات بعد')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('You haven\'t placed any orders yet. Browse our products and find something you like!', 'لم تقم بإنشاء أي طلبات حتى الآن. تصفح منتجاتنا واكتشف ما يعجبك!')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const conf = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = conf.icon;
            
            return (
              <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <Badge variant="secondary" className={`${conf.bg} ${conf.text} border-transparent flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {language === 'ar' ? conf.ar : conf.en}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'PPP', { locale: language === 'ar' ? ar : undefined })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 sm:justify-end">
                    <div className="text-start sm:text-end">
                      <p className="text-xs text-muted-foreground">{t('Total', 'الإجمالي')}</p>
                      <p className="font-bold text-lg">{order.total.toFixed(2)} {t('SAR', 'ر.س')}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => viewDetails(order)} className="gap-2">
                      <Eye className="h-4 w-4" />
                      {t('Details', 'التفاصيل')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{t('Order Details', 'تفاصيل الطلب')} <span className="text-muted-foreground font-mono text-sm ml-2">#{selectedOrder?.id.slice(0, 8).toUpperCase()}</span></span>
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : selectedOrder && (
            <div className="mt-4 space-y-6">
              <div className="bg-muted/30 rounded-lg border p-4">
                <h4 className="font-semibold mb-3">{t('Order Summary', 'ملخص الطلب')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('Subtotal', 'المجموع الفرعي')}</span><span>{selectedOrder.subtotal.toFixed(2)} {t('SAR', 'ر.س')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('Shipping', 'الشحن')}</span><span>{selectedOrder.shipping.toFixed(2)} {t('SAR', 'ر.س')}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t('Discount', 'الخصم')}</span><span className="text-red-500">-{selectedOrder.discount.toFixed(2)} {t('SAR', 'ر.س')}</span></div>}
                  <div className="pt-2 border-t flex justify-between font-bold text-lg"><span>{t('Total', 'الإجمالي')}</span><span className="text-primary">{selectedOrder.total.toFixed(2)} {t('SAR', 'ر.س')}</span></div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">{t('Products', 'المنتجات')}</h4>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{language === 'ar' ? item.product_name_ar : item.product_name_en}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} × {item.price.toFixed(2)} {t('SAR', 'ر.س')}</p>
                      </div>
                      <p className="font-semibold">{(item.quantity * item.price).toFixed(2)} {t('SAR', 'ر.س')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientOrders;
