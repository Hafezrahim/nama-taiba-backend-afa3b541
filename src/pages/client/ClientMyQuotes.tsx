import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Clock, CheckCircle, Loader2, Plus, MessageSquareReply, MapPin, Phone, Building, Package, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  admin_reply?: string;
  quantity?: number;
  is_processed: boolean;
  created_at: string;
}

interface ReplyItem {
  name: string;
  quantity: string;
  price: string;
  notes: string;
}

const parseMessage = (message: string | undefined | null) => {
  if (!message) return { items: [], location: '', notes: '' };
  const itemsMatch = message.match(/ITEMS REQUESTED:\n([\s\S]*?)\n\nDELIVERY/);
  const locationMatch = message.match(/DELIVERY LOCATION:\s*(.*)/);
  const notesMatch = message.match(/NOTES:\s*([\s\S]*?)(?:\n\n|$)/);
  const parsedItems: { name: string; quantity: string }[] = [];
  if (itemsMatch) {
    const lines = itemsMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^\d+\./.test(line)) {
        parsedItems.push({ name: line.replace(/^\d+\.\s*(?:Product:\s*)?/, '').trim(), quantity: '' });
      } else if (line.startsWith('Quantity:') && parsedItems.length > 0) {
        parsedItems[parsedItems.length - 1].quantity = line.replace('Quantity:', '').trim();
      }
    }
  }
  return {
    items: parsedItems,
    location: locationMatch ? locationMatch[1].trim() : '',
    notes: notesMatch ? notesMatch[1].trim() : '',
  };
};

const parseAdminReply = (adminReply: string | undefined | null): { items: ReplyItem[]; generalNote: string } | null => {
  if (!adminReply) return null;
  try {
    const data = JSON.parse(adminReply);
    if (data.items) return data;
  } catch { return { items: [], generalNote: adminReply }; }
  return null;
};

const parseQty = (qtyStr: string): number => {
  const match = qtyStr.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 1;
};

