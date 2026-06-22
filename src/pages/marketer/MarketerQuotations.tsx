import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { PlusCircle, Loader2, Trash2, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketerQuotations() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Form states
  const [clientInfo, setClientInfo] = useState({
    clientName: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    street: '',
    needDelivery: 'no',
  });

  const [items, setItems] = useState([{ productId: '', quantity: '1' }]);

  // Fetch quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['marketer-quotes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('company', `marketer:${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_ar')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const validItems = items.filter(i => i.productId && parseInt(i.quantity, 10) > 0);
      
      if (validItems.length === 0) {
        throw new Error(t('Please add at least one valid item', 'يرجى إضافة عنصر واحد صحيح على الأقل'));
      }

      // Format items with names for easier display later if needed
      const itemsWithDetails = validItems.map(item => {
        const prod = products?.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productNameEn: prod?.name_en,
          productNameAr: prod?.name_ar,
          quantity: parseInt(item.quantity, 10)
        };
      });

      const messageData = JSON.stringify({
        city: clientInfo.city,
        district: clientInfo.district,
        street: clientInfo.street,
        needDelivery: clientInfo.needDelivery === 'yes',
        items: itemsWithDetails
      });

      // We'll set the first item as the main product_id just to satisfy any DB constraints or basic views,
      // but the full list is in `message`
      const firstItem = validItems[0];

      const { error } = await supabase.from('quote_requests').insert({
        name: clientInfo.clientName,
        phone: clientInfo.phone,
        email: clientInfo.email,
        product_id: firstItem.productId,
        quantity: parseInt(firstItem.quantity, 10),
        message: messageData,
        company: `marketer:${user?.id}`, // using company field to link to marketer
        is_processed: false
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketer-quotes'] });
      toast.success(t('Quotation sent successfully', 'تم إرسال عرض السعر بنجاح'));
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || t('Failed to send quotation', 'فشل في إرسال عرض السعر'));
    }
  });

  const resetForm = () => {
    setClientInfo({
      clientName: '',
      phone: '',
      email: '',
      city: '',
      district: '',
      street: '',
      needDelivery: 'no',
    });
    setItems([{ productId: '', quantity: '1' }]);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: '1' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInfo.clientName || !clientInfo.phone) {
      toast.error(t('Please fill in all required fields', 'يرجى تعبئة جميع الحقول المطلوبة'));
      return;
    }
    mutation.mutate();
  };

  const displayQuotes = useMemo(() => {
    return quotes || [];
  }, [quotes]);

  const renderQuoteProductSummary = (quote: any) => {
    try {
      const msg = JSON.parse(quote.message || '{}');
      if (msg.items && Array.isArray(msg.items) && msg.items.length > 0) {
        if (msg.items.length === 1) {
          return isRTL ? msg.items[0].productNameAr : msg.items[0].productNameEn;
        }
        return `${msg.items.length} ${t('Items', 'عناصر')}`;
      }
    } catch (e) {
      // ignore
    }
    return quote.products ? (isRTL ? quote.products.name_ar : quote.products.name_en) : '-';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{t('Quotations', 'عروض الأسعار')}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {t('New Quotation', 'عرض سعر جديد')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl border-b pb-4">
                <FileText className="h-5 w-5 text-primary" />
                {t('Create New Quotation', 'إنشاء عرض سعر جديد')}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Client Info Section */}
              <div className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-semibold mb-4">{t('Client Information', 'معلومات العميل')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('Client Name', 'اسم العميل')} *</Label>
                    <Input
                      required
                      value={clientInfo.clientName}
                      onChange={e => setClientInfo({ ...clientInfo, clientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Phone', 'رقم الهاتف')} *</Label>
                    <Input
                      required
                      dir="ltr"
                      className={isRTL ? "text-right" : "text-left"}
                      value={clientInfo.phone}
                      onChange={e => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('Email', 'البريد الإلكتروني')}</Label>
                    <Input
                      type="email"
                      dir="ltr"
                      className={isRTL ? "text-right" : "text-left"}
                      value={clientInfo.email}
                      onChange={e => setClientInfo({ ...clientInfo, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('City', 'المدينة')}</Label>
                    <Input
                      value={clientInfo.city}
                      onChange={e => setClientInfo({ ...clientInfo, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('District', 'الحي')}</Label>
                    <Input
                      value={clientInfo.district}
                      onChange={e => setClientInfo({ ...clientInfo, district: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('Street', 'الشارع')}</Label>
                    <Input
                      value={clientInfo.street}
                      onChange={e => setClientInfo({ ...clientInfo, street: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('Quotation Items', 'عناصر عرض السعر')}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    {t('Add Item', 'إضافة عنصر')}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-3 border rounded-md bg-white">
                      <div className="w-full sm:flex-1 space-y-2">
                        <Label>{t('Product', 'المنتج')} *</Label>
                        <Select value={item.productId} onValueChange={val => updateItem(index, 'productId', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select Product', 'اختر المنتج')} />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {isRTL ? p.name_ar : p.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-32 space-y-2">
                        <Label>{t('Quantity', 'الكمية')} *</Label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => updateItem(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-auto h-10 w-10"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Section */}
              <div className="space-y-2">
                <Label className="block mb-2 font-semibold">{t('Need Delivery?', 'هل تحتاج إلى توصيل؟')}</Label>
                <RadioGroup
                  value={clientInfo.needDelivery}
                  onValueChange={val => setClientInfo({ ...clientInfo, needDelivery: val })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="yes" id="d-yes" />
                    <Label htmlFor="d-yes" className="font-normal">{t('Yes', 'نعم')}</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="no" id="d-no" />
                    <Label htmlFor="d-no" className="font-normal">{t('No', 'لا')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto min-w-[200px]">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('Send Quotation', 'إرسال عرض السعر')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Client', 'العميل')}</TableHead>
              <TableHead>{t('Products', 'المنتجات')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead className="text-end">{t('Actions', 'إجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : displayQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t('No quotations found.', 'لا توجد عروض أسعار.')}
                </TableCell>
              </TableRow>
            ) : (
              displayQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div className="font-medium">{quote.name}</div>
                    <div className="text-xs text-muted-foreground">{quote.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">
                      {renderQuoteProductSummary(quote)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (!quote.is_processed) {
                        // Check if factory has priced it but marketer hasn't replied
                        try {
                          const reply = JSON.parse(quote.admin_reply || '{}');
                          if (reply.items?.length > 0 && !reply.marketer_replied) {
                            return (
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-white animate-pulse">
                                {t('Action Required', 'إجراء مطلوب')}
                              </Badge>
                            );
                          }
                        } catch (e) {}
                        return (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">
                            {t('Waiting for reply', 'بانتظار الرد')}
                          </Badge>
                        );
                      }
                      return (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white">
                          {t('Confirmed', 'مؤكد')}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {new Date(quote.created_at || '').toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/marketer/quotes/${quote.id}`)} className="gap-2">
                      <Eye className="h-4 w-4" />
                      {t('View', 'عرض')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
