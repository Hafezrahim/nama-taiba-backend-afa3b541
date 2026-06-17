import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Send, Loader2, MessageCircle, AlertCircle, Clock, CheckCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  message: string;
  created_at: string;
}

const DEFAULT_REPLIES = {
  en: [
    "Thank you for contacting us. We're looking into this.",
    "Your issue has been escalated to our team.",
    "Could you please provide more details?",
    "This has been resolved. Please let us know if you need further help.",
    "We apologize for the inconvenience. We're working on it.",
  ],
  ar: [
    "شكراً لتواصلكم معنا. نحن نعمل على حل المشكلة.",
    "تم تصعيد مشكلتك لفريقنا المختص.",
    "هل يمكنك تقديم مزيد من التفاصيل؟",
    "تم حل المشكلة. يرجى إعلامنا إذا كنت بحاجة لمزيد من المساعدة.",
    "نعتذر عن الإزعاج. نعمل على حل المشكلة.",
  ],
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; labelEn: string; labelAr: string }> = {
  open: { color: 'bg-blue-100 text-blue-700', icon: AlertCircle, labelEn: 'Open', labelAr: 'مفتوح' },
  in_progress: { color: 'bg-amber-100 text-amber-700', icon: Clock, labelEn: 'In Progress', labelAr: 'قيد المعالجة' },
  resolved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, labelEn: 'Resolved', labelAr: 'تم الحل' },
  closed: { color: 'bg-muted text-muted-foreground', icon: CheckCircle, labelEn: 'Closed', labelAr: 'مغلق' },
};

const AdminTickets = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      const channel = supabase
        .channel(`admin-ticket-${selectedTicket.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${selectedTicket.id}` }, () => fetchMessages(selectedTicket.id))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription for new tickets
  useEffect(() => {
    const channel = supabase
      .channel('admin-new-tickets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (data) {
      // Fetch user profiles for each ticket
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name_en, full_name_ar').in('id', userIds);
      
      const enriched = data.map(ticket => {
        const profile = profiles?.find(p => p.id === ticket.user_id);
        return {
          ...ticket,
          user_name: profile ? (language === 'ar' ? profile.full_name_ar : profile.full_name_en) || 'User' : 'User',
        };
      });
      setTickets(enriched as Ticket[]);
    }
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

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    setSending(true);
    
    await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id, sender_id: user.id, is_admin: true, message: newMessage,
    });
    
    // Update ticket status to in_progress if it was open
    if (selectedTicket.status === 'open') {
      await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', selectedTicket.id);
      setSelectedTicket({ ...selectedTicket, status: 'in_progress' });
    } else {
      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
    }

    // Send notification to user
    await supabase.from('notifications').insert({
      user_id: selectedTicket.user_id,
      title_en: 'Ticket Update',
      title_ar: 'تحديث التذكرة',
      message_en: `Reply on: ${selectedTicket.subject}`,
      message_ar: `رد على: ${selectedTicket.subject}`,
      type: 'ticket_update',
      metadata: { ticket_id: selectedTicket.id },
    });

    setNewMessage('');
    setSending(false);
    fetchMessages(selectedTicket.id);
    fetchTickets();
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status });
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        title_en: 'Ticket Status Updated',
        title_ar: 'تم تحديث حالة التذكرة',
        message_en: `Your ticket "${ticket.subject}" is now ${status}`,
        message_ar: `تذكرتك "${ticket.subject}" الآن ${statusConfig[status]?.labelAr || status}`,
        type: 'ticket_update',
        metadata: { ticket_id: ticketId },
      });
    }

    toast.success(t('Status updated', 'تم تحديث الحالة'));
    fetchTickets();
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm && !t.subject.toLowerCase().includes(searchTerm.toLowerCase()) && !t.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    return <Badge variant="secondary" className={cn('gap-1', config.color)}><Icon className="h-3 w-3" />{language === 'ar' ? config.labelAr : config.labelEn}</Badge>;
  };

  const priorityBadge = (priority: string) => {
    const colors: Record<string, string> = { low: 'bg-muted text-muted-foreground', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };
    return <Badge variant="secondary" className={colors[priority] || ''}>{t(priority.charAt(0).toUpperCase() + priority.slice(1), priority === 'low' ? 'منخفضة' : priority === 'medium' ? 'متوسطة' : 'عالية')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('Support Tickets', 'تذاكر الدعم')}</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {tickets.filter(t => t.status === 'open').length} {t('Open', 'مفتوح')}
        </Badge>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="ps-9" placeholder={t('Search tickets...', 'البحث في التذاكر...')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Status', 'كل الحالات')}</SelectItem>
            <SelectItem value="open">{t('Open', 'مفتوح')}</SelectItem>
            <SelectItem value="in_progress">{t('In Progress', 'قيد المعالجة')}</SelectItem>
            <SelectItem value="resolved">{t('Resolved', 'تم الحل')}</SelectItem>
            <SelectItem value="closed">{t('Closed', 'مغلق')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tickets table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('Tickets', 'التذاكر')} ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <ScrollArea className="max-h-[550px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Subject', 'الموضوع')}</TableHead>
                  <TableHead>{t('User', 'المستخدم')}</TableHead>
                  <TableHead>{t('Status', 'الحالة')}</TableHead>
                  <TableHead>{t('Actions', 'إجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => (
                  <TableRow
                    key={ticket.id}
                    className={cn("cursor-pointer", selectedTicket?.id === ticket.id && "bg-muted")}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ticket.user_name}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      <Select value={ticket.status} onValueChange={v => updateTicketStatus(ticket.id, v)}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">{t('Open', 'مفتوح')}</SelectItem>
                          <SelectItem value="in_progress">{t('In Progress', 'قيد المعالجة')}</SelectItem>
                          <SelectItem value="resolved">{t('Resolved', 'تم الحل')}</SelectItem>
                          <SelectItem value="closed">{t('Closed', 'مغلق')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTickets.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('No tickets found', 'لا توجد تذاكر')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Chat panel */}
        <Card className="h-[600px] flex flex-col">
          {selectedTicket ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{selectedTicket.user_name} • {priorityBadge(selectedTicket.priority)}</p>
                  </div>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn("flex", msg.is_admin ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.is_admin
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}>
                        {!msg.is_admin && <p className="text-xs font-semibold mb-1 opacity-70">{selectedTicket.user_name}</p>}
                        {msg.is_admin && <p className="text-xs font-semibold mb-1 opacity-70">{t('You (Admin)', 'أنت (المسؤول)')}</p>}
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className={cn("text-[10px] mt-1", msg.is_admin ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex flex-wrap gap-1 mb-2">
                  {(language === 'ar' ? DEFAULT_REPLIES.ar : DEFAULT_REPLIES.en).slice(0, 3).map((msg, i) => (
                    <Button key={i} variant="outline" size="sm" className="text-xs h-auto py-1" onClick={() => setNewMessage(msg)}>
                      {msg.length > 30 ? msg.slice(0, 30) + '...' : msg}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={t('Type a reply...', 'اكتب رداً...')}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  />
                  <Button onClick={sendReply} disabled={sending || !newMessage.trim()} size="icon">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>{t('Select a ticket to reply', 'اختر تذكرة للرد')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminTickets;
