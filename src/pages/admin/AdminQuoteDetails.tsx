import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, ArrowLeft, Trash2, Mail, Phone, Building, User, MapPin, Loader2, MessageSquareReply, Send, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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

// Parse the structured message
const parseMessage = (message: string | undefined | null) => {
  if (!message) return { items: [], location: '', notes: '', marketerDetails: null, isJson: false };

  // Try to parse as JSON (for marketer quotes)
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === 'object') {
      const items = Array.isArray(parsed.items) 
        ? parsed.items.map((item: any) => ({
            name: item.productNameAr || item.productNameEn || 'Unknown Product',
            nameAr: item.productNameAr,
            nameEn: item.productNameEn,
            quantity: item.quantity?.toString() || ''
          }))
        : [];
      
      const locationParts = [parsed.city, parsed.district, parsed.street].filter(Boolean);
      const location = locationParts.join(', ');

      return {
        items,
        location,
        notes: parsed.needDelivery ? 'Delivery requested by client.' : 'No delivery requested.',
        marketerDetails: {
          city: parsed.city || '',
          district: parsed.district || '',
          street: parsed.street || '',
          needDelivery: parsed.needDelivery || false
        },
        raw: message,
        isJson: true
      };
    }
  } catch (e) {
    // Not a valid JSON, continue to regex parsing
  }

  const itemsMatch = message.match(/ITEMS REQUESTED:\n([\s\S]*?)\n\nDELIVERY/);
  const locationMatch = message.match(/DELIVERY LOCATION:\s*(.*)/);
  const notesMatch = message.match(/NOTES:\s*([\s\S]*?)(?:\n\n|$)/);

  const parsedItems: { name: string; quantity: string }[] = [];
  
  if (itemsMatch) {
    const lines = itemsMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    let currentName = '';
    
    for (const line of lines) {
      if (/^\d+\./.test(line)) {
        // e.g., "1. Product: Building Sand (رمل بناء)"
        currentName = line.replace(/^\d+\.\s*(?:Product:\s*)?/, '').trim();
        parsedItems.push({ name: currentName, quantity: '' });
      } else if (line.startsWith('Quantity:')) {
        // e.g., "Quantity: 1 Ton"
        if (parsedItems.length > 0) {
          parsedItems[parsedItems.length - 1].quantity = line.replace('Quantity:', '').trim();
        }
      }
    }
  }

  return {
    items: parsedItems,
    location: locationMatch ? locationMatch[1].trim() : '',
    notes: notesMatch ? notesMatch[1].trim() : '',
    raw: message,
    isJson: false,
    marketerDetails: null
  };
};

