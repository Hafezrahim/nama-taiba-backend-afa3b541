import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminSearch } from './AdminSearch';
import { AdminNotifications } from './AdminNotifications';
import { AdminLanguageSwitch } from './AdminLanguageSwitch';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LogOut, Home, ChevronRight, Keyboard, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Map routes to breadcrumb labels
const routeLabels: Record<string, { en: string; ar: string }> = {
  '/admin': { en: 'Dashboard', ar: 'لوحة التحكم' },
  '/admin/products': { en: 'Products', ar: 'المنتجات' },
  '/admin/categories': { en: 'Categories', ar: 'الفئات' },
  '/admin/orders': { en: 'Orders', ar: 'الطلبات' },
  '/admin/offers': { en: 'Offers', ar: 'العروض' },
  '/admin/users': { en: 'Users', ar: 'المستخدمين' },
  '/admin/roles': { en: 'Roles & Permissions', ar: 'الأدوار والصلاحيات' },
  '/admin/blogs': { en: 'Blogs', ar: 'المدونات' },
  '/admin/projects': { en: 'Projects', ar: 'المشاريع' },
  '/admin/services': { en: 'Services', ar: 'الخدمات' },
  '/admin/testimonials': { en: 'Testimonials', ar: 'الشهادات' },
  '/admin/about': { en: 'About Info', ar: 'معلومات عنا' },
  '/admin/team': { en: 'Team Members', ar: 'أعضاء الفريق' },
  '/admin/certifications': { en: 'Certifications', ar: 'الشهادات' },
  '/admin/partners': { en: 'Partners', ar: 'الشركاء' },
  '/admin/contacts': { en: 'Contact Submissions', ar: 'رسائل التواصل' },
  '/admin/quotes': { en: 'Quote Requests', ar: 'طلبات الأسعار' },
  '/admin/marketers': { en: 'Marketer Applications', ar: 'طلبات المسوقين' },
  '/admin/cities': { en: 'Cities', ar: 'المدن' },
  '/admin/districts': { en: 'Districts & Shipping', ar: 'الأحياء والشحن' },
  '/admin/settings': { en: 'Settings', ar: 'الإعدادات' },
  '/admin/backup': { en: 'Backup & Restore', ar: 'النسخ الاحتياطي والاستعادة' },
  '/admin/slider': { en: 'Slider', ar: 'الشريط المتحرك' },
  '/admin/chatbot': { en: 'Chatbot FAQs', ar: 'أسئلة الشات بوت' },
  '/admin/tickets': { en: 'Support Tickets', ar: 'تذاكر الدعم' },
  '/admin/deliverers': { en: 'Deliverers', ar: 'المناديب' },
  '/admin/deliverers/:id': { en: 'Deliverer Details', ar: 'تفاصيل المندوب' },
  '/admin/shipments': { en: 'Shipments', ar: 'الشحنات' },
  '/admin/security': { en: 'Security', ar: 'الأمان' },
};

export function AdminLayout() {
  const { isAdmin, loading, signOut, allowedPages, isApproved } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Check if user has access: admin has full access, others need page permissions
  const hasAdminAccess = isAdmin || (isApproved && allowedPages.length > 0);

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => {
      const searchInput = document.querySelector('[data-admin-search]') as HTMLInputElement;
      searchInput?.focus();
    }, 100);
  }, []);

  const handleHelpOpen = useCallback(() => {
    setHelpOpen(true);
  }, []);

  useKeyboardShortcuts(handleSearchOpen, handleHelpOpen);

  // Check if current page is allowed for non-admin users
  const currentPath = location.pathname;
  
  // For admins, /admin is the dashboard. For staff, they will be redirected by the useEffect above.
  const isDashboardRoot = currentPath === '/admin' || currentPath === '/admin/';

  useEffect(() => {
    if (!loading && !hasAdminAccess) {
      navigate('/login');
    } else if (!loading && !isAdmin && isDashboardRoot && allowedPages.length > 0) {
      navigate(allowedPages[0], { replace: true });
    }
  }, [hasAdminAccess, loading, navigate, isAdmin, isDashboardRoot, allowedPages]);

  const isPageAllowed = isAdmin || isDashboardRoot || allowedPages.some(page => {
    if (page === '/admin') return isDashboardRoot;
    return currentPath.startsWith(page);
  });


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">
            {t('Loading...', 'جاري التحميل...')}
          </p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) return null;

  const currentLabel = routeLabels[currentPath] || { en: 'Admin', ar: 'الإدارة' };

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen flex w-full bg-muted/30", isRTL ? 'rtl' : 'ltr')}>
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="shrink-0 hover:bg-muted transition-colors rounded-lg" />
            
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                {t('Admin', 'الإدارة')}
              </Link>
              {currentPath !== '/admin' && (
                <>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {language === 'ar' ? currentLabel.ar : currentLabel.en}
                  </span>
                </>
              )}
            </div>

            <AdminSearch />

            <div className="flex items-center gap-1 sm:gap-2 ms-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)} className="hidden sm:flex">
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('Keyboard Shortcuts (Ctrl+/)', 'اختصارات لوحة المفاتيح (Ctrl+/)')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <AdminNotifications />
              <AdminLanguageSwitch />

              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2 hidden sm:flex hover:bg-primary hover:text-primary-foreground transition-all">
                  <Home className="h-4 w-4" />
                  {t('View Site', 'عرض الموقع')}
                </Button>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>

              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('Sign Out', 'خروج')}</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <div className="max-w-[1600px] mx-auto animate-fade-in">
              {isPageAllowed ? (
                <Outlet />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <ShieldAlert className="h-16 w-16 text-destructive" />
                  <h2 className="text-2xl font-bold">{t('Access Denied', 'الوصول مرفوض')}</h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    {t('You do not have permission to access this page. Contact your administrator.', 
                       'ليس لديك صلاحية للوصول إلى هذه الصفحة. تواصل مع المسؤول.')}
                  </p>
                  <Button onClick={() => navigate('/admin')} variant="outline">
                    {t('Go to Dashboard', 'الذهاب للوحة التحكم')}
                  </Button>
                </div>
              )}
            </div>
          </main>
        </div>

        <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
      </div>
    </SidebarProvider>
  );
}
