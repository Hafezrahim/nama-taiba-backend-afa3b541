import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Eye, Package, RefreshCw, Download, Calendar as CalendarIcon, CheckSquare,
  Search, Filter, X, Plus, ShoppingBag, Clock, Truck, CheckCircle, XCircle,
  TrendingUp, DollarSign, Users, Loader2, Phone, MapPin, User, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import InvoicePreviewDialog from '@/components/admin/InvoicePreviewDialog';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, endOfMonth } from 'date-fns';

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
  reference_source?: string | null;
}

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  image: string | null;
  category: string;
}

interface CartLineItem {
  product: Product;
  quantity: number;
}

const statusConfig: Record<string, { bg: string; text: string; icon: React.ElementType; en: string; ar: string }> = {
  pending:    { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock, en: 'Pending', ar: 'قيد الانتظار' },
  processing: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', icon: Package, en: 'Processing', ar: 'قيد المعالجة' },
  shipped:    { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', icon: Truck, en: 'Shipped', ar: 'تم الشحن' },
  delivered:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle, en: 'Delivered', ar: 'تم التوصيل' },
  cancelled:  { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, en: 'Cancelled', ar: 'ملغي' },
};

const referenceOptions = [
  { value: 'phone_call', en: 'Phone Call', ar: 'مكالمة هاتفية' },
  { value: 'in_store', en: 'In Store / Walk-in', ar: 'حضور شخصي' },
  { value: 'social_media', en: 'Social Media', ar: 'وسائل التواصل' },
  { value: 'whatsapp', en: 'WhatsApp', ar: 'واتساب' },
  { value: 'website', en: 'Website', ar: 'الموقع الإلكتروني' },
  { value: 'referral', en: 'Referral', ar: 'إحالة' },
  { value: 'other', en: 'Other', ar: 'أخرى' },
];

