import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Eye, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminContacts() {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const totalPages = Math.ceil(contacts.length / rowsPerPage);
  const paginatedContacts = useMemo(() => contacts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [contacts, currentPage]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load contacts', 'فشل تحميل الرسائل'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Marked as read', 'تم التعليم كمقروء'));
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure?', 'هل أنت متأكد؟'))) return;

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Deleted successfully', 'تم الحذف بنجاح'));
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('Contact Submissions', 'رسائل التواصل')}</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name', 'الاسم')}</TableHead>
              <TableHead>{t('Email', 'البريد الإلكتروني')}</TableHead>
              <TableHead>{t('Subject', 'الموضوع')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t('Loading...', 'جاري التحميل...')}
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t('No contacts found', 'لا توجد رسائل')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.subject || '-'}</TableCell>
                  <TableCell>
                    {contact.is_read ? (
                      <Badge variant="secondary">{t('Read', 'مقروء')}</Badge>
                    ) : (
                      <Badge>{t('Unread', 'غير مقروء')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {!contact.is_read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(contact.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={contacts.length} itemsPerPage={rowsPerPage} />
    </div>
  );
}
