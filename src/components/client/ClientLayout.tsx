import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, ShoppingBag, MessageCircle, User, LogOut, FileText, ClipboardList } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

const ProfileCard = ({ user, t }: { user: any; t: (en: string, ar: string) => string }) => {
  const { data: profile } = useQuery({
    queryKey: ['client-sidebar-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name_en, full_name_ar')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const displayName = profile?.full_name_en || profile?.full_name_ar || user.email?.split('@')[0];

  return (
    <div className="p-6 border-b bg-primary/5 text-center">
      <div className="relative w-20 h-20 mx-auto mb-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md border-2 border-primary/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold ring-4 ring-white shadow-md">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h2 className="font-semibold truncate">{displayName}</h2>
      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
    </div>
  );
};

export const ClientLayout = () => {
  const { user, loading } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const links = [
    { nameEn: 'Dashboard', nameAr: 'لوحة القيادة', icon: LayoutDashboard, path: '/client' },
    { nameEn: 'My Orders', nameAr: 'طلباتي', icon: ShoppingBag, path: '/client/orders' },
    { nameEn: 'Request a Quote', nameAr: 'طلب عرض سعر', icon: FileText, path: '/client/quote' },
    { nameEn: 'My Quotes', nameAr: 'عروض أسعاري', icon: ClipboardList, path: '/client/quotes' },
    { nameEn: 'Support Tickets', nameAr: 'تذاكر الدعم', icon: MessageCircle, path: '/client/tickets' },
    { nameEn: 'Profile Settings', nameAr: 'إعدادات الحساب', icon: User, path: '/client/profile' },
  ];

  return (
    <div className={cn("min-h-screen flex flex-col bg-muted/30", isRTL ? "rtl" : "ltr")} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row gap-8 mt-12 md:mt-20">

          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white dark:bg-card rounded-xl border shadow-sm overflow-hidden sticky top-32">
              <ProfileCard user={user} t={t} />

              <nav className="p-3 space-y-1">
                {links.map((link) => {
                  const isActive =
                    location.pathname === link.path ||
                    (link.path !== '/client' && location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <link.icon className={cn('h-4 w-4', isActive ? 'opacity-100' : 'opacity-70')} />
                      {isRTL ? link.nameAr : link.nameEn}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t">
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t('Logout', 'تسجيل الخروج')}
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
