import { useState, useMemo } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, FileText, Settings, Tag, FolderOpen, Newspaper, Gift, Award, Handshake, Globe, ChevronRight, ChevronDown, UserCog, MapPin, Building2, DatabaseBackup, Bot, Truck, PackageCheck, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [{
  group: 'Overview',
  groupAr: 'نظرة عامة',
  icon: LayoutDashboard,
  items: [{
    title: 'Dashboard',
    titleAr: 'لوحة التحكم',
    url: '/admin',
    icon: LayoutDashboard
  }]
}, {
  group: 'E-Commerce',
  groupAr: 'التجارة الإلكترونية',
  icon: ShoppingBag,
  items: [{
    title: 'Products',
    titleAr: 'المنتجات',
    url: '/admin/products',
    icon: Package
  }, {
    title: 'Categories',
    titleAr: 'الفئات',
    url: '/admin/categories',
    icon: Tag
  }, {
    title: 'Orders',
    titleAr: 'الطلبات',
    url: '/admin/orders',
    icon: ShoppingBag
  }, {
    title: 'Offers',
    titleAr: 'العروض',
    url: '/admin/offers',
    icon: Gift
  }]
}, {
  group: 'User Management',
  groupAr: 'إدارة المستخدمين',
  icon: Users,
  items: [{
    title: 'Users',
    titleAr: 'المستخدمين',
    url: '/admin/users',
    icon: Users
  }, {
    title: 'Roles & Permissions',
    titleAr: 'الأدوار والصلاحيات',
    url: '/admin/roles',
    icon: UserCog
  }]
}, {
  group: 'Content',
  groupAr: 'المحتوى',
  icon: FileText,
  items: [{
    title: 'Blogs',
    titleAr: 'المدونات',
    url: '/admin/blogs',
    icon: Newspaper
  }, {
    title: 'Projects',
    titleAr: 'المشاريع',
    url: '/admin/projects',
    icon: FolderOpen
  }, {
    title: 'Services',
    titleAr: 'الخدمات',
    url: '/admin/services',
    icon: Globe
  }, {
    title: 'Testimonials',
    titleAr: 'الشهادات',
    url: '/admin/testimonials',
    icon: MessageSquare
  }]
}, {
  group: 'Company',
  groupAr: 'الشركة',
  icon: Award,
  items: [{
    title: 'About Info',
    titleAr: 'معلومات عنا',
    url: '/admin/about',
    icon: FileText
  }, {
    title: 'Team Members',
    titleAr: 'أعضاء الفريق',
    url: '/admin/team',
    icon: Users
  }, {
    title: 'Certifications',
    titleAr: 'الشهادات',
    url: '/admin/certifications',
    icon: Award
  }, {
    title: 'Partners',
    titleAr: 'الشركاء',
    url: '/admin/partners',
    icon: Handshake
  }, {
    title: 'Quality',
    titleAr: 'الجودة',
    url: '/admin/quality',
    icon: Shield
  }]
}, {
  group: 'Communications',
  groupAr: 'الاتصالات',
  icon: MessageSquare,
  items: [{
    title: 'Contact Submissions',
    titleAr: 'رسائل التواصل',
    url: '/admin/contacts',
    icon: MessageSquare
  }, {
    title: 'Quote Requests',
    titleAr: 'طلبات عروض الأسعار',
    url: '/admin/quotes',
    icon: FileText
  }, {
    title: 'Marketer Applications',
    titleAr: 'طلبات المسوقين',
    url: '/admin/marketers',
    icon: Users
  }, {
    title: 'Chatbot FAQs',
    titleAr: 'أسئلة الشات بوت',
    url: '/admin/chatbot',
    icon: Bot
  }, {
    title: 'Support Tickets',
    titleAr: 'تذاكر الدعم',
    url: '/admin/tickets',
    icon: MessageSquare
  }]
}, {
  group: 'Logistics',
  groupAr: 'اللوجستيات',
  icon: MapPin,
  items: [{
    title: 'Map Locations',
    titleAr: 'مواقع الخريطة',
    url: '/admin/map-locations',
    icon: MapPin
  }, {
    title: 'Cities',
    titleAr: 'المدن',
    url: '/admin/cities',
    icon: MapPin
  }, {
    title: 'Districts & Shipping',
    titleAr: 'الأحياء والشحن',
    url: '/admin/districts',
    icon: Building2
  }, {
    title: 'Deliverers',
    titleAr: 'المناديب',
    url: '/admin/deliverers',
    icon: Truck
  }, {
    title: 'Shipments',
    titleAr: 'الشحنات',
    url: '/admin/shipments',
    icon: PackageCheck
  }]
}, {
  group: 'System',
  groupAr: 'النظام',
  icon: Settings,
  items: [{
    title: 'Settings',
    titleAr: 'الإعدادات',
    url: '/admin/settings',
    icon: Settings
  }, {
    title: 'SEO & Analytics',
    titleAr: 'السيو والتحليلات',
    url: '/admin/seo',
    icon: Globe
  }, {
    title: 'Backup & Restore',
    titleAr: 'النسخ الاحتياطي',
    url: '/admin/backup',
    icon: DatabaseBackup
  }, {
    title: 'Security',
    titleAr: 'الأمان',
    url: '/admin/security',
    icon: Shield
  }]
}];
export function AdminSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const {
    isRTL
  } = useLanguage();
  const { isAdmin, allowedPages } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  // Fetch counts for badges
  const { data: counts } = useQuery({
    queryKey: ['adminSidebarCounts'],
    queryFn: async () => {
      const [
        orders,
        quotes,
        contacts,
        tickets,
        marketers,
        security,
        shipments
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('is_processed', false),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('marketer_applications').select('*', { count: 'exact', head: true }).eq('is_processed', false),
        supabase.from('security_events').select('*', { count: 'exact', head: true }).eq('resolved', false),
        supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      return {
        '/admin/orders': orders.count || 0,
        '/admin/quotes': quotes.count || 0,
        '/admin/contacts': contacts.count || 0,
        '/admin/tickets': tickets.count || 0,
        '/admin/marketers': marketers.count || 0,
        '/admin/security': security.count || 0,
        '/admin/shipments': shipments.count || 0,
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Filter menu items based on permissions (admins see everything)
  const filteredMenuItems = useMemo(() => {
    if (isAdmin) return menuItems.map(g => ({ ...g, isFlat: false }));
    
    // For staff, create a single flat list without the Dashboard
    const allAllowedItems = menuItems
      .flatMap(g => g.items)
      .filter(item => item.url !== '/admin' && allowedPages.includes(item.url));
      
    return [
      {
        group: 'Assigned Modules',
        groupAr: 'الوحدات المخصصة',
        icon: LayoutDashboard,
        items: allAllowedItems,
        isFlat: true
      }
    ];
  }, [isAdmin, allowedPages]);

  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const activeGroup = filteredMenuItems.find(group => group.items.some(item => item.url === '/admin' ? currentPath === '/admin' : currentPath.startsWith(item.url)));
    return activeGroup ? [activeGroup.group] : (filteredMenuItems[0] ? [filteredMenuItems[0].group] : []);
  });
  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };
  const isGroupActive = (group: typeof menuItems[0]) => {
    return group.items.some(item => isActive(item.url));
  };
  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
  };
  return <Sidebar className={cn("border-r border-sidebar-border transition-all duration-300 bg-sidebar-background", collapsed ? 'w-[68px]' : 'w-[260px]', isRTL && 'text-right')} collapsible="icon" side={isRTL ? 'right' : 'left'}>
      {/* Logo Section */}
      <div className={cn("flex flex-col items-center border-b border-sidebar-border px-4 py-4 bg-gradient-to-r from-sidebar-background to-sidebar-accent/30 bg-indigo-950", collapsed ? "justify-center" : "gap-1")}>
        <img src="/uploads/logo.png" alt="Nama Steel Logo" className={cn("object-contain shrink-0 drop-shadow-md transition-all", collapsed ? "w-10 h-10" : "w-32 h-16")} />
        {!collapsed && <span className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase text-white">Admin Panel</span>}
      </div>

      <ScrollArea className="flex-1">
        <SidebarContent className="py-4 px-3">
          {filteredMenuItems.map(group => {
          const isOpen = openGroups.includes(group.group);
          const groupActive = isGroupActive(group);
          return <SidebarGroup key={group.group} className="mb-1">
                {collapsed ?
            // Collapsed view - show only icons
            <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map(item => {
                        const badgeCount = counts?.[item.url as keyof typeof counts] || 0;
                        return (
                          <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton asChild isActive={isActive(item.url)}>
                              <NavLink to={item.url} end={item.url === '/admin'} className={cn("flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all duration-200 relative", isActive(item.url) ? "bg-primary text-primary-foreground shadow-md" : "text-sidebar-foreground hover:bg-sidebar-accent")} title={isRTL ? item.titleAr : item.title}>
                                <item.icon className="h-5 w-5" />
                                {badgeCount > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[18px] text-center border-2 border-sidebar-background">
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                  </span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent> : group.isFlat ? 
                  // Flat view without collapsibles
                  <SidebarGroupContent className="mt-2">
                    <SidebarMenu className="space-y-1">
                      {group.items.map(item => {
                          const badgeCount = counts?.[item.url as keyof typeof counts] || 0;
                          return (
                            <SidebarMenuItem key={item.url}>
                              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                                <NavLink to={item.url} end={item.url === '/admin'} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative", isActive(item.url) ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent", isRTL && "flex-row-reverse text-right")}>
                                  <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", !isActive(item.url) && "group-hover:scale-110")} />
                                  <span className="flex-1 truncate">
                                    {isRTL ? item.titleAr : item.title}
                                  </span>
                                  {badgeCount > 0 && (
                                    <span className={cn(
                                      "bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-auto flex items-center justify-center",
                                      isRTL ? "ml-0 mr-auto" : "ml-auto"
                                    )}>
                                      {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                  :
            // Expanded view with collapsible groups
            <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.group)}>
                    <CollapsibleTrigger className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", groupActive ? "text-primary bg-primary/5" : "text-sidebar-foreground hover:bg-sidebar-accent", isRTL && "flex-row-reverse text-right")}>
                      <group.icon className={cn("h-4 w-4 shrink-0", groupActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1 text-start">
                        {isRTL ? group.groupAr : group.group}
                      </span>
                      {(() => {
                        const groupBadgeCount = group.items.reduce((total, item) => total + (counts?.[item.url as keyof typeof counts] || 0), 0);
                        return groupBadgeCount > 0 ? (
                          <span className={cn(
                            "bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex items-center justify-center mx-1"
                          )}>
                            {groupBadgeCount > 99 ? '99+' : groupBadgeCount}
                          </span>
                        ) : null;
                      })()}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                      <SidebarGroupContent className={cn("mt-1 border-sidebar-border", isRTL ? "mr-4 border-r pr-2" : "ms-4 border-s ps-2")}>
                        <SidebarMenu className="space-y-0.5">
                          {group.items.map(item => {
                              const badgeCount = counts?.[item.url as keyof typeof counts] || 0;
                              return (
                                <SidebarMenuItem key={item.url}>
                                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                                    <NavLink to={item.url} end={item.url === '/admin'} className={cn("flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group relative", isActive(item.url) ? "bg-primary text-primary-foreground font-semibold shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent", isRTL && "flex-row-reverse text-right")}>
                                      <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", !isActive(item.url) && "group-hover:scale-110")} />
                                      <span className="flex-1 truncate">
                                        {isRTL ? item.titleAr : item.title}
                                      </span>
                                      {badgeCount > 0 && (
                                        <span className={cn(
                                          "bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-auto flex items-center justify-center",
                                          isRTL ? "ml-0 mr-auto" : "ml-auto"
                                        )}>
                                          {badgeCount > 99 ? '99+' : badgeCount}
                                        </span>
                                      )}
                                      {!badgeCount && isActive(item.url) && <ChevronRight className={cn("h-3.5 w-3.5 opacity-70", isRTL ? "ml-0 mr-auto rotate-180" : "ml-auto")} />}
                                    </NavLink>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </Collapsible>}
              </SidebarGroup>;
        })}
        </SidebarContent>
      </ScrollArea>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "")}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {isAdmin ? 'Administrator' : 'Staff'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isAdmin ? 'Full Access' : `${allowedPages.length} pages`}
                </p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Sidebar>;
}