import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Check, X, Trash2, Search, Users, UserCheck, UserX, Shield, Plus, Eye, Edit, CheckSquare, History, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserWithRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'client' | 'marketer';
  is_approved: boolean | null;
  created_at: string;
  approved_at: string | null;
  profile?: {
    full_name_en: string | null;
    full_name_ar: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
  email?: string;
  allowed_pages?: string[];
}

interface ActivityLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, any>;
  created_at: string;
  admin_name?: string;
  target_name?: string;
}

// All available admin pages — grouped by category to match sidebar
const ADMIN_PAGES = [
  // Overview
  { path: '/admin',               labelEn: 'Dashboard',               labelAr: 'لوحة التحكم',          group: 'Overview' },
  // E-Commerce / Operations
  { path: '/admin/products',      labelEn: 'Products',                labelAr: 'المنتجات',             group: 'E-Commerce' },
  { path: '/admin/categories',    labelEn: 'Categories',              labelAr: 'الفئات',               group: 'E-Commerce' },
  { path: '/admin/orders',        labelEn: 'Orders',                  labelAr: 'الطلبات',              group: 'E-Commerce' },
  { path: '/admin/offers',        labelEn: 'Offers',                  labelAr: 'العروض',               group: 'E-Commerce' },
  // Logistics
  { path: '/admin/shipments',     labelEn: 'Shipments',               labelAr: 'الشحنات',              group: 'Logistics' },
  { path: '/admin/deliverers',    labelEn: 'Deliverers',              labelAr: 'المناديب',             group: 'Logistics' },
  { path: '/admin/map-locations', labelEn: 'Map Locations',           labelAr: 'مواقع الخريطة',        group: 'Logistics' },
  { path: '/admin/cities',        labelEn: 'Cities',                  labelAr: 'المدن',                group: 'Logistics' },
  { path: '/admin/districts',     labelEn: 'Districts & Shipping',    labelAr: 'الأحياء والشحن',       group: 'Logistics' },
  // Communications / CRM
  { path: '/admin/quotes',        labelEn: 'Quote Requests',          labelAr: 'طلبات الأسعار',        group: 'Communications' },
  { path: '/admin/contacts',      labelEn: 'Contact Submissions',     labelAr: 'رسائل التواصل',        group: 'Communications' },
  { path: '/admin/tickets',       labelEn: 'Support Tickets',         labelAr: 'تذاكر الدعم',          group: 'Communications' },
  { path: '/admin/marketers',     labelEn: 'Marketer Applications',   labelAr: 'طلبات المسوقين',       group: 'Communications' },
  { path: '/admin/chatbot',       labelEn: 'Chatbot FAQs',            labelAr: 'أسئلة الشات بوت',      group: 'Communications' },
  // Content
  { path: '/admin/blogs',         labelEn: 'Blogs',                   labelAr: 'المدونات',             group: 'Content' },
  { path: '/admin/projects',      labelEn: 'Projects',                labelAr: 'المشاريع',             group: 'Content' },
  { path: '/admin/services',      labelEn: 'Services',                labelAr: 'الخدمات',              group: 'Content' },
  { path: '/admin/testimonials',  labelEn: 'Testimonials',            labelAr: 'الشهادات',             group: 'Content' },
  { path: '/admin/slider',        labelEn: 'Slider',                  labelAr: 'الشريط المتحرك',       group: 'Content' },
  // Company
  { path: '/admin/about',         labelEn: 'About Info',              labelAr: 'معلومات عنا',          group: 'Company' },
  { path: '/admin/team',          labelEn: 'Team Members',            labelAr: 'أعضاء الفريق',         group: 'Company' },
  { path: '/admin/certifications',labelEn: 'Certifications',          labelAr: 'الشهادات',             group: 'Company' },
  { path: '/admin/partners',      labelEn: 'Partners',                labelAr: 'الشركاء',              group: 'Company' },
  // User Management
  { path: '/admin/users',         labelEn: 'Users Management',        labelAr: 'إدارة المستخدمين',     group: 'User Management' },
  { path: '/admin/roles',         labelEn: 'Roles & Permissions',     labelAr: 'الأدوار والصلاحيات',   group: 'User Management' },
  // System
  { path: '/admin/settings',      labelEn: 'Settings',                labelAr: 'الإعدادات',            group: 'System' },
  { path: '/admin/seo',           labelEn: 'SEO & Analytics',         labelAr: 'السيو والتحليلات',     group: 'System' },
  { path: '/admin/backup',        labelEn: 'Backup & Restore',        labelAr: 'النسخ الاحتياطي',      group: 'System' },
  { path: '/admin/security',      labelEn: 'Security',                labelAr: 'الأمان',               group: 'System' },
  { path: '/admin/contact-info',  labelEn: 'Contact Info',            labelAr: 'معلومات التواصل',      group: 'System' },
];

