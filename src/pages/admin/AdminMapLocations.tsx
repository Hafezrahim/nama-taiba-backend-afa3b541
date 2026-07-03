import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buildLocationPopup } from '@/lib/mapPopup';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Plus, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  getMapLocations,
  upsertMapLocation,
  deleteMapLocation,
  type MapLocation,
} from '@/backend/mapLocations';
import LeafletMap, { type MapMarker } from '@/components/ui/leaflet-map';

const empty: Partial<MapLocation> = {
  name_en: '',
  name_ar: '',
  address_en: '',
  address_ar: '',
  latitude: 24.7136,
  longitude: 46.6753,
  phone: '',
  email: '',
  whatsapp: '',
  map_url: '',
  icon_color: '#630d5f',
  is_active: true,
  display_order: 0,
};

const AdminMapLocations = () => {
  const { t, isRTL } = useLanguage();
  const [items, setItems] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<MapLocation>>(empty);
  const [deleteTarget, setDeleteTarget] = useState<MapLocation | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getMapLocations(false);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm({ ...empty, display_order: items.length });
    setOpen(true);
  };
  const openEdit = (item: MapLocation) => {
    setForm(item);
    setOpen(true);
  };

  const save = async () => {
    try {
      if (!form.name_en || !form.name_ar) {
        toast.error(t('Name is required', 'الاسم مطلوب'));
        return;
      }
      await upsertMapLocation(form);
      toast.success(t('Saved', 'تم الحفظ'));
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMapLocation(deleteTarget.id);
      toast.success(t('Deleted', 'تم الحذف'));
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message || t('Failed to delete', 'فشل الحذف'));
    }
  };

  const markers: MapMarker[] = items
    .filter((i) => i.is_active)
    .map((i) => ({
      id: i.id,
      latitude: i.latitude,
      longitude: i.longitude,
      title: isRTL ? i.name_ar : i.name_en,
      iconColor: i.icon_color || '#630d5f',
      popupHtml: buildLocationPopup(i, isRTL),
    }));

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          {t('Map Locations', 'مواقع الخريطة')}
        </h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 me-2" />
          {t('Add Location', 'إضافة موقع')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Preview', 'معاينة')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <LeafletMap markers={markers} zoom={6} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('All Locations', 'كل المواقع')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name', 'الاسم')}</TableHead>
                  <TableHead>{t('Coordinates', 'الإحداثيات')}</TableHead>
                  <TableHead>{t('Phone', 'الهاتف')}</TableHead>
                  <TableHead>{t('Active', 'مفعل')}</TableHead>
                  <TableHead className="text-end">{t('Actions', 'إجراءات')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {isRTL ? i.name_ar : i.name_en}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {i.latitude.toFixed(4)}, {i.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>{i.phone || '-'}</TableCell>
                    <TableCell>{i.is_active ? '✅' : '❌'}</TableCell>
                    <TableCell className="text-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(i)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t('No locations yet', 'لا توجد مواقع بعد')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? t('Edit Location', 'تعديل موقع') : t('Add Location', 'إضافة موقع')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('Name (EN)', 'الاسم (إنجليزي)')}</Label>
              <Input
                value={form.name_en || ''}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('Name (AR)', 'الاسم (عربي)')}</Label>
              <Input
                value={form.name_ar || ''}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>{t('Address (EN)', 'العنوان (إنجليزي)')}</Label>
              <Textarea
                value={form.address_en || ''}
                onChange={(e) => setForm({ ...form, address_en: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>{t('Address (AR)', 'العنوان (عربي)')}</Label>
              <Textarea
                value={form.address_ar || ''}
                onChange={(e) => setForm({ ...form, address_ar: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('Latitude', 'خط العرض')}</Label>
              <Input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) =>
                  setForm({ ...form, latitude: parseFloat(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>{t('Longitude', 'خط الطول')}</Label>
              <Input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) =>
                  setForm({ ...form, longitude: parseFloat(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>{t('Phone', 'الهاتف')}</Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('Email', 'البريد')}</Label>
              <Input
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('WhatsApp', 'واتساب')}</Label>
              <Input
                value={form.whatsapp || ''}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('Google Maps URL', 'رابط خرائط جوجل')}</Label>
              <Input
                value={form.map_url || ''}
                onChange={(e) => setForm({ ...form, map_url: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('Marker Color', 'لون العلامة')}</Label>
              <Input
                type="color"
                value={form.icon_color || '#630d5f'}
                onChange={(e) => setForm({ ...form, icon_color: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('Display Order', 'الترتيب')}</Label>
              <Input
                type="number"
                value={form.display_order ?? 0}
                onChange={(e) =>
                  setForm({ ...form, display_order: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch
                checked={!!form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>{t('Active', 'مفعل')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('Cancel', 'إلغاء')}
            </Button>
            <Button onClick={save}>{t('Save', 'حفظ')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Delete location?', 'حذف الموقع؟')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `This will permanently remove "${deleteTarget ? (isRTL ? deleteTarget.name_ar : deleteTarget.name_en) : ''}" from the map.`,
                `سيتم حذف "${deleteTarget ? (isRTL ? deleteTarget.name_ar : deleteTarget.name_en) : ''}" نهائيًا من الخريطة.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('Delete', 'حذف')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMapLocations;
