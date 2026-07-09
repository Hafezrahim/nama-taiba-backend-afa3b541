import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'client' | 'marketer';
  is_approved: boolean;
  created_at: string;
  profiles?: {
    full_name_en?: string;
    full_name_ar?: string;
  };
  email?: string;
}

export default function AdminRoles() {
  const { t, isRTL } = useLanguage();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile names for all user_ids
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name_en, full_name_ar')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      const rolesWithProfiles: UserRole[] = (data || []).map(r => ({
        ...r,
        profiles: profileMap.get(r.user_id) || undefined,
        email: undefined as string | undefined,
      }));

      // Fetch emails securely via Postgres RPC
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: emailData, error: emailError } = await supabase.rpc('get_user_emails');
          
          if (emailError) {
            console.error("RPC error:", emailError);
          } else if (emailData) {
            const emailMap = new Map<string, string>(emailData.map((e: any) => [String(e.id), String(e.email)]));
            rolesWithProfiles.forEach(role => {
              role.email = emailMap.get(role.user_id);
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to invoke get_user_emails RPC:', err);
      }

      setRoles(rolesWithProfiles);
    } catch (error: any) {
      toast.error(t('Failed to load roles', 'فشل تحميل الأدوار'));
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          is_approved: approved,
          approved_at: approved ? new Date().toISOString() : null 
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(t(
        approved ? 'User approved successfully' : 'User rejected successfully',
        approved ? 'تم قبول المستخدم بنجاح' : 'تم رفض المستخدم بنجاح'
      ));
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const validRoles = ['admin', 'user', 'client', 'marketer'];
      if (!validRoles.includes(newRole)) {
        toast.error(t('Invalid role', 'دور غير صالح'));
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'admin' | 'user' | 'client' | 'marketer' })
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Role updated successfully', 'تم تحديث الدور بنجاح'));
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-500',
      client: 'bg-blue-500',
      marketer: 'bg-green-500',
      user: 'bg-gray-500'
    };
    return <Badge className={roleColors[role]}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Roles & Permissions', 'الأدوار والصلاحيات')}</h1>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('User', 'المستخدم')}</TableHead>
              <TableHead>{t('Role', 'الدور')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Created', 'تاريخ الإنشاء')}</TableHead>
              <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('Loading...', 'جاري التحميل...')}
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('No roles found', 'لا توجد أدوار')}
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {(isRTL 
                          ? (role.profiles?.full_name_ar || role.profiles?.full_name_en) 
                          : (role.profiles?.full_name_en || role.profiles?.full_name_ar)) || 
                          t('Unnamed User', 'مستخدم بدون اسم')}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {role.email || `${role.user_id.substring(0, 8)}...`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={role.role}
                      onValueChange={(value) => handleRoleChange(role.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="marketer">Marketer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {role.is_approved ? (
                      <Badge variant="default">{t('Approved', 'مقبول')}</Badge>
                    ) : (
                      <Badge variant="destructive">{t('Pending', 'قيد الانتظار')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(role.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {!role.is_approved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproval(role.id, true)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleApproval(role.id, false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