const ClientMyQuotes = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Order state
  const [orderSheet, setOrderSheet] = useState<{ quote: QuoteRequest; reply: { items: ReplyItem[]; generalNote: string } } | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' });
  const [isPlacing, setIsPlacing] = useState(false);

  const { data: quotes = [], isLoading, error } = useQuery({
    queryKey: ['my-quotes', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('quote_requests').select('*').ilike('email', user.email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as QuoteRequest[];
    },
    enabled: !!user?.email,
  });

  const openOrderSheet = (quote: QuoteRequest, reply: { items: ReplyItem[]; generalNote: string }) => {
    setCheckedItems({});
    setOrderForm({ name: quote.name || '', phone: quote.phone || '', address: '' });
    setOrderSheet({ quote, reply });
  };

  const selectedReplyItems = orderSheet
    ? orderSheet.reply.items.filter((_, i) => checkedItems[i])
    : [];

  const subtotal = selectedReplyItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) || 0) * parseQty(item.quantity);
  }, 0);

  const handlePlaceOrder = async () => {
    if (!orderSheet || selectedReplyItems.length === 0) return;
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      toast.error(t('Please fill in all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }
    setIsPlacing(true);
    try {
      const shortId = orderSheet.quote.id.slice(0, 8).toUpperCase();
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_name: orderForm.name,
          customer_phone: orderForm.phone,
          customer_address: orderForm.address,
          status: 'pending',
          subtotal,
          total: subtotal,
          discount: 0,
          shipping: 0,
          reference_source: `QUOTE-${shortId}`,
          notes: `Order placed from quotation #${shortId}`,
          user_id: user?.id ?? null,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      const itemRows = selectedReplyItems.map(item => ({
        order_id: order.id,
        product_name_en: item.name,
        product_name_ar: item.name,
        price: parseFloat(item.price) || 0,
        quantity: parseQty(item.quantity),
      }));

      const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
      if (itemsErr) throw itemsErr;

      toast.success(t('Order placed successfully!', 'تم تقديم الطلب بنجاح!'));
      setOrderSheet(null);
    } catch (err: any) {
      toast.error(`${t('Failed', 'فشل')}: ${err.message}`);
    } finally {
      setIsPlacing(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (error) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('My Quote Requests', 'طلبات عروض الأسعار')}</h1>
      <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-6">
        <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">⚠️ {t('Access Restricted', 'الوصول مقيد')}</h3>
        <pre className="text-xs bg-black/10 dark:bg-white/10 rounded p-3 mt-2">{`Policy: (email = auth.email())`}</pre>
        <p className="text-xs text-amber-600 mt-2">Error: {(error as any)?.message}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('My Quote Requests', 'طلبات عروض الأسعار')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('Track your submitted quotation requests.', 'تتبع طلبات عروض الأسعار المقدمة.')}</p>
        </div>
        <Button asChild className="gap-2 hidden sm:flex">
          <Link to="/client/quote"><Plus className="h-4 w-4" />{t('New Quote', 'طلب جديد')}</Link>
        </Button>
      </div>

      {/* Empty state */}
      {quotes.length === 0 ? (
        <Card className="border-dashed border-2 text-center py-16">
          <CardContent>
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('No Quote Requests Yet', 'لا توجد طلبات عروض بعد')}</h3>
            <Button asChild className="mt-4"><Link to="/client/quote"><Plus className="h-4 w-4 me-2" />{t('Request Your First Quote', 'طلب عرض سعرك الأول')}</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const parsed = parseMessage(quote.message);
            const parsedReply = parseAdminReply(quote.admin_reply);
            const isProcessed = quote.is_processed;
            const isExpanded = expandedId === quote.id;
            const hasPricedItems = parsedReply && parsedReply.items.some(i => i.price && parseFloat(i.price) > 0);

            return (
              <Card key={quote.id} className={cn('overflow-hidden transition-shadow', isExpanded ? 'shadow-md ring-1 ring-primary/20' : 'hover:shadow-sm')}>
                <CardContent className="p-0">
                  {/* Collapsed row */}
                  <button
                    className="w-full text-start p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                  >
                    <div className={cn('p-3 rounded-xl shrink-0', isProcessed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')}>
                      {isProcessed ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">#{quote.id.slice(0, 8).toUpperCase()}</span>
                        <Badge variant="secondary" className={cn('text-xs border-transparent', isProcessed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                          {isProcessed ? t('Reviewed', 'تمت المراجعة') : t('Pending Review', 'قيد المراجعة')}
                        </Badge>
                        {quote.admin_reply && (
                          <Badge className="text-xs bg-primary/10 text-primary border-transparent gap-1">
                            <MessageSquareReply className="h-3 w-3" />{t('Quotation Ready', 'العرض جاهز')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">
                        {parsed.items.length > 0
                          ? <>{parsed.items[0].name}{parsed.items.length > 1 && <span className="text-muted-foreground"> +{parsed.items.length - 1} {t('more', 'أخرى')}</span>}</>
                          : <span className="text-muted-foreground">{t('Custom quote request', 'طلب عرض سعر مخصص')}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(quote.created_at), 'PPP', { locale: language === 'ar' ? ar : undefined })}
                        {parsed.location && <span className="ms-2">· 📍 {parsed.location}</span>}
                      </p>
                    </div>
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t bg-muted/10 p-5 space-y-6">

                      {/* Official Quotation */}
                      {parsedReply && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
                          <div className="bg-primary/10 px-4 py-3 flex items-center gap-2 text-primary font-bold border-b border-primary/10">
                            <MessageSquareReply className="h-5 w-5" />
                            {t('Official Quotation', 'عرض السعر الرسمي')}
                          </div>
                          <div className="p-4 space-y-4">
                            {parsedReply.items.length > 0 && (
                              <div className="bg-white dark:bg-card border rounded-lg overflow-hidden overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                                    <tr>
                                      <th className="px-3 py-3 text-start">{t('Item', 'المنتج')}</th>
                                      <th className="px-3 py-3 text-start w-24">{t('Qty', 'الكمية')}</th>
                                      <th className="px-3 py-3 text-start w-28">{t('Unit Price', 'سعر الوحدة')}</th>
                                      <th className="px-3 py-3 text-start">{t('Notes', 'ملاحظات')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {parsedReply.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-3 py-3 font-medium text-xs">{item.name}</td>
                                        <td className="px-3 py-3 text-muted-foreground text-xs">{item.quantity || '-'}</td>
                                        <td className="px-3 py-3 font-bold text-primary">{item.price || '-'}</td>
                                        <td className="px-3 py-3 text-xs text-muted-foreground">{item.notes || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {parsedReply.generalNote && (
                              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{parsedReply.generalNote}</p>
                            )}

                            {/* Place Order button */}
                            {hasPricedItems && (
                              <div className="flex justify-end pt-2">
                                <Button className="gap-2" onClick={() => openOrderSheet(quote, parsedReply)}>
                                  <ShoppingCart className="h-4 w-4" />
                                  {t('Place Order from This Quote', 'تقديم طلب من هذا العرض')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Requested Items */}
                      {parsed.items.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <Package className="h-4 w-4" />{t('Your Requested Items', 'المنتجات التي طلبتها')}
                          </h4>
                          <div className="bg-white dark:bg-card border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                                <tr>
                                  <th className="px-4 py-3 w-12 text-center">#</th>
                                  <th className="px-4 py-3 text-start">{t('Item Name', 'اسم المنتج')}</th>
                                  <th className="px-4 py-3 text-end">{t('Qty', 'الكمية')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {parsed.items.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 text-center font-medium text-muted-foreground">{idx + 1}</td>
                                    <td className="px-4 py-3 font-medium">{item.name}</td>
                                    <td className="px-4 py-3 text-end font-semibold text-primary">{item.quantity || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Raw message fallback */}
                      {parsed.items.length === 0 && quote.message && (
                        <p className="text-sm bg-muted/40 rounded-lg p-3 whitespace-pre-wrap">{quote.message}</p>
                      )}

                      {/* Meta info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {parsed.location && (
                          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div><p className="text-xs text-muted-foreground">{t('Delivery Location', 'موقع التسليم')}</p><p className="font-medium text-sm">{parsed.location}</p></div>
                          </div>
                        )}
                        {quote.phone && (
                          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div><p className="text-xs text-muted-foreground">{t('Contact Phone', 'رقم التواصل')}</p><p className="font-medium text-sm" dir="ltr">{quote.phone}</p></div>
                          </div>
                        )}
                        {quote.company && (
                          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                            <Building className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div><p className="text-xs text-muted-foreground">{t('Company', 'الشركة')}</p><p className="font-medium text-sm">{quote.company}</p></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mobile new quote button */}
      <div className="sm:hidden">
        <Button asChild className="w-full gap-2">
          <Link to="/client/quote"><Plus className="h-4 w-4" />{t('New Quote Request', 'طلب عرض سعر جديد')}</Link>
        </Button>
      </div>

      {/* Order Sheet */}
      <Sheet open={!!orderSheet} onOpenChange={(open) => !open && setOrderSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {t('Place Order', 'تقديم طلب')}
              {orderSheet && (
                <span className="text-sm font-mono text-muted-foreground">
                  #{orderSheet.quote.id.slice(0, 8).toUpperCase()}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {orderSheet && (
            <div className="space-y-6 py-6">
              {/* Item selection */}
              <div>
                <h4 className="font-semibold text-sm mb-3">{t('Select Items to Order', 'اختر المنتجات للطلب')}</h4>
                <div className="space-y-2">
                  {orderSheet.reply.items.map((item, idx) => {
                    const price = parseFloat(item.price);
                    const hasPrice = price > 0;
                    return (
                      <label
                        key={idx}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          checkedItems[idx] ? 'bg-primary/5 border-primary/40' : 'hover:bg-muted/30',
                          !hasPrice && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-primary h-4 w-4"
                          checked={!!checkedItems[idx]}
                          disabled={!hasPrice}
                          onChange={(e) => setCheckedItems(prev => ({ ...prev, [idx]: e.target.checked }))}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity || '-'}</p>
                        </div>
                        <div className="text-end shrink-0">
                          {hasPrice
                            ? <span className="font-bold text-primary text-sm">{item.price}</span>
                            : <span className="text-xs text-muted-foreground">{t('No price', 'لا سعر')}</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Order summary */}
              {selectedReplyItems.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">{t('Order Summary', 'ملخص الطلب')}</h4>
                  {selectedReplyItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[60%]">{item.name}</span>
                      <span className="font-medium">{(parseFloat(item.price) || 0) * parseQty(item.quantity)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>{t('Total', 'الإجمالي')}</span>
                    <span className="text-primary">{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Customer info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">{t('Delivery Details', 'تفاصيل التوصيل')}</h4>
                <div className="space-y-2">
                  <Label>{t('Full Name', 'الاسم الكامل')} *</Label>
                  <Input value={orderForm.name} onChange={e => setOrderForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Phone', 'الهاتف')} *</Label>
                  <Input dir="ltr" value={orderForm.phone} onChange={e => setOrderForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Delivery Address', 'عنوان التوصيل')} *</Label>
                  <Input value={orderForm.address} placeholder={t('Street, District, City', 'الشارع، الحي، المدينة')} onChange={e => setOrderForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          <SheetFooter>
            <Button
              className="w-full gap-2"
              disabled={selectedReplyItems.length === 0 || isPlacing || !orderForm.name || !orderForm.phone || !orderForm.address}
              onClick={handlePlaceOrder}
            >
              {isPlacing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {t('Confirm Order', 'تأكيد الطلب')}
              {selectedReplyItems.length > 0 && ` (${selectedReplyItems.length})`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientMyQuotes;
