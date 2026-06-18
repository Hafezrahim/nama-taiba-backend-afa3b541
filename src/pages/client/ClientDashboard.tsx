import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    openTickets: 0,
    resolvedTickets: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [ordersRes, ticketsRes] = await Promise.all([
        supabase.from('orders').select('status').eq('user_id', user.id),
        supabase.from('support_tickets').select('status').eq('user_id', user.id),
      ]);

      const orders = ordersRes.data || [];
      const tickets = ticketsRes.data || [];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => ['pending', 'processing'].includes(o.status)).length,
        openTickets: tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('Dashboard Overview', 'نظرة عامة على لوحة القيادة')}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('Total Orders', 'إجمالي الطلبات')}</p>
              <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('Pending Orders', 'طلبات قيد الانتظار')}</p>
              <h3 className="text-2xl font-bold">{stats.pendingOrders}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('Open Tickets', 'تذاكر مفتوحة')}</p>
              <h3 className="text-2xl font-bold">{stats.openTickets}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('Resolved Tickets', 'تذاكر محلولة')}</p>
              <h3 className="text-2xl font-bold">{stats.resolvedTickets}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('View Your Orders', 'عرض طلباتك')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('Track the status of your recent orders and view order history.', 'تتبع حالة طلباتك الأخيرة وعرض سجل الطلبات.')}
            </p>
            <Link to="/client/orders" className="text-primary hover:underline font-medium">
              {t('Go to Orders →', 'الذهاب للطلبات ←')}
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('Need Help?', 'تحتاج مساعدة؟')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('Open a support ticket and our team will get back to you shortly.', 'افتح تذكرة دعم وسيقوم فريقنا بالرد عليك قريباً.')}
            </p>
            <Link to="/client/tickets" className="text-primary hover:underline font-medium">
              {t('Go to Support →', 'الذهاب للدعم ←')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
