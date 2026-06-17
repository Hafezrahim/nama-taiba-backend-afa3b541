import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Download, Printer, User, Phone, MapPin, Package, Calendar, StickyNote, Loader2, Trash2, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateOrderInvoice } from '@/utils/invoiceGenerator';
import InvoicePreviewDialog from '@/components/admin/InvoicePreviewDialog';
import OrderStatusTimeline from '@/components/admin/OrderStatusTimeline';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface OrderItem {
  id: string;
  product_name_en: string;
  product_name_ar: string;
  price: number;
  quantity: number;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  processing: { en: 'Processing', ar: 'قيد المعالجة' },
  shipped: { en: 'Shipped', ar: 'تم الشحن' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  cancelled: { en: 'Cancelled', ar: 'ملغي' },
};

const AdminOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [deliverers, setDeliverers] = useState<any[]>([]);
  const [currentShipment, setCurrentShipment] = useState<any>(null);
  const [selectedDelivererId, setSelectedDelivererId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin && orderId) {
      fetchOrder();
      fetchOrderItems();
      fetchStatusHistory();
      fetchDeliverers();
      fetchShipment();
    }
  }, [isAdmin, orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId!)
        .single();

      if (error) throw error;
      setOrder(data);
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to load order details', 'فشل تحميل تفاصيل الطلب'),
        variant: 'destructive',
      });
      navigate('/admin/orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId!);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const fetchStatusHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchDeliverers = async () => {
    try {
      const { data, error } = await supabase
        .from('deliverers')
        .select('*')
        .eq('is_active', true)
        .order('name_en');
      if (error) throw error;
      setDeliverers(data || []);
    } catch (error) {
      console.error('Error fetching deliverers:', error);
    }
  };

  const fetchShipment = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, deliverers(name_en, name_ar, phone)')
        .eq('order_id', orderId!)
        .maybeSingle();
      if (error) throw error;
      setCurrentShipment(data);
      if (data) setSelectedDelivererId(data.deliverer_id);
    } catch (error) {
      console.error('Error fetching shipment:', error);
    }
  };

  const assignDeliverer = async () => {
    if (!selectedDelivererId || !orderId) return;
    setIsUpdating(true);
    try {
      if (currentShipment) {
        // Update existing shipment
        const { error } = await supabase
          .from('shipments')
          .update({ deliverer_id: selectedDelivererId, status: 'assigned', assigned_at: new Date().toISOString() })
          .eq('id', currentShipment.id);
        if (error) throw error;
      } else {
        // Create new shipment
        const { error } = await supabase
          .from('shipments')
          .insert({ order_id: orderId, deliverer_id: selectedDelivererId });
        if (error) throw error;
      }
      fetchShipment();
      toast({
        title: t('Deliverer assigned', 'تم تعيين المندوب'),
        description: t('Deliverer has been assigned to this order', 'تم تعيين المندوب لهذا الطلب'),
      });
    } catch (error) {
      console.error('Error assigning deliverer:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to assign deliverer', 'فشل تعيين المندوب'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const updateOrderStatus = async (status: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const oldStatus = order.status;
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;

      // Record status change in history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        old_status: oldStatus,
        new_status: status,
        changed_by: user?.id || null,
      });

      // Send in-app notification to customer if order has user_id
      if (order.user_id) {
        const oldLabel = statusLabels[oldStatus] || { en: oldStatus, ar: oldStatus };
        const newLabel = statusLabels[status] || { en: status, ar: status };
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title_en: 'Order Status Updated',
          title_ar: 'تم تحديث حالة الطلب',
          message_en: `Your order #${order.id.slice(0, 8)} status changed from ${oldLabel.en} to ${newLabel.en}`,
          message_ar: `تم تغيير حالة طلبك #${order.id.slice(0, 8)} من ${oldLabel.ar} إلى ${newLabel.ar}`,
          type: 'order_status',
          metadata: { order_id: order.id, old_status: oldStatus, new_status: status },
        });
      }

      setOrder({ ...order, status });
      fetchStatusHistory();
      toast({
        title: t('Status updated', 'تم تحديث الحالة'),
        description: t('Order status has been updated', 'تم تحديث حالة الطلب'),
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to update order status', 'فشل تحديث حالة الطلب'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', order.id);

      if (error) throw error;
      setOrder({ ...order, notes });
      toast({
        title: t('Notes saved', 'تم حفظ الملاحظات'),
        description: t('Order notes have been updated', 'تم تحديث ملاحظات الطلب'),
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to save notes', 'فشل حفظ الملاحظات'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    setIsDeleting(true);
    try {
      // Delete order items first
      await supabase.from('order_items').delete().eq('order_id', order.id);
      const { error } = await supabase.from('orders').delete().eq('id', order.id);
      if (error) throw error;
      toast({
        title: t('Order deleted', 'تم حذف الطلب'),
        description: t('The order has been permanently deleted', 'تم حذف الطلب نهائياً'),
      });
      navigate('/admin/orders');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to delete order', 'فشل حذف الطلب'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order || orderItems.length === 0) return;
    try {
      const { doc } = await generateOrderInvoice(
        orderItems.map(item => ({
          id: item.id,
          nameEn: item.product_name_en,
          nameAr: item.product_name_ar,
          price: item.price,
          quantity: item.quantity,
          image: '',
        })),
        {
          name: order.customer_name,
          phone: order.customer_phone,
          address: order.customer_address,
        },
        {
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          vat: 0,
          total: order.total,
        },
        { language: language as 'en' | 'ar' }
      );
      doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
      toast({
        title: t('Invoice Downloaded', 'تم تحميل الفاتورة'),
        description: t('Invoice has been saved to your device', 'تم حفظ الفاتورة على جهازك'),
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to generate invoice', 'فشل إنشاء الفاتورة'),
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin || !order) return null;

  const statusLabel = statusLabels[order.status] || { en: order.status, ar: order.status };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders" className="no-print">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {t('Order Details', 'تفاصيل الطلب')}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">#{order.id.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 no-print" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t('Print', 'طباعة')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2 no-print">
                  <Trash2 className="h-4 w-4" />
                  {t('Delete', 'حذف')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('Delete Order?', 'حذف الطلب؟')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      'This action cannot be undone. This will permanently delete the order and all its items.',
                      'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الطلب وجميع عناصره نهائياً.'
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteOrder} disabled={isDeleting}>
                    {isDeleting ? t('Deleting...', 'جاري الحذف...') : t('Delete', 'حذف')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-single-col" data-print-area>
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('Order Items', 'عناصر الطلب')} ({orderItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {t('No items found', 'لا توجد عناصر')}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={cn(language === 'ar' && 'text-right')}>
                          {t('Product', 'المنتج')}
                        </TableHead>
                        <TableHead className={cn(language === 'ar' && 'text-right')}>
                          {t('Unit Price', 'سعر الوحدة')}
                        </TableHead>
                        <TableHead className={cn(language === 'ar' && 'text-right')}>
                          {t('Qty', 'الكمية')}
                        </TableHead>
                        <TableHead className={cn(language === 'ar' && 'text-right')}>
                          {t('Line Total', 'الإجمالي')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {language === 'ar' ? item.product_name_ar : item.product_name_en}
                          </TableCell>
                          <TableCell>{item.price.toFixed(2)} {t('SAR', 'ر.س')}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="font-medium">
                            {(item.price * item.quantity).toFixed(2)} {t('SAR', 'ر.س')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* Order Totals */}
                <div className="mt-6 border-t pt-4 space-y-2 max-w-sm ms-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Subtotal', 'المجموع الفرعي')}</span>
                    <span>{order.subtotal.toFixed(2)} {t('SAR', 'ر.س')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('Shipping', 'الشحن')}</span>
                    <span>{order.shipping.toFixed(2)} {t('SAR', 'ر.س')}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t('Discount', 'الخصم')}</span>
                      <span>-{order.discount.toFixed(2)} {t('SAR', 'ر.س')}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('Total', 'الإجمالي')}</span>
                    <span>{order.total.toFixed(2)} {t('SAR', 'ر.س')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="no-print">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  {t('Order Notes', 'ملاحظات الطلب')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('Add notes about this order...', 'أضف ملاحظات حول هذا الطلب...')}
                  rows={4}
                />
                <Button
                  onClick={saveNotes}
                  disabled={isUpdating || notes === (order.notes || '')}
                  size="sm"
                >
                  {t('Save Notes', 'حفظ الملاحظات')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('Order Status', 'حالة الطلب')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={cn(statusColors[order.status], 'text-white')}>
                    {language === 'ar' ? statusLabel.ar : statusLabel.en}
                  </Badge>
                </div>
                <div className="no-print">
                  <Select
                    value={order.status}
                    onValueChange={updateOrderStatus}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, labels]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', statusColors[key])} />
                            {language === 'ar' ? labels.ar : labels.en}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('Customer Information', 'معلومات العميل')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('Name', 'الاسم')}</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('Phone', 'الهاتف')}</p>
                    <p className="font-medium" dir="ltr">{order.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('Address', 'العنوان')}</p>
                    <p className="font-medium">{order.customer_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deliverer Assignment */}
            <Card className="no-print">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {t('Deliverer', 'المندوب')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentShipment ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('Assigned Deliverer', 'المندوب المعين')}</p>
                        <p className="font-medium">
                          {language === 'ar' ? currentShipment.deliverers?.name_ar : currentShipment.deliverers?.name_en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('Phone', 'الهاتف')}</p>
                        <p className="font-medium" dir="ltr">{currentShipment.deliverers?.phone}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {currentShipment.status === 'assigned' && t('Assigned', 'تم التعيين')}
                      {currentShipment.status === 'picked_up' && t('Picked Up', 'تم الاستلام')}
                      {currentShipment.status === 'in_transit' && t('In Transit', 'في الطريق')}
                      {currentShipment.status === 'delivered' && t('Delivered', 'تم التوصيل')}
                    </Badge>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground">{t('Change Deliverer', 'تغيير المندوب')}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('No deliverer assigned yet', 'لم يتم تعيين مندوب بعد')}</p>
                )}
                <Select value={selectedDelivererId} onValueChange={setSelectedDelivererId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select deliverer', 'اختر المندوب')} />
                  </SelectTrigger>
                  <SelectContent>
                    {deliverers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {language === 'ar' ? d.name_ar : d.name_en} - {d.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={assignDeliverer}
                  disabled={!selectedDelivererId || isUpdating}
                  size="sm"
                  className="w-full"
                >
                  {currentShipment ? t('Reassign', 'إعادة تعيين') : t('Assign Deliverer', 'تعيين مندوب')}
                </Button>
              </CardContent>
            </Card>

            {/* Status History Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('Status History', 'سجل الحالة')}</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusTimeline history={statusHistory} isLoading={isLoadingHistory} />
              </CardContent>
            </Card>

            {/* Date Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('Timeline', 'الجدول الزمني')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('Created', 'تاريخ الإنشاء')}</p>
                    <p className="text-sm font-medium">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                {order.updated_at && order.updated_at !== order.created_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('Last Updated', 'آخر تحديث')}</p>
                      <p className="text-sm font-medium">{formatDate(order.updated_at)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Actions */}
            <Card className="no-print">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('Invoice', 'الفاتورة')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => setInvoicePreviewOpen(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <FileText className="h-4 w-4" />
                  {t('Preview Invoice', 'معاينة الفاتورة')}
                </Button>
                <Button
                  onClick={handleDownloadInvoice}
                  className="w-full gap-2"
                  disabled={orderItems.length === 0}
                >
                  <Download className="h-4 w-4" />
                  {t('Download Invoice', 'تحميل الفاتورة')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <InvoicePreviewDialog
        open={invoicePreviewOpen}
        onOpenChange={setInvoicePreviewOpen}
        order={order}
        orderItems={orderItems}
      />
    </div>
  );
};

export default AdminOrderDetails;
