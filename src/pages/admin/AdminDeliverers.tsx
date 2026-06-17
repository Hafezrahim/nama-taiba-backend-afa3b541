import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Truck, Phone, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

interface Deliverer {
  id: string;
  name_en: string;
  name_ar: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const vehicleTypes = [
  { value: 'car', en: 'Car', ar: 'سيارة' },
  { value: 'van', en: 'Van', ar: 'فان' },
  { value: 'truck', en: 'Truck', ar: 'شاحنة' },
  { value: 'motorcycle', en: 'Motorcycle', ar: 'دراجة نارية' },
];

export default function AdminDeliverers() {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeliverer, setEditingDeliverer] = useState<Deliverer | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: deliverers = [], isLoading } = useQuery({
    queryKey: ['admin-deliverers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliverers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Deliverer[];
    },
  });

  // Fetch shipment counts per deliverer
  const { data: shipmentCounts = {} } = useQuery({
    queryKey: ['deliverer-shipment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('deliverer_id, status');
      if (error) throw error;
      const counts: Record<string, { total: number; active: number }> = {};
      (data || []).forEach((s: any) => {
        if (!counts[s.deliverer_id]) counts[s.deliverer_id] = { total: 0, active: 0 };
        counts[s.deliverer_id].total++;
        if (s.status !== 'delivered') counts[s.deliverer_id].active++;
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (editingDeliverer) {
        const { error } = await supabase.from('deliverers').update(formData).eq('id', editingDeliverer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('deliverers').insert(formData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deliverers'] });
      toast.success(t('Deliverer saved successfully', 'تم حفظ المندوب بنجاح'));
      setDialogOpen(false);
      setEditingDeliverer(null);
    },
    onError: () => toast.error(t('Failed to save deliverer', 'فشل حفظ المندوب')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deliverers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deliverers'] });
      toast.success(t('Deliverer deleted', 'تم حذف المندوب'));
    },
    onError: () => toast.error(t('Cannot delete deliverer with active shipments', 'لا يمكن حذف مندوب لديه شحنات نشطة')),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      name_en: form.get('name_en') as string,
      name_ar: form.get('name_ar') as string,
      phone: form.get('phone') as string,
      vehicle_type: form.get('vehicle_type') as string || 'car',
      vehicle_number: form.get('vehicle_number') as string || null,
      is_active: form.get('is_active') === 'on',
      notes: form.get('notes') as string || null,
    };
    if (!data.name_en || !data.name_ar || !data.phone) {
      toast.error(t('Please fill required fields', 'يرجى ملء الحقول المطلوبة'));
      return;
    }
    saveMutation.mutate(data);
  };

  const handleEdit = (deliverer: Deliverer) => {
    setEditingDeliverer(deliverer);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('Are you sure?', 'هل أنت متأكد؟'))) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = deliverers.filter(d =>
    d.name_en.toLowerCase().includes(search.toLowerCase()) ||
    d.name_ar.includes(search) ||
    d.phone.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeCount = deliverers.filter(d => d.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('Deliverers Management', 'إدارة المناديب')}</h1>
          <p className="text-muted-foreground text-sm">
            {t(`${deliverers.length} deliverers (${activeCount} active)`, `${deliverers.length} مندوب (${activeCount} نشط)`)}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingDeliverer(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />{t('Add Deliverer', 'إضافة مندوب')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingDeliverer ? t('Edit Deliverer', 'تعديل المندوب') : t('Add Deliverer', 'إضافة مندوب')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('Name (English)', 'الاسم (إنجليزي)')}</Label>
                  <Input name="name_en" defaultValue={editingDeliverer?.name_en || ''} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('Name (Arabic)', 'الاسم (عربي)')}</Label>
                  <Input name="name_ar" defaultValue={editingDeliverer?.name_ar || ''} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('Phone', 'الهاتف')}</Label>
                <Input name="phone" defaultValue={editingDeliverer?.phone || ''} required dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('Vehicle Type', 'نوع المركبة')}</Label>
                  <select name="vehicle_type" defaultValue={editingDeliverer?.vehicle_type || 'car'} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {vehicleTypes.map(v => (
                      <option key={v.value} value={v.value}>{language === 'ar' ? v.ar : v.en}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('Vehicle Number', 'رقم المركبة')}</Label>
                  <Input name="vehicle_number" defaultValue={editingDeliverer?.vehicle_number || ''} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('Notes', 'ملاحظات')}</Label>
                <Textarea name="notes" defaultValue={editingDeliverer?.notes || ''} rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Switch name="is_active" defaultChecked={editingDeliverer?.is_active ?? true} />
                <Label>{t('Active', 'نشط')}</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Truck className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{deliverers.length}</p>
                <p className="text-xs text-muted-foreground">{t('Total Deliverers', 'إجمالي المناديب')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><Truck className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">{t('Active', 'نشط')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><Truck className="h-5 w-5 text-orange-500" /></div>
              <div>
                <p className="text-2xl font-bold">{deliverers.length - activeCount}</p>
                <p className="text-xs text-muted-foreground">{t('Inactive', 'غير نشط')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('Search deliverers...', 'البحث عن مناديب...')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="ps-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t('Name', 'الاسم')}</TableHead>
                <TableHead className="text-start">{t('Phone', 'الهاتف')}</TableHead>
                <TableHead className="text-start">{t('Vehicle', 'المركبة')}</TableHead>
                <TableHead className="text-start">{t('Shipments', 'الشحنات')}</TableHead>
                <TableHead className="text-start">{t('Status', 'الحالة')}</TableHead>
                <TableHead className="text-start">{t('Actions', 'الإجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('No deliverers found', 'لا يوجد مناديب')}</TableCell></TableRow>
              ) : paginated.map((d) => {
                const vType = vehicleTypes.find(v => v.value === d.vehicle_type);
                const counts = shipmentCounts[d.id];
                return (
                  <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/deliverers/${d.id}`)}>
                    <TableCell className="font-medium text-primary underline-offset-2 hover:underline">{language === 'ar' ? d.name_ar : d.name_en}</TableCell>
                    <TableCell dir="ltr" className="text-right">{d.phone}</TableCell>
                    <TableCell>
                      <span className="text-sm">{language === 'ar' ? vType?.ar : vType?.en}</span>
                      {d.vehicle_number && <span className="text-xs text-muted-foreground ms-2 text-left px-[8px]" dir="ltr">{d.vehicle_number}</span>}
                    </TableCell>
                    <TableCell>
                      {counts ? (
                        <div className="flex gap-2">
                          <Badge variant="outline">{counts.total} {t('total', 'إجمالي')}</Badge>
                          {counts.active > 0 && <Badge variant="secondary">{counts.active} {t('active', 'نشط')}</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.is_active ? 'default' : 'secondary'}>
                        {d.is_active ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <AdminTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