const AdminOrders = () => {
  const { isAdmin, loading, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const { data: adminProfile } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name_en, full_name_ar')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  const adminName = language === 'ar'
    ? (adminProfile?.full_name_ar || adminProfile?.full_name_en || user?.email?.split('@')[0] || '')
    : (adminProfile?.full_name_en || adminProfile?.full_name_ar || user?.email?.split('@')[0] || '');

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Export
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [quickDate, setQuickDate] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Create order
  const [createOpen, setCreateOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '', address: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [orderShipping, setOrderShipping] = useState(0);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Invoice
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setIsLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name_en, name_ar, price, image, category').eq('is_active', true);
    if (data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Stats ──
  const stats = useMemo(() => {
    const today = new Date();
    const last30 = subDays(today, 30);
    const monthStart = startOfMonth(today);

    const thisMonth = orders.filter(o => new Date(o.created_at) >= monthStart);
    const last30d = orders.filter(o => new Date(o.created_at) >= last30);

    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenueThisMonth: thisMonth.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total : 0), 0),
      ordersLast30: last30d.length,
      avgOrder: orders.length > 0 ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
    };
  }, [orders]);

  // ── Filtering ──
  const filteredOrders = useMemo(() => {
    let dateRange: { from: Date; to: Date } | null = null;
    const now = new Date();
    if (quickDate === 'today') dateRange = { from: startOfDay(now), to: endOfDay(now) };
    else if (quickDate === 'yesterday') { const y = subDays(now, 1); dateRange = { from: startOfDay(y), to: endOfDay(y) }; }
    else if (quickDate === 'week') dateRange = { from: startOfWeek(now), to: endOfWeek(now) };
    else if (quickDate === 'month') dateRange = { from: startOfMonth(now), to: endOfMonth(now) };

    return orders.filter(o => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || o.customer_name.toLowerCase().includes(q) || o.customer_phone.includes(searchQuery) || o.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const min = minAmount ? parseFloat(minAmount) : 0;
      const max = maxAmount ? parseFloat(maxAmount) : Infinity;
      const created = new Date(o.created_at);
      const matchDate = !dateRange || (created >= dateRange.from && created <= dateRange.to);
      return matchSearch && matchStatus && matchDate && o.total >= min && o.total <= max;
    });
  }, [orders, searchQuery, statusFilter, minAmount, maxAmount, quickDate]);

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || minAmount || maxAmount || quickDate !== 'all';

  // ── Actions ──
  const updateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setIsUpdating(false);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkStatus) return;
    setIsBulkUpdating(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('orders').update({ status: bulkStatus }).in('id', ids);
    if (!error) {
      setOrders(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, status: bulkStatus } : o));
      setSelectedIds(new Set());
      setBulkStatus('');
      toast({ title: t(`${ids.length} orders updated`, `تم تحديث ${ids.length} طلب`) });
    }
    setIsBulkUpdating(false);
  };

  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const toggleAll = () => {
    setSelectedIds(selectedIds.size === filteredOrders.length ? new Set() : new Set(filteredOrders.map(o => o.id)));
  };

  // ── Export ──
  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      let data = orders;
      if (dateFrom) data = data.filter(o => new Date(o.created_at) >= dateFrom);
      if (dateTo) { const end = new Date(dateTo); end.setHours(23, 59, 59); data = data.filter(o => new Date(o.created_at) <= end); }
      if (data.length === 0) { toast({ title: t('No orders to export', 'لا توجد طلبات للتصدير'), variant: 'destructive' }); setIsExporting(false); return; }

      const headers = [
        language === 'ar' ? 'رقم الطلب' : 'Order ID',
        language === 'ar' ? 'العميل' : 'Customer Name',
        language === 'ar' ? 'الهاتف' : 'Phone',
        language === 'ar' ? 'العنوان' : 'Address',
        language === 'ar' ? 'المجموع الفرعي' : 'Subtotal',
        language === 'ar' ? 'الشحن' : 'Shipping',
        language === 'ar' ? 'الخصم' : 'Discount',
        language === 'ar' ? 'الإجمالي' : 'Total',
        language === 'ar' ? 'الحالة' : 'Status',
        language === 'ar' ? 'المصدر' : 'Source',
        language === 'ar' ? 'ملاحظات' : 'Notes',
        language === 'ar' ? 'التاريخ' : 'Date'
      ];
      
      const rows = data.map(o => [
        o.id,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.subtotal,
        o.shipping,
        o.discount,
        o.total,
        statusConfig[o.status]?.[language === 'ar' ? 'ar' : 'en'] || o.status,
        referenceOptions.find(r => r.value === o.reference_source)?.[language === 'ar' ? 'ar' : 'en'] || o.reference_source || '',
        o.notes || '',
        format(new Date(o.created_at), 'yyyy-MM-dd HH:mm')
      ]);

      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Auto-size columns
      worksheet['!cols'] = [
        { wch: 36 }, { wch: 25 }, { wch: 15 }, { wch: 30 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      XLSX.writeFile(workbook, `orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({ title: t('Exported successfully', 'تم التصدير بنجاح') });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: t('Export failed', 'فشل التصدير'), variant: 'destructive' });
    }
    setIsExporting(false);
  };

  // ── Create Order ──
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) { setCartItems(prev => prev.filter(i => i.product.id !== productId)); return; }
    setCartItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const cartSubtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartTotal = cartSubtotal + orderShipping - orderDiscount;

  const cartProductIds = useMemo(() => new Set(cartItems.map(i => i.product.id)), [cartItems]);
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter(p => !cartProductIds.has(p.id) && (!q || p.name_en.toLowerCase().includes(q) || p.name_ar.includes(productSearch) || p.category.toLowerCase().includes(q)));
  }, [products, productSearch]);

  const handleCreateOrder = async () => {
    if (!clientInfo.name || !clientInfo.phone || cartItems.length === 0) {
      toast({ title: t('Missing info', 'بيانات ناقصة'), description: t('Fill client info and add products', 'أضف بيانات العميل والمنتجات'), variant: 'destructive' });
      return;
    }
    setIsCreating(true);

    const { data: order, error } = await supabase.from('orders').insert({
      customer_name: clientInfo.name,
      customer_phone: clientInfo.phone,
      customer_address: clientInfo.address || 'N/A',
      subtotal: cartSubtotal,
      shipping: orderShipping,
      discount: orderDiscount,
      total: cartTotal,
      notes: orderNotes || null,
      status: 'processing',
      reference_source: orderReference || null,
      user_id: user?.id || null,
    }).select().single();

    if (error || !order) {
      toast({ title: t('Error', 'خطأ'), description: t('Failed to create order', 'فشل إنشاء الطلب'), variant: 'destructive' });
      setIsCreating(false);
      return;
    }

    const items = cartItems.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name_en: i.product.name_en,
      product_name_ar: i.product.name_ar,
      price: i.product.price,
      quantity: i.quantity,
    }));
    await supabase.from('order_items').insert(items);

    // Show invoice
    setInvoiceOrder({
      id: order.id,
      customer_name: clientInfo.name,
      customer_phone: clientInfo.phone,
      customer_address: clientInfo.address || 'N/A',
      subtotal: cartSubtotal,
      shipping: orderShipping,
      discount: orderDiscount,
      total: cartTotal,
      status: 'pending',
    });
    setInvoiceItems(items.map((it, idx) => ({
      id: `item-${idx}`,
      product_name_en: it.product_name_en,
      product_name_ar: it.product_name_ar,
      price: it.price,
      quantity: it.quantity,
    })));

    // Reset
    setCreateOpen(false);
    setCartItems([]);
    setClientInfo({ name: '', phone: '', address: '' });
    setOrderNotes('');
    setOrderReference('');
    setOrderShipping(0);
    setOrderDiscount(0);
    setIsCreating(false);
    setInvoiceOpen(true);

    fetchOrders();
    toast({ title: t('Order created!', 'تم إنشاء الطلب!') });
  };

  // ── Helpers ──
  const formatDate = (d: string) => new Date(d).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtCur = (n: number) => `${n.toFixed(2)} ${t('SAR', 'ر.س')}`;

  const StatusBadge = ({ status }: { status: string }) => {
    const c = statusConfig[status] || statusConfig.pending;
    const Icon = c.icon;
    return <Badge variant="secondary" className={cn('gap-1.5 font-medium', c.bg, c.text)}><Icon className="h-3 w-3" />{language === 'ar' ? c.ar : c.en}</Badge>;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('Orders', 'الطلبات')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('Manage and track all customer orders', 'إدارة ومتابعة جميع طلبات العملاء')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 me-1.5", isLoading && "animate-spin")} />
            {t('Refresh', 'تحديث')}
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t('New Order', 'طلب جديد')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  {t('Create Order for Client', 'إنشاء طلب لعميل')}
                </DialogTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {t('Created by:', 'بواسطة:')} <span className="font-medium text-foreground">{adminName}</span>
                </p>
              </DialogHeader>
              <ScrollArea className="flex-1 px-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                  {/* Column 1: Client info + Reference + Notes */}
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4" />{t('Client Information', 'بيانات العميل')}</h3>
                      <Input placeholder={t('Full Name *', 'الاسم الكامل *')} value={clientInfo.name} onChange={e => setClientInfo(p => ({ ...p, name: e.target.value }))} />
                      <Input placeholder={t('Phone *', 'الهاتف *')} value={clientInfo.phone} onChange={e => setClientInfo(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                      <Input placeholder={t('Address', 'العنوان')} value={clientInfo.address} onChange={e => setClientInfo(p => ({ ...p, address: e.target.value }))} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t('Reference / Source', 'المصدر / المرجع')}</Label>
                      <Select value={orderReference} onValueChange={setOrderReference}>
                        <SelectTrigger><SelectValue placeholder={t('How did client reach you?', 'كيف وصل إليكم العميل؟')} /></SelectTrigger>
                        <SelectContent>
                          {referenceOptions.map(r => (
                            <SelectItem key={r.value} value={r.value}>{language === 'ar' ? r.ar : r.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea placeholder={t('Order notes (optional)', 'ملاحظات الطلب (اختياري)')} value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={2} />
                  </div>

                  {/* Column 2: Products search */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Package className="h-4 w-4" />{t('Add Products', 'إضافة منتجات')}</h3>
                    <Input placeholder={t('Search products...', 'البحث عن منتج...')} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    <ScrollArea className="h-[320px] border rounded-lg bg-muted/20">
                      <div className="p-1.5 space-y-1">
                        {filteredProducts.slice(0, 20).map(p => (
                          <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-start group"
                          >
                            {p.image ? (
                              <img src={p.image} alt="" className="w-11 h-11 rounded-md object-cover border border-border shadow-sm" />
                            ) : (
                              <div className="w-11 h-11 rounded-md bg-muted flex items-center justify-center border border-border"><Package className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{language === 'ar' ? p.name_ar : p.name_en}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>
                            </div>
                            <div className="text-end shrink-0">
                              <span className="text-sm font-bold text-primary">{fmtCur(p.price)}</span>
                            </div>
                            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Plus className="h-3.5 w-3.5 text-primary" />
                            </div>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <p className="text-center py-6 text-sm text-muted-foreground">{t('No products found', 'لا توجد منتجات')}</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Column 3: Cart + Totals */}
                  <div className="space-y-5">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4" />{t('Order Items', 'عناصر الطلب')} ({cartItems.length})</h3>

                    {cartItems.length === 0 ? (
                      <div className="border rounded-lg p-8 text-center text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t('Add products from the left', 'أضف منتجات من القائمة')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2 border rounded-lg p-3">
                        {cartItems.map(item => (
                          <div key={item.product.id} className="flex items-center gap-3 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{language === 'ar' ? item.product.name_ar : item.product.name_en}</p>
                              <p className="text-xs text-muted-foreground">{fmtCur(item.product.price)} × {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.product.id, item.quantity - 1)}>-</Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQty(item.product.id, item.quantity + 1)}>+</Button>
                            </div>
                            <span className="text-sm font-semibold w-24 text-end">{fmtCur(item.product.price * item.quantity)}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => updateCartQty(item.product.id, 0)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Shipping & Discount */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Shipping', 'الشحن')}</Label>
                        <Input type="number" min={0} value={orderShipping} onChange={e => setOrderShipping(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{t('Discount', 'الخصم')}</Label>
                        <Input type="number" min={0} value={orderDiscount} onChange={e => setOrderDiscount(Number(e.target.value))} />
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Subtotal', 'المجموع الفرعي')}</span><span>{fmtCur(cartSubtotal)}</span></div>
                      {orderShipping > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Shipping', 'الشحن')}</span><span>+{fmtCur(orderShipping)}</span></div>}
                      {orderDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('Discount', 'الخصم')}</span><span className="text-destructive">-{fmtCur(orderDiscount)}</span></div>}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg"><span>{t('Total', 'الإجمالي')}</span><span className="text-primary">{fmtCur(cartTotal)}</span></div>
                    </div>

                    <Button className="w-full h-12 text-base gap-2" onClick={handleCreateOrder} disabled={isCreating || cartItems.length === 0 || !clientInfo.name || !clientInfo.phone}>
                      {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                      {t('Create Order & Generate Invoice', 'إنشاء الطلب وإصدار الفاتورة')}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('Total Orders', 'إجمالي الطلبات'), value: stats.total, icon: ShoppingBag, color: 'text-primary' },
          { label: t('Pending', 'قيد الانتظار'), value: stats.pending, icon: Clock, color: 'text-amber-600' },
          { label: t('Revenue (Month)', 'الإيراد (الشهر)'), value: fmtCur(stats.revenueThisMonth), icon: DollarSign, color: 'text-emerald-600' },
          { label: t('Avg Order', 'متوسط الطلب'), value: fmtCur(stats.avgOrder), icon: TrendingUp, color: 'text-blue-600' },
        ].map((kpi, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={cn("p-2.5 rounded-xl bg-muted/60", kpi.color)}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Search + Filters Bar ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="ps-9" placeholder={t('Search name, phone, order ID...', 'البحث بالاسم، الهاتف، رقم الطلب...')} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Status', 'كل الحالات')}</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{language === 'ar' ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant={showFilters ? 'secondary' : 'outline'} size="icon" onClick={() => setShowFilters(!showFilters)}><Filter className="h-4 w-4" /></Button>
            {hasActiveFilters && <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setMinAmount(''); setMaxAmount(''); setQuickDate('all'); }} className="gap-1"><X className="h-3.5 w-3.5" />{t('Clear', 'مسح')}</Button>}
          </div>

          <div className="flex gap-2 flex-wrap">
            {([
              { k: 'all', en: 'All', ar: 'الكل' },
              { k: 'today', en: 'Today', ar: 'اليوم' },
              { k: 'yesterday', en: 'Yesterday', ar: 'أمس' },
              { k: 'week', en: 'This Week', ar: 'هذا الأسبوع' },
              { k: 'month', en: 'This Month', ar: 'هذا الشهر' },
            ] as const).map(opt => (
              <Button
                key={opt.k}
                size="sm"
                variant={quickDate === opt.k ? 'default' : 'outline'}
                onClick={() => { setQuickDate(opt.k); setCurrentPage(1); }}
              >
                {language === 'ar' ? opt.ar : opt.en}
              </Button>
            ))}
          </div>

          {showFilters && (
            <div className="flex gap-3 flex-wrap items-end pt-2 border-t">
              <div className="space-y-1"><Label className="text-xs">{t('Min Amount', 'الحد الأدنى')}</Label><Input type="number" className="w-28" value={minAmount} onChange={e => setMinAmount(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">{t('Max Amount', 'الحد الأقصى')}</Label><Input type="number" className="w-28" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} /></div>
              <Separator orientation="vertical" className="h-10" />
              <div className="space-y-1"><Label className="text-xs">{t('From', 'من')}</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("w-32 justify-start text-start", !dateFrom && "text-muted-foreground")}><CalendarIcon className="h-3.5 w-3.5 me-1.5" />{dateFrom ? format(dateFrom, 'MM/dd') : t('Date', 'تاريخ')}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} /></PopoverContent></Popover>
              </div>
              <div className="space-y-1"><Label className="text-xs">{t('To', 'إلى')}</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("w-32 justify-start text-start", !dateTo && "text-muted-foreground")}><CalendarIcon className="h-3.5 w-3.5 me-1.5" />{dateTo ? format(dateTo, 'MM/dd') : t('Date', 'تاريخ')}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dateTo} onSelect={setDateTo} /></PopoverContent></Popover>
              </div>
              <Button size="sm" onClick={exportExcel} disabled={isExporting} className="gap-1.5"><Download className="h-3.5 w-3.5" />{t('Export Excel', 'تصدير إكسل')}</Button>
            </div>
          )}

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedIds.size} {t('selected', 'محدد')}</span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-36 h-8"><SelectValue placeholder={t('Status', 'الحالة')} /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{language === 'ar' ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="default" onClick={handleBulkUpdate} disabled={isBulkUpdating || !bulkStatus} className="h-8 gap-1">
                <RefreshCw className={cn("h-3.5 w-3.5", isBulkUpdating && "animate-spin")} />
                {t('Update', 'تحديث')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8">{t('Deselect', 'إلغاء')}</Button>
            </div>
          )}

          {hasActiveFilters && <p className="text-xs text-muted-foreground">{t(`Showing ${filteredOrders.length} of ${orders.length}`, `عرض ${filteredOrders.length} من ${orders.length}`)}</p>}
        </CardContent>
      </Card>

      {/* ── Quick filter summary ── */}
      {(() => {
        const labelMap: Record<string, { en: string; ar: string }> = {
          all: { en: 'All Time', ar: 'كل الفترة' },
          today: { en: 'Today', ar: 'اليوم' },
          yesterday: { en: 'Yesterday', ar: 'أمس' },
          week: { en: 'This Week', ar: 'هذا الأسبوع' },
          month: { en: 'This Month', ar: 'هذا الشهر' },
        };
        const revenue = filteredOrders
          .filter(o => o.status !== 'cancelled')
          .reduce((s, o) => s + Number(o.total || 0), 0);
        const lbl = labelMap[quickDate];
        return (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {t('Showing', 'عرض')}: <span className="text-foreground font-semibold">{language === 'ar' ? lbl.ar : lbl.en}</span>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t('Total Orders', 'إجمالي الطلبات')}</p>
                  <p className="text-2xl font-bold text-primary">{filteredOrders.length}</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('Total Revenue', 'إجمالي الإيرادات')}</p>
                  <p className="text-2xl font-bold text-primary">{revenue.toFixed(2)} {t('SAR', 'ر.س')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* ── Orders Table ── */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>{hasActiveFilters ? t('No matching orders', 'لا توجد طلبات مطابقة') : t('No orders yet', 'لا توجد طلبات بعد')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10"><Checkbox checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0} onCheckedChange={toggleAll} /></TableHead>
                      <TableHead>{t('Order', 'الطلب')}</TableHead>
                      <TableHead>{t('Customer', 'العميل')}</TableHead>
                      <TableHead>{t('Total', 'الإجمالي')}</TableHead>
                      <TableHead>{t('Status', 'الحالة')}</TableHead>
                      <TableHead>{t('Source', 'المصدر')}</TableHead>
                      <TableHead>{t('Date', 'التاريخ')}</TableHead>
                      <TableHead className="w-24">{t('Actions', 'إجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map(order => (
                      <TableRow
                        key={order.id}
                        className={cn("cursor-pointer transition-colors", selectedIds.has(order.id) && "bg-primary/5")}
                        onClick={e => {
                          if ((e.target as HTMLElement).closest('button, [role="checkbox"], [role="combobox"], [data-radix-collection-item]')) return;
                          navigate(`/admin/orders/${order.id}`);
                        }}
                      >
                        <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} /></TableCell>
                        <TableCell><span className="font-mono text-xs bg-muted px-2 py-1 rounded">#{order.id.slice(0, 8)}</span></TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{order.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell><span className="font-semibold">{fmtCur(order.total)}</span></TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Select value={order.status} onValueChange={v => updateStatus(order.id, v)} disabled={isUpdating}>
                            <SelectTrigger className="w-36 h-8 border-0 bg-transparent p-0"><StatusBadge status={order.status} /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{language === 'ar' ? v.ar : v.en}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {order.reference_source ? (
                            <Badge variant="outline" className="text-xs">
                              {referenceOptions.find(r => r.value === order.reference_source)?.[language === 'ar' ? 'ar' : 'en'] || order.reference_source}
                            </Badge>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span></TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/orders/${order.id}`)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 border-t">
                <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredOrders.length} itemsPerPage={rowsPerPage} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <InvoicePreviewDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} order={invoiceOrder} orderItems={invoiceItems} />
    </div>
  );
};

export default AdminOrders;
