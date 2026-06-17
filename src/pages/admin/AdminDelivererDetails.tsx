import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Truck, Phone, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const vehicleTypes: Record<string, { en: string; ar: string }> = {
  car: { en: 'Car', ar: 'سيارة' },
  van: { en: 'Van', ar: 'فان' },
  truck: { en: 'Truck', ar: 'شاحنة' },
  motorcycle: { en: 'Motorcycle', ar: 'دراجة نارية' },
};

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
};

const shipmentStatuses = {
  assigned: { en: 'Assigned', ar: 'تم التعيين' },
  picked_up: { en: 'Picked Up', ar: 'تم الاستلام' },
  in_transit: { en: 'In Transit', ar: 'في الطريق' },
  delivered: { en: 'Delivered', ar: 'تم التسليم' },
};

export default function AdminDelivererDetails() {
  const { id } = useParams<{ id: string }>();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: deliverer, isLoading } = useQuery({
    queryKey: ['deliverer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliverers')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['deliverer-shipments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*, orders(id, customer_name, customer_phone, customer_address, total, status)')
        .eq('deliverer_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ shipmentId, status }: { shipmentId: string; status: string }) => {
      const updates: any = { status };
      if (status === 'picked_up') updates.picked_up_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      const { error } = await supabase.from('shipments').update(updates).eq('id', shipmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverer-shipments', id] });
      toast.success(t('Shipment status updated', 'تم تحديث حالة الشحنة'));
    },
    onError: () => toast.error(t('Failed to update status', 'فشل تحديث الحالة')),
  });

  const activeShipments = shipments.filter((s: any) => s.status !== 'delivered').length;
  const deliveredShipments = shipments.filter((s: any) => s.status === 'delivered').length;

  const exportToExcel = () => {
    if (shipments.length === 0) return;
    const rows = shipments.map((s: any) => ({
      [t('Order ID', 'رقم الطلب')]: s.orders?.id || '-',
      [t('Customer', 'العميل')]: s.orders?.customer_name || '-',
      [t('Phone', 'الهاتف')]: s.orders?.customer_phone || '-',
      [t('Address', 'العنوان')]: s.orders?.customer_address || '-',
      [t('Total', 'الإجمالي')]: s.orders?.total || 0,
      [t('Status', 'الحالة')]: shipmentStatuses[s.status as keyof typeof shipmentStatuses]?.[language === 'ar' ? 'ar' : 'en'] || s.status,
      [t('Assigned At', 'تاريخ التعيين')]: s.assigned_at ? format(new Date(s.assigned_at), 'yyyy-MM-dd HH:mm') : '-',
      [t('Delivered At', 'تاريخ التسليم')]: s.delivered_at ? format(new Date(s.delivered_at), 'yyyy-MM-dd HH:mm') : '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('Shipments', 'الشحنات'));
    const name = language === 'ar' ? deliverer?.name_ar : deliverer?.name_en;
    XLSX.writeFile(wb, `${name}_shipments.xlsx`);
    toast.success(t('Exported successfully', 'تم التصدير بنجاح'));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</div>;
  }

  if (!deliverer) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('Deliverer not found', 'المندوب غير موجود')}</div>;
  }

  const vType = vehicleTypes[deliverer.vehicle_type || 'car'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/deliverers')}>
          {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{language === 'ar' ? deliverer.name_ar : deliverer.name_en}</h1>
          <p className="text-muted-foreground text-sm">{t('Deliverer Details', 'تفاصيل المندوب')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={shipments.length === 0}>
            <Download className="h-4 w-4 me-1" />
            {t('Export Excel', 'تصدير Excel')}
          </Button>
          <Badge variant={deliverer.is_active ? 'default' : 'secondary'}>
            {deliverer.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
          </Badge>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Phone className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Phone', 'الهاتف')}</p>
                <p className="font-semibold" dir="ltr">{deliverer.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Truck className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Vehicle', 'المركبة')}</p>
                <p className="font-semibold">
                  {language === 'ar' ? vType?.ar : vType?.en}
                  {deliverer.vehicle_number && <span className="text-muted-foreground text-xs ms-2 text-left px-[8px]" dir="ltr">{deliverer.vehicle_number}</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><FileText className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Total Shipments', 'إجمالي الشحنات')}</p>
                <p className="font-semibold">{shipments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><Truck className="h-5 w-5 text-orange-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{t('Active / Delivered', 'نشط / تم التسليم')}</p>
                <p className="font-semibold">{activeShipments} / {deliveredShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {deliverer.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('Notes', 'ملاحظات')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{deliverer.notes}</p></CardContent>
        </Card>
      )}

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Related Shipments', 'الشحنات المرتبطة')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Order', 'الطلب')}</TableHead>
                <TableHead className="text-start">{t('Customer', 'العميل')}</TableHead>
                <TableHead className="text-start">{t('Status', 'الحالة')}</TableHead>
                <TableHead className="text-start">{t('Assigned', 'تم التعيين')}</TableHead>
                <TableHead className="text-start">{t('Delivered', 'تم التسليم')}</TableHead>
                <TableHead className="text-start">{t('Actions', 'الإجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipmentsLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</TableCell></TableRow>
              ) : shipments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('No shipments found', 'لا توجد شحنات')}</TableCell></TableRow>
              ) : shipments.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell
                    className="font-mono text-xs cursor-pointer text-primary hover:underline"
                    onClick={() => s.orders?.id && navigate(`/admin/orders/${s.orders.id}`)}
                  >
                    {s.orders?.id?.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{s.orders?.customer_name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[s.status] || ''}>
                      {shipmentStatuses[s.status as keyof typeof shipmentStatuses]?.[language === 'ar' ? 'ar' : 'en'] || s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{s.assigned_at ? format(new Date(s.assigned_at), 'yyyy-MM-dd') : '-'}</TableCell>
                  <TableCell className="text-sm">{s.delivered_at ? format(new Date(s.delivered_at), 'yyyy-MM-dd') : '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={s.status}
                      onValueChange={(v) => updateStatusMutation.mutate({ shipmentId: s.id, status: v })}
                    >
                      <SelectTrigger className="w-[130px] h-8">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
