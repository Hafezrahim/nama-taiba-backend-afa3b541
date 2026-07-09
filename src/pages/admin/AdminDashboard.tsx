import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Package, ShoppingBag, Users, MessageSquare, FileText, Settings, 
  TrendingUp, DollarSign, ShoppingCart, UserCheck, Truck, MapPin,
  ArrowUpRight, ArrowDownRight, Sparkles, Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import OrderTrendsChart from '@/components/admin/OrderTrendsChart';
import RecentOrdersWidget from '@/components/admin/RecentOrdersWidget';
import TopProductsChart from '@/components/admin/analytics/TopProductsChart';
import TopClientsWidget from '@/components/admin/analytics/TopClientsWidget';
import QuotationsFollowUpWidget from '@/components/admin/analytics/QuotationsFollowUpWidget';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const { t, language } = useLanguage();

  // Fetch real-time order and revenue statistics
  const { data: orderStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, status, created_at');
      
      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonthOrders = orders?.filter(o => new Date(o.created_at!) >= thisMonth) || [];
      const lastMonthOrders = orders?.filter(o => {
        const date = new Date(o.created_at!);
        return date >= lastMonth && date <= lastMonthEnd;
      }) || [];

      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const revenueChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : thisMonthRevenue > 0 ? '100' : '0';

      const ordersChange = lastMonthOrders.length > 0
        ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100).toFixed(1)
        : thisMonthOrders.length > 0 ? '100' : '0';

      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;
      const completionRate = orders && orders.length > 0 
        ? ((completedOrders / orders.length) * 100).toFixed(1)
        : '0';

      return {
        totalRevenue,
        totalOrders: orders?.length || 0,
        pendingOrders,
        completedOrders,
        revenueChange: Number(revenueChange),
        ordersChange: Number(ordersChange),
        completionRate: Number(completionRate)
      };
    }
  });

  // Fetch active users count
  const { data: usersCount } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch products, projects, offers counts
  const { data: contentCounts, isLoading: isLoadingContent } = useQuery({
    queryKey: ['content-counts'],
    queryFn: async () => {
      const [productsRes, projectsRes, offersRes] = await Promise.all([
        supabase.from('products').select('is_active', { count: 'exact' }),
        supabase.from('projects').select('is_active', { count: 'exact' }),
        supabase.from('offers').select('is_active', { count: 'exact' }),
      ]);

      const products = productsRes.data || [];
      const projects = projectsRes.data || [];
      const offers = offersRes.data || [];

      return {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.is_active).length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.is_active).length,
        totalOffers: offers.length,
        activeOffers: offers.filter(o => o.is_active).length,
      };
    }
  });

  // Fetch shipping summary by city
  const { data: shippingSummary, isLoading: isLoadingShipping } = useQuery({
    queryKey: ['shipping-summary'],
    queryFn: async () => {
      const { data: cities, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (citiesError) throw citiesError;

      const { data: districts, error: districtsError } = await supabase
        .from('districts')
        .select('*')
        .eq('is_active', true);
      
      if (districtsError) throw districtsError;

      return cities?.map(city => {
        const cityDistricts = districts?.filter(d => d.city_id === city.id) || [];
        const prices = cityDistricts.map(d => d.shipping_price);
        return {
          id: city.id,
          name_ar: city.name_ar,
          name_en: city.name_en,
          districtsCount: cityDistricts.length,
          minPrice: prices.length > 0 ? Math.min(...prices) : 0,
          maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
          avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
        };
      }) || [];
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const adminSections = [
    {
      title: t('Products Management', 'إدارة المنتجات'),
      description: t('Manage products, categories, and inventory', 'إدارة المنتجات والفئات والمخزون'),
      icon: Package,
      link: '/admin/products',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: t('Orders Management', 'إدارة الطلبات'),
      description: t('View and manage customer orders', 'عرض وإدارة طلبات العملاء'),
      icon: ShoppingBag,
      link: '/admin/orders',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: t('Users & Roles', 'المستخدمين والصلاحيات'),
      description: t('Manage users and permissions', 'إدارة المستخدمين والصلاحيات'),
      icon: Users,
      link: '/admin/users',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      title: t('Contact Submissions', 'رسائل التواصل'),
      description: t('View contact form submissions', 'عرض رسائل نموذج التواصل'),
      icon: MessageSquare,
      link: '/admin/contacts',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      title: t('Content Management', 'إدارة المحتوى'),
      description: t('Manage blogs, offers, and projects', 'إدارة المدونات والعروض والمشاريع'),
      icon: FileText,
      link: '/admin/blogs',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      title: t('Settings', 'الإعدادات'),
      description: t('System configuration and settings', 'إعدادات وتكوين النظام'),
      icon: Settings,
      link: '/admin/settings',
      gradient: 'from-slate-500 to-zinc-500'
    }
  ];

  // Quick stats cards with real data
  const statsCards = [
    {
      title: t('Total Revenue', 'إجمالي الإيرادات'),
      value: isLoadingStats ? null : formatCurrency(orderStats?.totalRevenue || 0),
      change: isLoadingStats ? null : orderStats?.revenueChange || 0,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-500/10 to-green-600/5'
    },
    {
      title: t('Total Orders', 'إجمالي الطلبات'),
      value: isLoadingStats ? null : (orderStats?.totalOrders || 0).toLocaleString(),
      change: isLoadingStats ? null : orderStats?.ordersChange || 0,
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-500/10 to-cyan-600/5'
    },
    {
      title: t('Active Users', 'المستخدمين النشطين'),
      value: (usersCount || 0).toLocaleString(),
      change: null,
      icon: UserCheck,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'from-violet-500/10 to-purple-600/5'
    },
    {
      title: t('Pending Orders', 'الطلبات المعلقة'),
      value: isLoadingStats ? null : (orderStats?.pendingOrders || 0).toLocaleString(),
      change: null,
      subtitle: isLoadingStats ? null : `${orderStats?.completionRate || 0}% ${t('completed', 'مكتمل')}`,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-500/10 to-orange-600/5'
    }
  ];

  const totalDistricts = shippingSummary?.reduce((sum, city) => sum + city.districtsCount, 0) || 0;
  const totalCities = shippingSummary?.length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 lg:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">{t('Welcome back', 'مرحباً بعودتك')}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            {t('Admin Dashboard', 'لوحة الإدارة')}
          </h2>
          <p className="opacity-80 max-w-xl">
            {t('Manage your website content, track orders, and monitor your business performance from here.', 'إدارة محتوى موقعك وتتبع الطلبات ومراقبة أداء عملك من هنا.')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statsCards.map((stat, idx) => (
          <Card 
            key={idx} 
            className={cn(
              "relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
              `bg-gradient-to-br ${stat.bgGradient}`
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium text-foreground/70">
                  {stat.title}
                </CardDescription>
                <div className={cn(
                  "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                  stat.gradient
                )}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-8 w-24 mb-1" />
              ) : (
                <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
              )}
              {stat.change !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium mt-1",
                  stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {stat.change >= 0 ? '+' : ''}{stat.change}% {t('vs last month', 'مقارنة بالشهر الماضي')}
                </div>
              )}
              {stat.subtitle && (
                <div className="text-sm text-muted-foreground mt-1">{stat.subtitle}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <Link to="/admin/products">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500/10 to-blue-600/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium text-foreground/70">{t('Products', 'المنتجات')}</CardDescription>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingContent ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl lg:text-3xl font-bold text-foreground">{contentCounts?.totalProducts || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {contentCounts?.activeProducts || 0} {t('active', 'نشط')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/projects">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-rose-500/10 to-pink-600/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium text-foreground/70">{t('Projects', 'المشاريع')}</CardDescription>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingContent ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl lg:text-3xl font-bold text-foreground">{contentCounts?.totalProjects || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {contentCounts?.activeProjects || 0} {t('active', 'نشط')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin/offers">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500/10 to-yellow-600/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium text-foreground/70">{t('Offers', 'العروض')}</CardDescription>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingContent ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl lg:text-3xl font-bold text-foreground">{contentCounts?.totalOffers || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {contentCounts?.activeOffers || 0} {t('active', 'نشط')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Analytics Grid row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <OrderTrendsChart />
        <TopProductsChart />
      </div>

      {/* Analytics Grid row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersWidget language={language} t={t} formatCurrency={formatCurrency} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4 lg:gap-6">
          <div className="flex-1">
            <TopClientsWidget />
          </div>
          <div className="flex-1">
            <QuotationsFollowUpWidget />
          </div>
        </div>
      </div>

      {/* Shipping Summary Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('Shipping Summary', 'ملخص الشحن')}</CardTitle>
                <CardDescription className="mt-1">
                  {t('Overview of shipping prices by city', 'نظرة عامة على أسعار الشحن حسب المدينة')}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center px-4 py-2 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{totalCities}</div>
                <div className="text-xs text-muted-foreground font-medium">{t('Cities', 'مدن')}</div>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{totalDistricts}</div>
                <div className="text-xs text-muted-foreground font-medium">{t('Districts', 'أحياء')}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingShipping ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[50px] font-semibold">#</TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t('City', 'المدينة')}
                      </div>
                    </TableHead>
                    <TableHead className="text-center font-semibold">{t('Districts', 'الأحياء')}</TableHead>
                    <TableHead className="text-center font-semibold">{t('Min Price', 'أقل سعر')}</TableHead>
                    <TableHead className="text-center font-semibold">{t('Max Price', 'أعلى سعر')}</TableHead>
                    <TableHead className="text-center font-semibold">{t('Avg Price', 'متوسط السعر')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingSummary?.map((city, idx) => (
                    <TableRow key={city.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">
                        {language === 'ar' ? city.name_ar : city.name_en}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                          {city.districtsCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {city.minPrice.toFixed(0)} {t('SAR', 'ر.س')}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {city.maxPrice.toFixed(0)} {t('SAR', 'ر.س')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-primary">
                          {city.avgPrice.toFixed(0)} {t('SAR', 'ر.س')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Link to="/admin/districts">
              <Button variant="outline" size="sm" className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all">
                {t('Manage Districts', 'إدارة الأحياء')}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <h3 className="text-xl font-bold">{t('Quick Actions', 'إجراءات سريعة')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {adminSections.map((section) => (
            <Link key={section.link} to={section.link}>
              <Card className="group h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110",
                    section.gradient
                  )}>
                    <section.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
                    {t('Manage', 'إدارة')}
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
