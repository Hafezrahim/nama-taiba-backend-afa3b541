import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Check, Trash2, Download, Search, Filter, X, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MarketerApplication {
  id: string;
  name: string;
  phone: string;
  city: string;
  total_experience: string;
  message?: string;
  cv_file_name?: string;
  cv_file_data?: string;
  cv_file_type?: string;
  is_processed: boolean;
  created_at: string;
}

export default function AdminMarketers() {
  const { t, language } = useLanguage();
  const [applications, setApplications] = useState<MarketerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('marketer_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load applications', 'فشل تحميل الطلبات'));
    } finally {
      setLoading(false);
    }
  };

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    const cities = [...new Set(applications.map(app => app.city))];
    return cities.filter(Boolean).sort();
  }, [applications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        app.name.toLowerCase().includes(searchLower) ||
        app.phone.toLowerCase().includes(searchLower) ||
        app.city.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'processed' && app.is_processed) ||
        (statusFilter === 'pending' && !app.is_processed);

      // City filter
      const matchesCity = cityFilter === 'all' || app.city === cityFilter;

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [applications, searchQuery, statusFilter, cityFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCityFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || cityFilter !== 'all';

  // Selection helpers
  const allFilteredSelected = filteredApplications.length > 0 && 
    filteredApplications.every(app => selectedIds.has(app.id));
  
  const someFilteredSelected = filteredApplications.some(app => selectedIds.has(app.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkMarkAsProcessed = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const { error } = await supabase
        .from('marketer_applications')
        .update({ is_processed: true })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      toast.success(t(`${selectedIds.size} applications marked as processed`, `تم تعليم ${selectedIds.size} طلبات كمعالجة`));
      setSelectedIds(new Set());
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t(`Delete ${selectedIds.size} applications?`, `حذف ${selectedIds.size} طلبات؟`))) return;

    try {
      const { error } = await supabase
        .from('marketer_applications')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      toast.success(t(`${selectedIds.size} applications deleted`, `تم حذف ${selectedIds.size} طلبات`));
      setSelectedIds(new Set());
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleMarkAsProcessed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('marketer_applications')
        .update({ is_processed: true })
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Marked as processed', 'تم التعليم كمعالج'));
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure?', 'هل أنت متأكد؟'))) return;

    try {
      const { error } = await supabase
        .from('marketer_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Deleted successfully', 'تم الحذف بنجاح'));
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDownloadCV = (application: MarketerApplication) => {
    if (!application.cv_file_data || !application.cv_file_name) return;

    // Allowlist of MIME types we will serve as a CV download.
    const ALLOWED_MIME = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]);

    try {
      // Expecting a data: URL like "data:<mime>;base64,<payload>"
      const match = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(
        application.cv_file_data
      );
      if (!match) {
        toast.error(t('Invalid CV file format', 'صيغة ملف السيرة غير صالحة'));
        return;
      }
      const declaredMime = match[1].toLowerCase();
      if (!ALLOWED_MIME.has(declaredMime)) {
        toast.error(t('Unsupported CV file type', 'نوع ملف السيرة غير مدعوم'));
        return;
      }

      const binary = atob(match[2]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // Re-wrap as a safe Blob with the allowlisted MIME type — never trust the
      // raw data: URL since it was submitted by an anonymous user.
      const blob = new Blob([bytes], { type: declaredMime });
      const url = URL.createObjectURL(blob);

      // Sanitize filename and force a safe extension matching the MIME.
      const extByMime: Record<string, string> = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
      };
      const safeBase = (application.cv_file_name || 'cv')
        .replace(/[^\w.\-]+/g, '_')
        .replace(/\.[^.]+$/, '');
      const safeName = `${safeBase}.${extByMime[declaredMime]}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(t('Could not download CV', 'تعذر تنزيل السيرة'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t('Marketer Applications', 'طلبات المسوقين')}</h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <Badge>{selectedIds.size} {t('selected', 'محدد')}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkMarkAsProcessed}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                {t('Mark Processed', 'تعليم كمعالج')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('Delete', 'حذف')}
              </Button>
            </>
          )}
          <Badge variant="outline">
            {filteredApplications.length} / {applications.length}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search by name, phone, or city...', 'البحث بالاسم أو الهاتف أو المدينة...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('Filters', 'الفلاتر')}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              {t('Clear', 'مسح')}
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('Status', 'الحالة')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Statuses', 'جميع الحالات')}</SelectItem>
                  <SelectItem value="pending">{t('Pending', 'قيد الانتظار')}</SelectItem>
                  <SelectItem value="processed">{t('Processed', 'معالج')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('City', 'المدينة')}</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Cities', 'جميع المدن')}</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label={t('Select all', 'تحديد الكل')}
                  className={someFilteredSelected && !allFilteredSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              <TableHead>{t('Name', 'الاسم')}</TableHead>
              <TableHead>{t('Phone', 'الهاتف')}</TableHead>
              <TableHead>{t('City', 'المدينة')}</TableHead>
              <TableHead>{t('Experience', 'الخبرة')}</TableHead>
              <TableHead>{t('CV', 'السيرة الذاتية')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {t('Loading...', 'جاري التحميل...')}
                </TableCell>
              </TableRow>
            ) : filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  {t('No applications found', 'لا توجد طلبات')}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id} className={selectedIds.has(app.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(app.id)}
                      onCheckedChange={() => toggleSelect(app.id)}
                      aria-label={t('Select', 'تحديد')}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>{app.phone}</TableCell>
                  <TableCell>{app.city}</TableCell>
                  <TableCell>{app.total_experience}</TableCell>
                  <TableCell>
                    {app.cv_file_name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadCV(app)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {app.is_processed ? (
                      <Badge variant="secondary">{t('Processed', 'معالج')}</Badge>
                    ) : (
                      <Badge>{t('Pending', 'قيد الانتظار')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}>
                    <div className="flex gap-2 justify-end">
                      {!app.is_processed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsProcessed(app.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(app.id)}
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
    </div>
  );
}
