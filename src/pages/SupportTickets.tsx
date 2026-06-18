import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, MessageCircle, Send, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

const DEFAULT_SUBJECTS = [
  { en: 'Order Issue', ar: 'مشكلة في الطلب' },
  { en: 'Product Inquiry', ar: 'استفسار عن منتج' },
  { en: 'Shipping & Delivery', ar: 'الشحن والتوصيل' },
  { en: 'Payment Problem', ar: 'مشكلة في الدفع' },
  { en: 'Return & Refund', ar: 'إرجاع واسترداد' },
  { en: 'General Question', ar: 'سؤال عام' },
];

const DEFAULT_MESSAGES = {
  en: [
    "Hello, I need help with my recent order.",
    "I have a question about a product.",
    "I'd like to request a refund.",
    "My order hasn't arrived yet.",
    "I need to change my delivery address.",
  ],
  ar: [
    "مرحباً، أحتاج مساعدة بخصوص طلبي الأخير.",
    "لدي سؤال حول منتج معين.",
    "أود طلب استرداد المبلغ.",
    "لم يصل طلبي بعد.",
    "أحتاج لتغيير عنوان التوصيل.",
  ],
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; labelEn: string; labelAr: string }> = {
  open: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, labelEn: 'Open', labelAr: 'مفتوح' },
  in_progress: { color: 'bg-amber-100 text-amber-700', icon: Clock, labelEn: 'In Progress', labelAr: 'قيد المعالجة' },
  resolved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, labelEn: 'Resolved', labelAr: 'تم الحل' },
  closed: { color: 'bg-muted text-muted-foreground', icon: CheckCircle, labelEn: 'Closed', labelAr: 'مغلق' },
};

const SupportTickets = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newFirstMessage, setNewFirstMessage] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      const channel = supabase
        .channel(`ticket-msgs-${selectedTicket.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${selectedTicket.id}` }, () => fetchMessages(selectedTicket.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setTickets(data as Ticket[]);
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as TicketMessage[]);
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !newFirstMessage.trim() || !user) return;
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({ user_id: user.id, subject: newSubject, priority: newPriority })
      .select()
      .single();
    if (error || !ticket) {
      toast({ title: t('Error creating ticket', 'خطأ في إنشاء التذكرة'), variant: 'destructive' });
      return;
    }
    await supabase.from('ticket_messages').insert({
      ticket_id: ticket.id, sender_id: user.id, is_admin: false, message: newFirstMessage,
    });
    setCreateOpen(false);
    setNewSubject('');
    setNewFirstMessage('');
    setNewPriority('medium');
    fetchTickets();
    setSelectedTicket(ticket as Ticket);
    toast({ title: t('Ticket created successfully', 'تم إنشاء التذكرة بنجاح') });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    setSending(true);
    await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id, sender_id: user.id, is_admin: false, message: newMessage,
    });
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
    setNewMessage('');
    setSending(false);
    fetchMessages(selectedTicket.id);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={cn('gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {language === 'ar' ? config.labelAr : config.labelEn}
      </Badge>
    );
  };

  if (authLoading || !user) return null;

  return (
    <>
      <SEO titleEn="Support Tickets" titleAr="تذاكر الدعم" descriptionEn="Manage your support tickets" descriptionAr="إدارة تذاكر الدعم الخاصة بك" />
      <div className={cn("space-y-6", isRTL && "rtl")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{t('Support Tickets', 'تذاكر الدعم')}</h1>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{t('New Ticket', 'تذكرة جديدة')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('Create Support Ticket', 'إنشاء تذكرة دعم')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('Subject', 'الموضوع')}</label>
                    <Select onValueChange={setNewSubject}>
                      <SelectTrigger><SelectValue placeholder={t('Select a topic', 'اختر موضوعاً')} /></SelectTrigger>
                      <SelectContent>
                        {DEFAULT_SUBJECTS.map((s, i) => (
                          <SelectItem key={i} value={language === 'ar' ? s.ar : s.en}>
                            {language === 'ar' ? s.ar : s.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input className="mt-2" placeholder={t('Or type custom subject...', 'أو اكتب موضوعاً مخصصاً...')} value={newSubject} onChange={e => setNewSubject(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('Priority', 'الأولوية')}</label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('Low', 'منخفضة')}</SelectItem>
                        <SelectItem value="medium">{t('Medium', 'متوسطة')}</SelectItem>
                        <SelectItem value="high">{t('High', 'عالية')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('Message', 'الرسالة')}</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(language === 'ar' ? DEFAULT_MESSAGES.ar : DEFAULT_MESSAGES.en).map((msg, i) => (
                        <Button key={i} variant="outline" size="sm" className="text-xs h-auto py-1 px-2" onClick={() => setNewFirstMessage(msg)}>
                          {msg.length > 30 ? msg.slice(0, 30) + '...' : msg}
                        </Button>
                      ))}
                    </div>
                    <Textarea placeholder={t('Describe your issue...', 'اوصف مشكلتك...')} value={newFirstMessage} onChange={e => setNewFirstMessage(e.target.value)} rows={3} />
                  </div>
                  <Button className="w-full" onClick={createTicket} disabled={!newSubject.trim() || !newFirstMessage.trim()}>
                    {t('Submit Ticket', 'إرسال التذكرة')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets list */}
            <div className="lg:col-span-1 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</div>
              ) : tickets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('No tickets yet', 'لا توجد تذاكر بعد')}</p>
                    <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                      {t('Create your first ticket', 'أنشئ تذكرتك الأولى')}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                tickets.map(ticket => (
                  <Card
                    key={ticket.id}
                    className={cn("cursor-pointer transition-all hover:shadow-md", selectedTicket?.id === ticket.id && "ring-2 ring-primary")}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm line-clamp-1">{ticket.subject}</h3>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: language === 'ar' ? ar : undefined })}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Chat area */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                  </CardHeader>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <div key={msg.id} className={cn("flex", msg.is_admin ? "justify-start" : "justify-end")}>
                          <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.is_admin
                              ? "bg-muted text-foreground rounded-bl-sm"
                              : "bg-primary text-primary-foreground rounded-br-sm"
                          )}>
                            {msg.is_admin && <p className="text-xs font-semibold mb-1 opacity-70">{t('Support Team', 'فريق الدعم')}</p>}
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                            <p className={cn("text-[10px] mt-1", msg.is_admin ? "text-muted-foreground" : "text-primary-foreground/70")}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: language === 'ar' ? ar : undefined })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  {selectedTicket.status !== 'closed' && (
                    <div className="p-4 border-t">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(language === 'ar' ? DEFAULT_MESSAGES.ar : DEFAULT_MESSAGES.en).slice(0, 3).map((msg, i) => (
                          <Button key={i} variant="outline" size="sm" className="text-xs h-auto py-1" onClick={() => setNewMessage(msg)}>
                            {msg.length > 25 ? msg.slice(0, 25) + '...' : msg}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          placeholder={t('Type a message...', 'اكتب رسالة...')}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        />
                        <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>{t('Select a ticket to view conversation', 'اختر تذكرة لعرض المحادثة')}</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportTickets;