export default function AdminQuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Structured reply state
  const [replyNote, setReplyNote] = useState('');
  const [replyItems, setReplyItems] = useState<{name: string, quantity: string, price: string, notes: string, marketer_decision?: string}[]>([]);
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      let fetchedCompany = data.company;
      if (data.company?.startsWith('marketer:')) {
        const marketerId = data.company.replace('marketer:', '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name_en, full_name_ar')
          .eq('id', marketerId)
          .maybeSingle();
          
        if (profile) {
          fetchedCompany = isRTL 
            ? (profile.full_name_ar || profile.full_name_en || data.company)
            : (profile.full_name_en || profile.full_name_ar || data.company);
        }
      }
      
      setQuote({ ...data, company: fetchedCompany });
      
      const parsedReq = parseMessage(data.message);
      
      if (data.admin_reply) {
        try {
          const parsedReply = JSON.parse(data.admin_reply);
          if (parsedReply.items) {
            setReplyItems(parsedReply.items);
            setReplyNote(parsedReply.generalNote || '');
            return;
          }
        } catch (e) {
          // Fallback if it was old text format
          setReplyNote(data.admin_reply);
        }
      }
      
      // Initialize items from request if no structured reply exists
      setReplyItems(parsedReq.items.map((item: any) => ({
        ...item,
        price: '',
        notes: ''
      })));

    } catch (error: any) {
      toast.error(t('Failed to load quote details', 'فشل تحميل تفاصيل عرض السعر'));
      navigate('/admin/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsProcessed = async () => {
    if (!quote) return;
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({ is_processed: true })
        .eq('id', quote.id);

      if (error) throw error;
      toast.success(t('Marked as processed', 'تم التعليم كمعالج'));
      setQuote({ ...quote, is_processed: true });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendReply = async () => {
    if (!quote) return;
    
    // Ensure at least some content is provided
    const hasPrices = replyItems.some(i => i.price.trim() !== '');
    if (!hasPrices && !replyNote.trim()) {
      toast.error(t('Please provide prices or a reply message', 'الرجاء تقديم أسعار أو رسالة رد'));
      return;
    }

    setIsSendingReply(true);
    try {
      const replyPayload = JSON.stringify({
        generalNote: replyNote,
        items: replyItems
      });

      console.log('[handleSendReply] Updating quote ID:', quote.id);
      console.log('[handleSendReply] Payload:', replyPayload);

      const { data, error, status, statusText } = await supabase
        .from('quote_requests')
        .update({ 
          admin_reply: replyPayload,
          is_processed: true 
        })
        .eq('id', quote.id)
        .select(); // Force Supabase to return the updated row

      console.log('[handleSendReply] Response status:', status, statusText);
      console.log('[handleSendReply] Error:', error);
      console.log('[handleSendReply] Returned data:', data);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Update ran but matched no rows — likely RLS blocked it silently
        toast.error('Update returned 0 rows. Check Supabase RLS UPDATE policy or confirm admin_reply column exists. Check browser console for details.');
        return;
      }

      toast.success(t('Official quotation sent successfully', 'تم إرسال عرض السعر الرسمي بنجاح'));
      setQuote({ ...quote, admin_reply: replyPayload, is_processed: true });
    } catch (error: any) {
      console.error('[handleSendReply] Caught error:', error);
      toast.error(`Save failed: ${error.message}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    if (!confirm(t('Are you sure you want to delete this quote?', 'هل أنت متأكد أنك تريد حذف هذا العرض؟'))) return;

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', quote.id);

      if (error) throw error;
      toast.success(t('Deleted successfully', 'تم الحذف بنجاح'));
      navigate('/admin/quotes');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) return null;

  const parsed = parseMessage(quote.message);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/quotes')}>
            <ArrowLeft className={isRTL ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {t('Quote Details', 'تفاصيل طلب السعر')}
              {quote.is_processed ? (
                <Badge className="bg-green-500">{t('Processed', 'معالج')}</Badge>
              ) : (
                <Badge className="bg-amber-500">{t('Pending', 'قيد الانتظار')}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              ID: {quote.id.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!quote.is_processed && (
            <Button onClick={handleMarkAsProcessed} className="gap-2">
              <Check className="h-4 w-4" />
              {t('Mark as Processed', 'تحديد كمعالج')}
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            {t('Delete', 'حذف')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Customer Details */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Customer Information', 'معلومات العميل')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Name', 'الاسم')}</p>
                  <p className="font-medium">{quote.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Email', 'البريد الإلكتروني')}</p>
                  <a href={`mailto:${quote.email}`} className="font-medium text-primary hover:underline">{quote.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Phone', 'الهاتف')}</p>
                  <p className="font-medium" dir="ltr">{quote.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('Company', 'الشركة')}</p>
                  <p className="font-medium">{quote.company || '-'}</p>
                </div>
              </div>
              <div className="pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground mb-1">{t('Submitted At', 'تاريخ التقديم')}</p>
                <p className="font-medium text-sm">
                  {format(new Date(quote.created_at), 'PPPppp', { locale: language === 'ar' ? ar : undefined })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Request Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Request Details', 'تفاصيل الطلب')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Parsed Items OR Raw Message */}
              {parsed.items.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase">{t('Requested Items', 'المنتجات المطلوبة')}</h3>
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
                            <td className="px-4 py-3 font-medium">{isRTL && (item as any).nameAr ? (item as any).nameAr : (!isRTL && (item as any).nameEn ? (item as any).nameEn : item.name)}</td>
                            <td className="px-4 py-3 text-end font-semibold text-primary">{item.quantity || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase">{t('Message', 'الرسالة')}</h3>
                  <div className="bg-muted/30 border rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {quote.message || '-'}
                  </div>
                </div>
              )}

              {/* Location & Quantity Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {parsed.location && (
                  <div className="bg-muted/30 border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase">{t('Delivery Location', 'موقع التسليم')}</span>
                    </div>
                    <p className="font-medium">{parsed.location}</p>
                  </div>
                )}
                {quote.quantity !== null && quote.quantity !== undefined && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-sm font-semibold uppercase text-primary mb-1">{t('Total Quantity', 'إجمالي الكمية')}</p>
                    <p className="font-bold text-2xl text-primary">{quote.quantity}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {parsed.notes && parsed.notes !== 'None' && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase">{t('Additional Notes', 'ملاحظات إضافية')}</h3>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 text-sm">
                    {parsed.notes}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Admin Quotation Reply Card */}
          <Card className="border-primary/20 shadow-sm mt-6">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Calculator className="h-5 w-5" />
                {t('Provide Official Quotation', 'تقديم عرض سعر رسمي')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {replyItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3">{t('Price Items', 'تسعير المنتجات')}</h4>
                  <div className="bg-white dark:bg-card border rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                        <tr>
                          <th className="px-4 py-3 text-start min-w-[150px]">{t('Item', 'المنتج')}</th>
                          <th className="px-4 py-3 text-start w-24">{t('Qty', 'الكمية')}</th>
                          <th className="px-4 py-3 text-start w-32">{t('Unit Price', 'سعر الوحدة')}</th>
                          <th className="px-4 py-3 text-start min-w-[200px]">{t('Notes', 'ملاحظات')}</th>
                          {(() => { try { const r = JSON.parse(quote.admin_reply || '{}'); return r.marketer_replied; } catch { return false; } })() && (
                            <th className="px-4 py-3 text-center w-32">{t('Marketer', 'المسوق')}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {replyItems.map((item, idx) => {
                          let marketerReplied = false;
                          try { const r = JSON.parse(quote.admin_reply || '{}'); marketerReplied = r.marketer_replied; } catch {}
                          return (
                          <tr key={idx} className={`hover:bg-muted/10 transition-colors ${
                            item.marketer_decision === 'accepted' ? 'bg-green-50' :
                            item.marketer_decision === 'rejected' ? 'bg-red-50' : ''
                          }`}>
                            <td className="px-4 py-3 font-medium text-xs">{isRTL && (item as any).nameAr ? (item as any).nameAr : (!isRTL && (item as any).nameEn ? (item as any).nameEn : item.name)}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{item.quantity || '-'}</td>
                            <td className="px-4 py-3">
                              <Input 
                                size={1}
                                className="h-8 text-xs" 
                                placeholder="0.00" 
                                value={item.price}
                                onChange={(e) => {
                                  const newItems = [...replyItems];
                                  newItems[idx].price = e.target.value;
                                  setReplyItems(newItems);
                                }}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input 
                                size={1}
                                className="h-8 text-xs" 
                                placeholder={t('Availability, brand, etc.', 'التوفر، العلامة التجارية، إلخ.')} 
                                value={item.notes}
                                onChange={(e) => {
                                  const newItems = [...replyItems];
                                  newItems[idx].notes = e.target.value;
                                  setReplyItems(newItems);
                                }}
                              />
                            </td>
                            {marketerReplied && (
                              <td className="px-4 py-3 text-center">
                                {item.marketer_decision === 'accepted' ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                                    {t('Accepted', 'مقبول')}
                                  </span>
                                ) : item.marketer_decision === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1 text-red-500 font-medium text-xs">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                    {t('Rejected', 'مرفوض')}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">{t('No decision', 'لا قرار')}</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm mb-3">{t('General Message', 'رسالة عامة')}</h4>
                <Textarea
                  placeholder={t('Type your official reply, terms, or conditions here...', 'اكتب ردك الرسمي، الشروط، أو الأحكام هنا...')}
                  className="min-h-[100px] resize-y text-sm"
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                />
              </div>

            </CardContent>
            <CardFooter className="bg-muted/10 border-t flex justify-end gap-2 pt-4">
              <Button 
                onClick={handleSendReply} 
                disabled={isSendingReply}
                className="gap-2"
              >
                {isSendingReply ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {quote.admin_reply ? t('Update Quotation', 'تحديث العرض') : t('Send Quotation', 'إرسال العرض')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
