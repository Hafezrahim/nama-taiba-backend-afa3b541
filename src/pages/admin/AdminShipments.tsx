import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

const shipmentStatuses = {
  assigned: { en: 'Assigned', ar: 'تم التعيين', color: 'bg-blue-500' },
  picked_up: { en: 'Picked Up', ar: 'تم الاستلام', color: 'bg-orange-500' },
  in_transit: { en: 'In Transit', ar: 'في الطريق', color: 'bg-purple-500' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل', color: 'bg-green-500' },
};

export default function AdminShipments() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['admin-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, deliverers(name_en, name_ar, phone), orders(customer_name, customer_phone, customer_address, status, total)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      const { error } = await supabase.from('shipments').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipments'] });
      toast.success(t('Shipment status updated', 'تم تحديث حالة الشحنة'));
    },
    onError: () => toast.error(t('Failed to update status', 'فشل تحديث الحالة')),
  });

  const filtered = shipments.filter((s: any) => {
    const matchSearch = !search ||
      s.orders?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.deliverers?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      s.deliverers?.name_ar?.includes(search) ||
      s.order_id?.includes(search);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: shipments.length,
    assigned: shipments.filter((s: any) => s.status === 'assigned').length,
    in_transit: shipments.filter((s: any) => s.status === 'in_transit' || s.status === 'picked_up').length,
    delivered: shipments.filter((s: any) => s.status === 'delivered').length,
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('Shipments Management', 'إدارة الشحنات')}</h1>
        <p className="text-muted-foreground text-sm">{t('Track and manage all order shipments', 'تتبع وإدارة جميع شحنات الطلبات')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">{t('Total', 'الإجمالي')}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-500" />
          <div><p className="text-2xl font-bold">{stats.assigned}</p><p className="text-xs text-muted-foreground">{t('Assigned', 'معين')}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Truck className="h-5 w-5 text-orange-500" />
          <div><p className="text-2xl font-bold">{stats.in_transit}</p><p className="text-xs text-muted-foreground">{t('In Transit', 'في الطريق')}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div><p className="text-2xl font-bold">{stats.delivered}</p><p className="text-xs text-muted-foreground">{t('Delivered', 'تم التوصيل')}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('Search...', 'بحث...')} value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Statuses', 'كل الحالات')}</SelectItem>
            {Object.entries(shipmentStatuses).map(([key, val]) => (
              <SelectItem key={key} value={key}>{language === 'ar' ? val.ar : val.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Order', 'الطلب')}</TableHead>
                <TableHead className="text-start">{t('Customer', 'العميل')}</TableHead>
                <TableHead className="text-start">{t('Deliverer', 'المندوب')}</TableHead>
                <TableHead className="text-start">{t('Status', 'الحالة')}</TableHead>
                <TableHead className="text-start">{t('Assigned', 'التعيين')}</TableHead>
                <TableHead className="text-start">{t('Delivered', 'التوصيل')}</TableHead>
                <TableHead className="text-start">{t('Actions', 'الإجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t('No shipments found', 'لا توجد شحنات')}</TableCell></TableRow>
              ) : paginated.map((s: any) => {
                const statusInfo = shipmentStatuses[s.status as keyof typeof shipmentStatuses] || shipmentStatuses.assigned;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to={`/admin/orders/${s.order_id}`} className="text-primary hover:underline font-mono text-sm">
                        #{s.order_id?.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>{s.orders?.customer_name || '-'}</TableCell>
                    <TableCell>{language === 'ar' ? s.deliverers?.name_ar : s.deliverers?.name_en}</TableCell>
                    <TableCell>
                      <Badge className={cn(statusInfo.color, 'text-white')}>
                        {language === 'ar' ? statusInfo.ar : statusInfo.en}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(s.assigned_at)}</TableCell>
                    <TableCell className="text-sm">{formatDate(s.delivered_at)}</TableCell>
                    <TableCell>
                      <Select
                        value={s.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: s.id, status: v })}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(shipmentStatuses).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{language === 'ar' ? val.ar : val.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
