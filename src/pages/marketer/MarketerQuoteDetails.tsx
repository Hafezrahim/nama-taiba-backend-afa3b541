import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Phone, MapPin, Loader2, Calculator, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

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

export default function MarketerQuoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [replyNote, setReplyNote] = useState('');
  const [replyItems, setReplyItems] = useState<any[]>([]);
  // itemDecisions: 'accepted' | 'rejected' keyed by index
  const [itemDecisions, setItemDecisions] = useState<Record<number, 'accepted' | 'rejected'>>({});
  const [marketerReplied, setMarketerReplied] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .eq('company', `marketer:${user?.id}`)
        .single();

      if (error) throw error;
      setQuote(data);

      if (data.admin_reply) {
        try {
          const parsedReply = JSON.parse(data.admin_reply);
          if (parsedReply.items) {
            setReplyItems(parsedReply.items);
            setReplyNote(parsedReply.generalNote || '');
            setMarketerReplied(!!parsedReply.marketer_replied);
            // Restore prior decisions if marketer already replied
            if (parsedReply.marketer_replied) {
              const decisions: Record<number, 'accepted' | 'rejected'> = {};
              parsedReply.items.forEach((item: any, idx: number) => {
                if (item.marketer_decision) {
                  decisions[idx] = item.marketer_decision;
                }
              });
              setItemDecisions(decisions);
            }
          }
        } catch (e) {
          setReplyNote(data.admin_reply);
        }
      }
    } catch (error: any) {
      toast.error(t('Failed to load quote details or unauthorized', 'فشل تحميل تفاصيل عرض السعر أو غير مصرح لك'));
      navigate('/marketer/quotations');
    } finally {
      setLoading(false);
    }
  };

  const toggleDecision = (idx: number, decision: 'accepted' | 'rejected') => {
    if (marketerReplied) return; // already submitted
    setItemDecisions(prev => ({
      ...prev,
      [idx]: prev[idx] === decision ? undefined! : decision,
    }));
  };

  const allDecided = replyItems.length > 0 && replyItems.every((_, idx) => !!itemDecisions[idx]);
  const hasAnyAccepted = Object.values(itemDecisions).some(d => d === 'accepted');

  const handleSubmitDecision = async () => {
    if (!quote) return;
    if (!allDecided) {
      toast.error(t('Please accept or reject each item before submitting.', 'يرجى قبول أو رفض كل عنصر قبل الإرسال.'));
      return;
    }

    setSubmitting(true);
    try {
      const updatedItems = replyItems.map((item, idx) => ({
        ...item,
        marketer_decision: itemDecisions[idx],
      }));

      const updatedReply = JSON.stringify({
        items: updatedItems,
        generalNote: replyNote,
        marketer_replied: true,
      });

      const { error } = await supabase
        .from('quote_requests')
        .update({
          admin_reply: updatedReply,
          // Mark as confirmed only if at least one item is accepted
          is_processed: hasAnyAccepted,
        })
        .eq('id', quote.id)
        .eq('company', `marketer:${user?.id}`);

      if (error) throw error;

      toast.success(t('Decision submitted successfully!', 'تم إرسال قرارك بنجاح!'));
      queryClient.invalidateQueries({ queryKey: ['marketer-quotes'] });
      setMarketerReplied(true);
      // Re-fetch to get the latest state
      await fetchQuote();
    } catch (error: any) {
      toast.error(error.message || t('Failed to submit decision', 'فشل إرسال القرار'));
    } finally {
      setSubmitting(false);
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

  let parsedItems: any[] = [];
  let parsedLocation = '';
  let needDelivery = false;

  try {
    const parsed = JSON.parse(quote.message || '{}');
    if (parsed.items) parsedItems = parsed.items;
    const locationParts = [parsed.city, parsed.district, parsed.street].filter(Boolean);
    parsedLocation = locationParts.join(', ');
    needDelivery = parsed.needDelivery;
  } catch (e) {
    // fallback or empty
  }

  const hasPricing = replyItems.length > 0;

  const getStatusBadge = () => {
    if (marketerReplied) {
      return <Badge className="bg-green-500 text-white">{t('Decision Submitted', 'تم إرسال القرار')}</Badge>;
    }
    if (hasPricing) {
      return <Badge className="bg-orange-500 text-white animate-pulse">{t('Action Required', 'إجراء مطلوب')}</Badge>;
    }
    if (quote.is_processed) {
      return <Badge className="bg-green-500 text-white">{t('Confirmed', 'مؤكد')}</Badge>;
    }
    return <Badge className="bg-amber-500 text-white">{t('Pending', 'قيد الانتظار')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className={isRTL ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {t('Quotation Details', 'تفاصيل عرض السعر')}
              {getStatusBadge()}
            </h1>
            <p className="text-muted-foreground text-sm mt-1 font-mono">
              ID: {quote.id.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Customer Details */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Client Information', 'معلومات العميل')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('Name', 'الاسم')}</p>
                <p className="font-medium">{quote.name}</p>
              </div>
              <div className="flex items-start gap-3 mt-3">
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

              {parsedLocation && (
                <div className="flex items-start gap-3 border-t pt-3 mt-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('Address', 'العنوان')}</p>
                    <p className="font-medium">{parsedLocation}</p>
                    {needDelivery !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {needDelivery ? t('Delivery required', 'يتطلب توصيل') : t('No delivery needed', 'لا يتطلب توصيل')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground mb-1">{t('Submitted At', 'تاريخ التقديم')}</p>
                <p className="font-medium text-sm">
                  {format(new Date(quote.created_at), 'PPPppp', { locale: language === 'ar' ? ar : undefined })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Request Details & Reply */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Requested Items', 'المنتجات المطلوبة')}</CardTitle>
            </CardHeader>
            <CardContent>
              {parsedItems.length > 0 ? (
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
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-center font-medium text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">
                            {isRTL && item.productNameAr ? item.productNameAr : (!isRTL && item.productNameEn ? item.productNameEn : item.name)}
                          </td>
                          <td className="px-4 py-3 text-end font-semibold text-primary">{item.quantity || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-muted/30 border rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {quote.message || '-'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Factory Quotation + Confirmation Actions */}
          {hasPricing && (
            <Card className={`shadow-sm mt-6 ${!marketerReplied ? 'border-orange-300 ring-1 ring-orange-200' : 'border-primary/20'}`}>
              <CardHeader className={`pb-4 ${!marketerReplied ? 'bg-orange-50' : 'bg-primary/5'}`}>
                <CardTitle className={`text-lg flex items-center gap-2 ${!marketerReplied ? 'text-orange-700' : 'text-primary'}`}>
                  <Calculator className="h-5 w-5" />
                  {t('Factory Quotation', 'عرض سعر المصنع')}
                  {!marketerReplied && (
                    <span className="text-sm font-normal bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                      {t('Awaiting your decision', 'بانتظار قرارك')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">

                <div className="bg-white dark:bg-card border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('Item', 'المنتج')}</th>
                        <th className="px-4 py-3 text-start w-20">{t('Qty', 'الكمية')}</th>
                        <th className="px-4 py-3 text-start w-32">{t('Unit Price', 'سعر الوحدة')}</th>
                        <th className="px-4 py-3 text-start">{t('Notes', 'ملاحظات')}</th>
                        <th className="px-4 py-3 text-center w-36">{t('Your Decision', 'قرارك')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {replyItems.map((item: any, idx) => {
                        const decision = itemDecisions[idx];
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              decision === 'accepted' ? 'bg-green-50' :
                              decision === 'rejected' ? 'bg-red-50' :
                              'hover:bg-muted/10'
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-xs">
                              {isRTL && item.nameAr ? item.nameAr : (!isRTL && item.nameEn ? item.nameEn : item.name)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{item.quantity || '-'}</td>
                            <td className="px-4 py-3 font-semibold text-primary">{item.price || '-'}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{item.notes || '-'}</td>
                            <td className="px-4 py-3">
                              {marketerReplied ? (
                                // Show read-only decision
                                <div className="flex justify-center">
                                  {decision === 'accepted' ? (
                                    <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                                      <CheckCircle className="h-4 w-4" /> {t('Accepted', 'مقبول')}
                                    </span>
                                  ) : decision === 'rejected' ? (
                                    <span className="flex items-center gap-1 text-red-500 font-medium text-xs">
                                      <XCircle className="h-4 w-4" /> {t('Rejected', 'مرفوض')}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                                      <Clock className="h-4 w-4" /> {t('No decision', 'لا قرار')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                // Interactive decision buttons
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => toggleDecision(idx, 'accepted')}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
                                      decision === 'accepted'
                                        ? 'bg-green-500 text-white border-green-500'
                                        : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                                    }`}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    {t('Accept', 'قبول')}
                                  </button>
                                  <button
                                    onClick={() => toggleDecision(idx, 'rejected')}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all ${
                                      decision === 'rejected'
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'bg-white text-red-500 border-red-300 hover:bg-red-50'
                                    }`}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    {t('Reject', 'رفض')}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {replyNote && (
                  <div>
                    <h4 className="font-medium text-sm mb-3">{t('Factory Note', 'ملاحظة المصنع')}</h4>
                    <div className="bg-muted/20 border rounded-lg p-4 text-sm whitespace-pre-wrap">
                      {replyNote}
                    </div>
                  </div>
                )}

                {/* Submit Decision Button */}
                {!marketerReplied && (
                  <div className="border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      {allDecided
                        ? t('All items reviewed. Ready to submit your decision.', 'تم مراجعة جميع العناصر. جاهز لإرسال قرارك.')
                        : t('Please accept or reject each item above.', 'يرجى قبول أو رفض كل عنصر أعلاه.')}
                    </p>
                    <Button
                      onClick={handleSubmitDecision}
                      disabled={!allDecided || submitting}
                      className="min-w-[200px] gap-2"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t('Submit Final Decision', 'إرسال القرار النهائي')}
                    </Button>
                  </div>
                )}

                {marketerReplied && (
                  <div className="border-t pt-4 flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">{t('Your decision has been submitted.', 'تم إرسال قرارك.')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No pricing yet */}
          {!hasPricing && !quote.is_processed && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('Awaiting factory pricing', 'بانتظار تسعير المصنع')}</p>
                <p className="text-sm mt-1">{t('The factory will review and price your request soon.', 'سيقوم المصنع بمراجعة وتسعير طلبك قريباً.')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
