import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, Package, Eye, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  product_id: string | null;
  quantity: number | null;
  is_processed: boolean | null;
  created_at: string | null;
}

export default function MarketerDashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const marketerTag = `marketer:${user?.id}`;

  const { data, isLoading } = useQuery({
    queryKey: ['marketer-dashboard', user?.id],
    queryFn: async () => {
      const { data: quotes } = await supabase
        .from('quote_requests')
        .select('id, name, email, phone, product_id, quantity, is_processed, created_at')
        .eq('company', marketerTag)
        .order('created_at', { ascending: false });

      const leads = (quotes || []) as Lead[];
      const productIds = Array.from(
        new Set(leads.map((l) => l.product_id).filter(Boolean) as string[])
      );

      let productNames: Record<string, string> = {};
      if (productIds.length) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name_en, name_ar')
          .in('id', productIds);
        productNames = Object.fromEntries(
          (products || []).map((p: any) => [p.id, isRTL ? p.name_ar || p.name_en : p.name_en || p.name_ar])
        );
      }

      // Product inquiries aggregated by product
      const inquiryCounts = new Map<string, number>();
      leads.forEach((l) => {
        if (l.product_id) inquiryCounts.set(l.product_id, (inquiryCounts.get(l.product_id) || 0) + 1);
      });
      const productInquiries = Array.from(inquiryCounts.entries())
        .map(([id, count]) => ({ id, count, name: productNames[id] || t('Unknown product', 'منتج غير معروف') }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const { data: blogs } = await supabase
        .from('blogs')
        .select('id, slug, title_en, title_ar, views_count')
        .eq('is_published', true)
        .order('views_count', { ascending: false })
        .limit(5);

      const blogViews = (blogs || []).reduce((sum: number, b: any) => sum + (b.views_count || 0), 0);

      return {
        leads,
        totalQuotes: leads.length,
        pendingQuotes: leads.filter((l) => !l.is_processed).length,
        confirmedQuotes: leads.filter((l) => l.is_processed).length,
        productInquiries,
        totalProductInquiries: leads.filter((l) => l.product_id).length,
        blogs: blogs || [],
        blogViews,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('Dashboard', 'لوحة القيادة')}</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: t('Total Leads', 'إجمالي العملاء المحتملين'), value: data.totalQuotes, icon: Users, color: 'text-primary' },
    { label: t('Waiting for Reply', 'بانتظار الرد'), value: data.pendingQuotes, icon: Clock, color: 'text-yellow-500' },
    { label: t('Confirmed', 'المؤكدة'), value: data.confirmedQuotes, icon: CheckCircle, color: 'text-green-500' },
    { label: t('Product Inquiries', 'استفسارات المنتجات'), value: data.totalProductInquiries, icon: Package, color: 'text-blue-500' },
    { label: t('Blog Views', 'مشاهدات المدونة'), value: data.blogViews, icon: Eye, color: 'text-purple-500' },
    { label: t('Quotations', 'عروض الأسعار'), value: data.totalQuotes, icon: FileText, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">{t('Marketer Dashboard', 'لوحة تحكم المسوق')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Recent Leads', 'أحدث العملاء المحتملين')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.leads.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('No leads yet.', 'لا يوجد عملاء محتملون بعد.')}</p>
            )}
            {data.leads.slice(0, 6).map((lead) => (
              <Link
                key={lead.id}
                to={`/marketer/quotations`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{lead.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    lead.is_processed
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                  }`}
                >
                  {lead.is_processed ? t('Confirmed', 'مؤكد') : t('Pending', 'قيد الانتظار')}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Product inquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('Top Product Inquiries', 'أكثر المنتجات استفساراً')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.productInquiries.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('No product inquiries yet.', 'لا توجد استفسارات منتجات بعد.')}</p>
            )}
            {data.productInquiries.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                  {p.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Blog traffic */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('Blog Traffic', 'حركة المدونة')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.blogs.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('No published posts yet.', 'لا توجد مقالات منشورة بعد.')}</p>
          )}
          {data.blogs.map((b: any) => (
            <Link
              key={b.id}
              to={`/blog/${b.slug || b.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <span className="truncate text-sm font-medium">{isRTL ? b.title_ar : b.title_en}</span>
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                {b.views_count || 0}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