// Group ADMIN_PAGES by category for grouped rendering in checkboxes
const GROUPED_PAGES = ADMIN_PAGES.reduce((acc, page) => {
  if (!acc[page.group]) acc[page.group] = [];
  acc[page.group].push(page);
  return acc;
}, {} as Record<string, typeof ADMIN_PAGES>);


const ACTION_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  create_user: { en: 'Created User', ar: 'إنشاء مستخدم', color: 'bg-green-500' },
  update_permissions: { en: 'Updated Permissions', ar: 'تحديث الصلاحيات', color: 'bg-blue-500' },
  bulk_permissions: { en: 'Bulk Permissions', ar: 'صلاحيات جماعية', color: 'bg-indigo-500' },
  change_role: { en: 'Changed Role', ar: 'تغيير الدور', color: 'bg-purple-500' },
  approve_user: { en: 'Approved User', ar: 'قبول مستخدم', color: 'bg-emerald-500' },
  reject_user: { en: 'Rejected User', ar: 'رفض مستخدم', color: 'bg-yellow-500' },
  delete_user: { en: 'Deleted User', ar: 'حذف مستخدم', color: 'bg-red-500' },
};

export default function AdminUsers() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Create user dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name_en: '',
    full_name_ar: '',
    email: '',
    password: '',
    role: 'user' as string,
    allowed_pages: [] as string[],
  });

  // Edit permissions dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editPages, setEditPages] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Bulk permissions state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPages, setBulkPages] = useState<string[]>([]);
  const [savingBulk, setSavingBulk] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showLog) fetchActivityLog();
  }, [showLog]);

  const logActivity = async (action: string, targetUserId: string | null, details: Record<string, any> = {}) => {
    if (!user) return;
    try {
      await supabase.from('admin_activity_log' as any).insert({
        admin_id: user.id,
        action,
        target_user_id: targetUserId,
        details,
      });
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  };

  const fetchActivityLog = async () => {
    setLogLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_activity_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const entries = (data || []) as any[];
      // Fetch profile names for admin_ids and target_user_ids
      const allIds = [...new Set([
        ...entries.map(e => e.admin_id),
        ...entries.filter(e => e.target_user_id).map(e => e.target_user_id),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name_en, full_name_ar')
        .in('id', allIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      setActivityLog(entries.map(e => ({
        ...e,
        details: e.details || {},
        admin_name: isRTL
          ? profileMap.get(e.admin_id)?.full_name_ar
          : profileMap.get(e.admin_id)?.full_name_en,
        target_name: e.target_user_id
          ? (isRTL
            ? profileMap.get(e.target_user_id)?.full_name_ar
            : profileMap.get(e.target_user_id)?.full_name_en)
          : null,
      })));
    } catch (error: any) {
      console.error('Error fetching activity log:', error);
    } finally {
      setLogLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      const userIds = [...new Set((rolesData || []).map(r => r.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name_en, full_name_ar, phone, avatar_url')
        .in('id', userIds);

      const { data: permissions } = await supabase
        .from('user_page_permissions')
        .select('user_id, page_path')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const permMap = new Map<string, string[]>();
      (permissions || []).forEach(p => {
        const existing = permMap.get(p.user_id) || [];
        existing.push(p.page_path);
        permMap.set(p.user_id, existing);
      });

      const usersWithProfiles: UserWithRole[] = (rolesData || []).map(role => ({
        ...role,
        profile: profileMap.get(role.user_id) || undefined,
        allowed_pages: permMap.get(role.user_id) || [],
      }));

      // Fetch emails securely via Postgres RPC
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: emailData, error: emailError } = await supabase.rpc('get_user_emails');
          
          if (emailError) {
            console.error("RPC error:", emailError);
            toast.error("Failed to fetch user emails: " + (emailError.message || "Unknown error"));
          } else if (emailData) {
            const emailMap = new Map<string, string>(emailData.map((e: any) => [String(e.id), String(e.email)]));
            usersWithProfiles.forEach(user => {
              user.email = emailMap.get(user.user_id);
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to invoke get_user_emails RPC:', err);
        toast.error("Error fetching emails: " + (err.message || "Unknown error"));
      }

      setUsers(usersWithProfiles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(t('Failed to load users', 'فشل تحميل المستخدمين'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name_en) {
      toast.error(t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
      return;
    }
    if (newUser.password.length < 6) {
      toast.error(t('Password must be at least 6 characters', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'));
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          full_name_en: newUser.full_name_en,
          full_name_ar: newUser.full_name_ar || newUser.full_name_en,
          role: newUser.role,
          allowed_pages: newUser.allowed_pages,
        },
      });

      if (res.error) throw new Error(res.error.message || 'Failed to create user');
      if (res.data?.error) throw new Error(res.data.error);

      await logActivity('create_user', res.data?.user?.id || null, {
        email: newUser.email,
        name: newUser.full_name_en,
        role: newUser.role,
        pages_count: newUser.allowed_pages.length,
      });

      toast.success(t('User created successfully', 'تم إنشاء المستخدم بنجاح'));
      setCreateOpen(false);
      setNewUser({ full_name_en: '', full_name_ar: '', email: '', password: '', role: 'user', allowed_pages: [] });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || t('Failed to create user', 'فشل إنشاء المستخدم'));
    } finally {
      setCreating(false);
    }
  };

  const handleApproval = async (id: string, approved: boolean) => {
    try {
      const targetUser = users.find(u => u.id === id);
      const { error } = await supabase
        .from('user_roles')
        .update({
          is_approved: approved,
          approved_at: approved ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      await logActivity(approved ? 'approve_user' : 'reject_user', targetUser?.user_id || null, {
        name: targetUser?.profile?.full_name_en,
      });

      toast.success(t(
        approved ? 'User approved successfully' : 'User rejected',
        approved ? 'تم قبول المستخدم بنجاح' : 'تم رفض المستخدم'
      ));
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const validRoles = ['admin', 'user', 'client', 'marketer'];
      if (!validRoles.includes(newRole)) return;

      const targetUser = users.find(u => u.id === id);
      const oldRole = targetUser?.role;

      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('id', id);

      if (error) throw error;

      await logActivity('change_role', targetUser?.user_id || null, {
        name: targetUser?.profile?.full_name_en,
        old_role: oldRole,
        new_role: newRole,
      });

      toast.success(t('Role updated successfully', 'تم تحديث الدور بنجاح'));
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (id: string, userId: string) => {
    try {
      const targetUser = users.find(u => u.id === id);

      await logActivity('delete_user', userId, {
        name: targetUser?.profile?.full_name_en,
        role: targetUser?.role,
      });

      await supabase.from('user_page_permissions').delete().eq('user_id', userId);
      const { error: roleError } = await supabase.from('user_roles').delete().eq('id', id);
      if (roleError) throw roleError;
      await supabase.from('profiles').delete().eq('id', userId);

      toast.success(t('User deleted successfully', 'تم حذف المستخدم بنجاح'));
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditPermissions = (user: UserWithRole) => {
    setEditingUser(user);
    setEditPages(user.allowed_pages || []);
    setEditOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setSavingPerms(true);
    try {
      await supabase.from('user_page_permissions').delete().eq('user_id', editingUser.user_id);

      if (editPages.length > 0) {
        const rows = editPages.map(page => ({
          user_id: editingUser.user_id,
          page_path: page,
        }));
        const { error } = await supabase.from('user_page_permissions').insert(rows);
        if (error) throw error;
      }

      await logActivity('update_permissions', editingUser.user_id, {
        name: editingUser.profile?.full_name_en,
        pages: editPages,
        pages_count: editPages.length,
      });

      toast.success(t('Permissions updated', 'تم تحديث الصلاحيات'));
      setEditOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleNewPage = (page: string) => {
    setNewUser(prev => ({
      ...prev,
      allowed_pages: prev.allowed_pages.includes(page)
        ? prev.allowed_pages.filter(p => p !== page)
        : [...prev.allowed_pages, page],
    }));
  };

  const toggleEditPage = (page: string) => {
    setEditPages(prev =>
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const toggleBulkPage = (page: string) => {
    setBulkPages(prev =>
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map(u => u.user_id));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUserIds.length === 0 || bulkPages.length === 0) {
      toast.error(t('Select users and pages', 'حدد المستخدمين والصفحات'));
      return;
    }
    setSavingBulk(true);
    try {
      for (const userId of selectedUserIds) {
        await supabase.from('user_page_permissions').delete().eq('user_id', userId);
      }

      const rows = selectedUserIds.flatMap(userId =>
        bulkPages.map(page => ({ user_id: userId, page_path: page }))
      );
      const { error } = await supabase.from('user_page_permissions').insert(rows);
      if (error) throw error;

      await logActivity('bulk_permissions', null, {
        user_count: selectedUserIds.length,
        pages: bulkPages,
        pages_count: bulkPages.length,
      });

      toast.success(t(`Permissions updated for ${selectedUserIds.length} users`, `تم تحديث الصلاحيات لـ ${selectedUserIds.length} مستخدمين`));
      setBulkOpen(false);
      setSelectedUserIds([]);
      setBulkPages([]);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingBulk(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'client': return 'default';
      case 'marketer': return 'secondary';
      default: return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const name = isRTL ? user.profile?.full_name_ar : user.profile?.full_name_en;
    return (
      user.user_id.toLowerCase().includes(searchLower) ||
      name?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.profile?.phone?.includes(searchQuery)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() =>
    filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredUsers, currentPage]
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const totalUsers = users.length;
  const approvedUsers = users.filter(u => u.is_approved === true).length;
  const pendingUsers = users.filter(u => u.is_approved !== true).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

  const PageCheckboxList = ({ selectedPages, onToggle }: { selectedPages: string[]; onToggle: (p: string) => void }) => (
    <div className="space-y-4 max-h-72 overflow-y-auto border rounded-lg p-3">
      {Object.entries(GROUPED_PAGES).map(([groupName, pages]) => {
        const allSelected = pages.every(p => selectedPages.includes(p.path));
        const someSelected = pages.some(p => selectedPages.includes(p.path));
        return (
          <div key={groupName}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{groupName}</span>
              <button
                type="button"
                className="text-[11px] text-primary hover:underline"
                onClick={() => {
                  if (allSelected) {
                    pages.forEach(p => selectedPages.includes(p.path) && onToggle(p.path));
                  } else {
                    pages.forEach(p => !selectedPages.includes(p.path) && onToggle(p.path));
                  }
                }}
              >
                {allSelected ? t('Deselect All', 'إلغاء الكل') : t('Select All', 'تحديد الكل')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ps-1 border-s-2 ms-1" style={{ borderColor: allSelected ? 'hsl(var(--primary))' : someSelected ? 'hsl(var(--primary)/40%)' : 'hsl(var(--border))' }}>
              {pages.map(page => (
                <label key={page.path} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer text-sm">
                  <Checkbox
                    checked={selectedPages.includes(page.path)}
                    onCheckedChange={() => onToggle(page.path)}
                  />
                  <span>{isRTL ? page.labelAr : page.labelEn}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );


  const formatLogTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getActionDetail = (entry: ActivityLogEntry) => {
    const d = entry.details;
    switch (entry.action) {
      case 'create_user':
        return `${d.email} (${d.role})`;
      case 'change_role':
        return `${d.old_role} → ${d.new_role}`;
      case 'update_permissions':
        return `${d.pages_count} ${isRTL ? 'صفحات' : 'pages'}`;
      case 'bulk_permissions':
        return `${d.user_count} ${isRTL ? 'مستخدمين' : 'users'}, ${d.pages_count} ${isRTL ? 'صفحات' : 'pages'}`;
      case 'delete_user':
        return d.name || '';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{t('Users Management', 'إدارة المستخدمين')}</h1>
        <div className="flex gap-2">
          <Button
            variant={showLog ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setShowLog(!showLog)}
          >
            <History className="h-4 w-4" />
            {t('Activity Log', 'سجل النشاط')}
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('Create User', 'إنشاء مستخدم')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('Create New User', 'إنشاء مستخدم جديد')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('Name (English) *', 'الاسم (إنجليزي) *')}</Label>
                    <Input
                      value={newUser.full_name_en}
                      onChange={e => setNewUser(p => ({ ...p, full_name_en: e.target.value }))}
                      placeholder="hafez Rahim"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                    <Input
                      value={newUser.full_name_ar}
                      onChange={e => setNewUser(p => ({ ...p, full_name_ar: e.target.value }))}
                      placeholder="حافظ رحیم"
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('Email *', 'البريد الإلكتروني *')}</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('Password *', 'كلمة المرور *')}</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('Role', 'الدور')}</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t('User', 'مستخدم')}</SelectItem>
                      <SelectItem value="client">{t('Client', 'عميل')}</SelectItem>
                      <SelectItem value="marketer">{t('Marketer', 'مسوق')}</SelectItem>
                      <SelectItem value="admin">{t('Admin', 'مسؤول')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('Allowed Admin Pages', 'صفحات الإدارة المسموحة')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('Select which admin pages this user can access. Admins have full access regardless.',
                      'حدد صفحات لوحة التحكم التي يمكن لهذا المستخدم الوصول إليها. المسؤولون لديهم صلاحيات كاملة.')}
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setNewUser(p => ({ ...p, allowed_pages: ADMIN_PAGES.map(pg => pg.path) }))}>
                      {t('Select All', 'تحديد الكل')}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setNewUser(p => ({ ...p, allowed_pages: [] }))}>
                      {t('Deselect All', 'إلغاء الكل')}
                    </Button>
                  </div>
                  <PageCheckboxList selectedPages={newUser.allowed_pages} onToggle={toggleNewPage} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button onClick={handleCreateUser} disabled={creating}>
                  {creating ? t('Creating...', 'جاري الإنشاء...') : t('Create User', 'إنشاء مستخدم')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Total Users', 'إجمالي المستخدمين')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Approved', 'المقبولين')}</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{approvedUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Pending', 'قيد الانتظار')}</CardTitle>
            <UserX className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{pendingUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('Admins', 'المسؤولين')}</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{adminUsers}</div></CardContent>
        </Card>
      </div>

      {/* Activity Log Section */}
      {showLog && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t('Activity Log', 'سجل النشاط')}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchActivityLog} disabled={logLoading}>
                {t('Refresh', 'تحديث')}
              </Button>
            </div>
            <CardDescription>
              {t('Recent admin actions on user management', 'آخر إجراءات المسؤولين على إدارة المستخدمين')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logLoading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                {t('Loading...', 'جاري التحميل...')}
              </div>
            ) : activityLog.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('No activity logged yet', 'لا يوجد نشاط مسجل بعد')}
              </p>
            ) : (
              <ScrollArea className="h-[320px]">
                <div className="space-y-3">
                  {activityLog.map(entry => {
                    const actionMeta = ACTION_LABELS[entry.action] || { en: entry.action, ar: entry.action, color: 'bg-muted' };
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${actionMeta.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {entry.admin_name || entry.admin_id.substring(0, 8)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {isRTL ? actionMeta.ar : actionMeta.en}
                            </Badge>
                            {entry.target_name && (
                              <span className="text-sm text-muted-foreground">
                                → {entry.target_name}
                              </span>
                            )}
                          </div>
                          {getActionDetail(entry) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getActionDetail(entry)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatLogTime(entry.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search + Bulk Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search users...', 'البحث عن مستخدمين...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedUserIds.length > 0 && (
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => { setBulkPages([]); setBulkOpen(true); }}
          >
            <CheckSquare className="h-4 w-4" />
            {t(`Bulk Permissions (${selectedUserIds.length})`, `صلاحيات جماعية (${selectedUserIds.length})`)}
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('User', 'المستخدم')}</TableHead>
                <TableHead>{t('Phone', 'الهاتف')}</TableHead>
                <TableHead>{t('Role', 'الدور')}</TableHead>
                <TableHead>{t('Pages', 'الصفحات')}</TableHead>
                <TableHead>{t('Status', 'الحالة')}</TableHead>
                <TableHead>{t('Joined', 'تاريخ الانضمام')}</TableHead>
                <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      {t('Loading...', 'جاري التحميل...')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('No users found', 'لا يوجد مستخدمين')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUserIds.includes(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {(isRTL 
                            ? (user.profile?.full_name_ar || user.profile?.full_name_en) 
                            : (user.profile?.full_name_en || user.profile?.full_name_ar)) ||
                            t('Unnamed User', 'مستخدم بدون اسم')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email || `${user.user_id.substring(0, 8)}...`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.profile?.phone || '-'}</TableCell>
                    <TableCell>
                      <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                        <SelectTrigger className="w-28">
                          <SelectValue>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {t(user.role.charAt(0).toUpperCase() + user.role.slice(1),
                                user.role === 'admin' ? 'مسؤول' :
                                  user.role === 'client' ? 'عميل' :
                                    user.role === 'marketer' ? 'مسوق' : 'مستخدم')}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{t('User', 'مستخدم')}</SelectItem>
                          <SelectItem value="client">{t('Client', 'عميل')}</SelectItem>
                          <SelectItem value="marketer">{t('Marketer', 'مسوق')}</SelectItem>
                          <SelectItem value="admin">{t('Admin', 'مسؤول')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Badge variant="destructive">{t('Full Access', 'وصول كامل')}</Badge>
                      ) : (user.allowed_pages?.length || 0) > 0 ? (
                        <Badge variant="secondary">{user.allowed_pages!.length} {t('pages', 'صفحات')}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('None', 'لا يوجد')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_approved === true ? (
                        <Badge variant="default" className="bg-green-500">{t('Approved', 'مقبول')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-500 text-white">{t('Pending', 'قيد الانتظار')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditPermissions(user)}
                          title={t('Edit Permissions', 'تعديل الصلاحيات')}
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        {user.is_approved !== true && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleApproval(user.id, true)} title={t('Approve', 'قبول')}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {user.is_approved === true && (
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleApproval(user.id, false)} title={t('Revoke', 'إلغاء')}>
                            <X className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" title={t('Delete', 'حذف')}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('Delete User?', 'حذف المستخدم؟')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('This action cannot be undone.', 'لا يمكن التراجع عن هذا الإجراء.')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.user_id)} className="bg-red-500 hover:bg-red-600">
                                {t('Delete', 'حذف')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4">
            <AdminTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Permissions Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('Edit Page Permissions', 'تعديل صلاحيات الصفحات')} - {isRTL ? editingUser?.profile?.full_name_ar : editingUser?.profile?.full_name_en}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditPages(ADMIN_PAGES.map(p => p.path))}>
                {t('Select All', 'تحديد الكل')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditPages([])}>
                {t('Deselect All', 'إلغاء الكل')}
              </Button>
            </div>
            <PageCheckboxList selectedPages={editPages} onToggle={toggleEditPage} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handleSavePermissions} disabled={savingPerms}>
              {savingPerms ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Permissions Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t(`Bulk Assign Permissions (${selectedUserIds.length} users)`, `تعيين صلاحيات جماعية (${selectedUserIds.length} مستخدمين)`)}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('This will replace existing permissions for all selected users.',
              'سيتم استبدال الصلاحيات الحالية لجميع المستخدمين المحددين.')}
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBulkPages(ADMIN_PAGES.map(p => p.path))}>
                {t('Select All', 'تحديد الكل')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setBulkPages([])}>
                {t('Deselect All', 'إلغاء الكل')}
              </Button>
            </div>
            <PageCheckboxList selectedPages={bulkPages} onToggle={toggleBulkPage} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handleBulkAssign} disabled={savingBulk || bulkPages.length === 0}>
              {savingBulk ? t('Saving...', 'جاري الحفظ...') : t('Apply to Selected', 'تطبيق على المحددين')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
