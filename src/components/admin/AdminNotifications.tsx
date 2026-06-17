import { useState, useEffect } from 'react';
import { Bell, ShoppingBag, MessageSquare, FileText, X, Check, Database, Star, ThumbsUp, ThumbsDown, TicketCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'order' | 'contact' | 'quote' | 'backup' | 'review' | 'ticket' | 'new_client';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

export function AdminNotifications() {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
  }, [language]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders' 
      }, (payload) => {
        const order = payload.new as any;
        addNotification({
          id: `order-${order.id}`,
          type: 'order',
          title: t('New Order', 'طلب جديد'),
          message: `${order.customer_name} - ${order.total} ${t('SAR', 'ر.س')}`,
          time: new Date(),
          read: false
        });
      })
      .subscribe();

    // Subscribe to new contact submissions
    const contactsChannel = supabase
      .channel('contacts-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'contact_submissions' 
      }, (payload) => {
        const contact = payload.new as any;
        addNotification({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: t('New Message', 'رسالة جديدة'),
          message: contact.name,
          time: new Date(),
          read: false
        });
      })
      .subscribe();

    // Subscribe to new quote requests
    const quotesChannel = supabase
      .channel('quotes-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'quote_requests' 
      }, (payload) => {
        const quote = payload.new as any;
        addNotification({
          id: `quote-${quote.id}`,
          type: 'quote',
          title: t('New Quote Request', 'طلب عرض سعر جديد'),
          message: quote.name,
          time: new Date(),
          read: false
        });
      })
      .subscribe();

    // Subscribe to backup completions
    const backupsChannel = supabase
      .channel('backups-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'backups'
      }, (payload) => {
        const backup = payload.new as any;
        if (backup.status === 'completed') {
          addNotification({
            id: `backup-${backup.id}`,
            type: 'backup',
            title: t('Backup Complete', 'اكتمل النسخ الاحتياطي'),
            message: `${backup.total_records} ${t('records saved', 'سجل تم حفظه')}`,
            time: new Date(),
            read: false
          });
        }
      })
      .subscribe();

    // Subscribe to new testimonial/review submissions
    const reviewsChannel = supabase
      .channel('testimonials-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'testimonials'
      }, (payload) => {
        const review = payload.new as any;
        if (!review.is_approved) {
          addNotification({
            id: `review-${review.id}`,
            type: 'review',
            title: t('New Review', 'مراجعة جديدة'),
            message: `${review.name_en || review.name_ar} - ${review.rating}/5 ⭐`,
            time: new Date(),
            read: false
          });
        }
      })
      .subscribe();

    // Subscribe to new support tickets
    const ticketsChannel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets'
      }, (payload) => {
        const ticket = payload.new as any;
        addNotification({
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          title: t('New Support Ticket', 'تذكرة دعم جديدة'),
          message: ticket.subject,
          time: new Date(),
          read: false
        });
      })
      .subscribe();

    // Subscribe to new ticket messages (from clients only)
    const ticketMsgsChannel = supabase
      .channel('ticket-msgs-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages'
      }, (payload) => {
        const msg = payload.new as any;
        if (!msg.is_admin) {
          addNotification({
            id: `ticket-msg-${msg.id}`,
            type: 'ticket',
            title: t('New Ticket Reply', 'رد جديد على تذكرة'),
            message: msg.message?.slice(0, 50) + (msg.message?.length > 50 ? '...' : ''),
            time: new Date(),
            read: false
          });
        }
      })
      .subscribe();

    // Subscribe to new user signups
    const newUsersChannel = supabase
      .channel('new-users-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_roles'
      }, (payload) => {
        const role = payload.new as any;
        addNotification({
          id: `user-${role.id}`,
          type: 'new_client',
          title: t('New User Registered', 'مستخدم جديد'),
          message: `${t('Role', 'الدور')}: ${role.role}`,
          time: new Date(),
          read: false
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(quotesChannel);
      supabase.removeChannel(backupsChannel);
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(ticketMsgsChannel);
      supabase.removeChannel(newUsersChannel);
    };
  }, [t]);

  const fetchNotifications = async () => {
    try {
      // Fetch recent unprocessed items
      const [ordersRes, contactsRes, quotesRes, reviewsRes, ticketsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, customer_name, total, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('contact_submissions')
          .select('id, name, created_at')
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('quote_requests')
          .select('id, name, created_at')
          .eq('is_processed', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('testimonials')
          .select('id, name_en, name_ar, rating, created_at')
          .eq('is_approved', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('support_tickets')
          .select('id, subject, created_at, status')
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const allNotifications: Notification[] = [];

      ordersRes.data?.forEach(order => {
        allNotifications.push({
          id: `order-${order.id}`,
          type: 'order',
          title: t('Pending Order', 'طلب معلق'),
          message: `${order.customer_name} - ${order.total} ${t('SAR', 'ر.س')}`,
          time: new Date(order.created_at!),
          read: false
        });
      });

      contactsRes.data?.forEach(contact => {
        allNotifications.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: t('Unread Message', 'رسالة غير مقروءة'),
          message: contact.name,
          time: new Date(contact.created_at!),
          read: false
        });
      });

      quotesRes.data?.forEach(quote => {
        allNotifications.push({
          id: `quote-${quote.id}`,
          type: 'quote',
          title: t('Quote Request', 'طلب عرض سعر'),
          message: quote.name,
          time: new Date(quote.created_at!),
          read: false
        });
      });

      reviewsRes.data?.forEach(review => {
        allNotifications.push({
          id: `review-${review.id}`,
          type: 'review',
          title: t('Pending Review', 'مراجعة معلقة'),
          message: `${review.name_en || review.name_ar} - ${review.rating}/5 ⭐`,
          time: new Date(review.created_at!),
          read: false
        });
      });

      ticketsRes.data?.forEach(ticket => {
        allNotifications.push({
          id: `ticket-${ticket.id}`,
          type: 'ticket',
          title: t('Open Ticket', 'تذكرة مفتوحة'),
          message: ticket.subject,
          time: new Date(ticket.created_at!),
          read: false
        });
      });

      // Sort by time, newest first
      allNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());

      setNotifications(allNotifications.slice(0, 10));
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10));
    setUnreadCount(prev => prev + 1);
  };

  const handleReviewAction = async (notificationId: string, action: 'approve' | 'reject') => {
    const reviewId = notificationId.replace('review-', '');
    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('testimonials')
          .update({ is_approved: true })
          .eq('id', reviewId);
        if (error) throw error;
        toast.success(t('Review approved', 'تمت الموافقة على المراجعة'));
      } else {
        const { error } = await supabase
          .from('testimonials')
          .delete()
          .eq('id', reviewId);
        if (error) throw error;
        toast.success(t('Review rejected', 'تم رفض المراجعة'));
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error handling review:', error);
      toast.error(t('Action failed', 'فشل الإجراء'));
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order': return <ShoppingBag className="h-4 w-4" />;
      case 'contact': return <MessageSquare className="h-4 w-4" />;
      case 'quote': return <FileText className="h-4 w-4" />;
      case 'backup': return <Database className="h-4 w-4" />;
      case 'review': return <Star className="h-4 w-4" />;
      case 'ticket': return <TicketCheck className="h-4 w-4" />;
      case 'new_client': return <UserPlus className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'order': return 'bg-emerald-100 text-emerald-600';
      case 'contact': return 'bg-blue-100 text-blue-600';
      case 'quote': return 'bg-amber-100 text-amber-600';
      case 'backup': return 'bg-purple-100 text-purple-600';
      case 'review': return 'bg-orange-100 text-orange-600';
      case 'ticket': return 'bg-indigo-100 text-indigo-600';
      case 'new_client': return 'bg-teal-100 text-teal-600';
    }
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -end-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">{t('Notifications', 'الإشعارات')}</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 gap-1"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3" />
              {t('Mark all read', 'قراءة الكل')}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{t('No notifications', 'لا توجد إشعارات')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors hover:bg-muted/50",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("p-2 rounded-lg shrink-0", getIconColor(notification.type))}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTime(notification.time)}</p>
                    {notification.type === 'review' && !notification.read && (
                      <div className="flex gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs gap-1 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleReviewAction(notification.id, 'approve')}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {t('Approve', 'موافقة')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs gap-1 text-destructive hover:bg-destructive/10"
                          onClick={() => handleReviewAction(notification.id, 'reject')}
                        >
                          <ThumbsDown className="h-3 w-3" />
                          {t('Reject', 'رفض')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
