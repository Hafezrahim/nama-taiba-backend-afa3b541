import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, RefreshCw, CheckCircle2, AlertTriangle, FileJson, Clock, Shield, Calendar, History, Play, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const ALL_TABLES = [
  'about_info', 'blogs', 'categories', 'certifications', 'cities',
  'contact_info', 'contact_submissions', 'districts', 'marketer_applications',
  'offers', 'order_items', 'orders', 'partners', 'products', 'profiles',
  'projects', 'quote_requests', 'services', 'slider', 'team_members',
  'testimonials', 'user_roles',
] as const;

type TableName = typeof ALL_TABLES[number];

interface BackupMetadata {
  version: string;
  createdAt: string;
  tables: string[];
  recordCounts: Record<string, number>;
  projectId: string;
}

interface BackupData {
  metadata: BackupMetadata;
  data: Record<string, any[]>;
}

interface BackupRecord {
  id: string;
  file_name: string;
  file_path: string;
  tables: string[];
  record_counts: Record<string, number>;
  total_records: number;
  status: string;
  trigger_type: string;
  file_size_bytes: number | null;
  created_at: string;
  completed_at: string | null;
}

interface BackupSettings {
  id: string;
  is_enabled: boolean;
  frequency: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

export default function AdminBackup() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [selectedTables, setSelectedTables] = useState<Set<TableName>>(new Set(ALL_TABLES));
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [restoreFileData, setRestoreFileData] = useState<BackupData | null>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [isRunningScheduled, setIsRunningScheduled] = useState(false);

  const isWorking = isBackingUp || isRestoring || isRunningScheduled;

  useEffect(() => {
    fetchBackupHistory();
    fetchSettings();
  }, []);

  const fetchBackupHistory = async () => {
    const { data } = await (supabase.from('backups' as any).select('*').order('created_at', { ascending: false }).limit(20) as any);
    if (data) setBackupHistory(data);
  };

  const fetchSettings = async () => {
    const { data } = await (supabase.from('backup_settings' as any).select('*').limit(1).single() as any);
    if (data) setSettings(data);
  };

  const toggleTable = (table: TableName) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(table)) next.delete(table);
      else next.add(table);
      return next;
    });
  };

  const selectAll = () => setSelectedTables(new Set(ALL_TABLES));
  const deselectAll = () => setSelectedTables(new Set());

  const handleBackup = async () => {
    if (selectedTables.size === 0) {
      toast({ title: t('No tables selected', 'لم يتم اختيار جداول'), variant: 'destructive' });
      return;
    }

    setIsBackingUp(true);
    setProgress(0);

    try {
      const tables = Array.from(selectedTables);
      const backupData: Record<string, any[]> = {};
      const recordCounts: Record<string, number> = {};

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setCurrentOperation(t(`Backing up ${table}...`, `جاري نسخ ${table}...`));
        setProgress(Math.round(((i) / tables.length) * 100));

        const { data, error } = await (supabase.from(table as any).select('*') as any);
        if (error) {
          console.error(`Error backing up ${table}:`, error);
          continue;
        }
        backupData[table] = data || [];
        recordCounts[table] = (data || []).length;
      }

      const metadata: BackupMetadata = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        tables,
        recordCounts,
        projectId: 'nama-steel',
      };

      const fullBackup: BackupData = { metadata, data: backupData };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setCurrentOperation(t('Backup complete!', 'اكتمل النسخ الاحتياطي!'));

      const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);
      toast({
        title: t('Backup created successfully', 'تم إنشاء النسخة الاحتياطية بنجاح'),
        description: t(`${tables.length} tables, ${totalRecords} records exported`, `${tables.length} جدول، ${totalRecords} سجل تم تصديره`),
      });
    } catch (error: any) {
      toast({ title: t('Backup failed', 'فشل النسخ الاحتياطي'), description: error.message, variant: 'destructive' });
    } finally {
      setIsBackingUp(false);
      setTimeout(() => { setProgress(0); setCurrentOperation(''); }, 3000);
    }
  };

  const handleScheduledBackup = async () => {
    setIsRunningScheduled(true);
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-backup', {
        body: { trigger_type: 'manual' },
      });

      if (error) throw error;

      toast({
        title: t('Backup completed', 'تم النسخ الاحتياطي'),
        description: t(
          `${data.tables_count} tables, ${data.total_records} records saved to cloud`,
          `${data.tables_count} جدول، ${data.total_records} سجل تم حفظه في السحابة`
        ),
      });
      fetchBackupHistory();
    } catch (error: any) {
      toast({ title: t('Backup failed', 'فشل النسخ الاحتياطي'), description: error.message, variant: 'destructive' });
    } finally {
      setIsRunningScheduled(false);
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    if (!settings) return;
    const { error } = await (supabase.from('backup_settings' as any).update({
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    }).eq('id', settings.id) as any);

    if (!error) {
      setSettings({ ...settings, is_enabled: enabled });
      toast({
        title: enabled
          ? t('Scheduled backups enabled', 'تم تفعيل النسخ الاحتياطي المجدول')
          : t('Scheduled backups disabled', 'تم تعطيل النسخ الاحتياطي المجدول'),
      });
    }
  };

  const handleFrequencyChange = async (frequency: string) => {
    if (!settings) return;
    const { error } = await (supabase.from('backup_settings' as any).update({
      frequency,
      updated_at: new Date().toISOString(),
    }).eq('id', settings.id) as any);

    if (!error) {
      setSettings({ ...settings, frequency });
    }
  };

  const handleDownloadCloudBackup = async (backup: BackupRecord) => {
    try {
      const { data, error } = await supabase.storage.from('backups').download(backup.file_path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: t('Download failed', 'فشل التحميل'), description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteBackup = async (backup: BackupRecord) => {
    try {
      await supabase.storage.from('backups').remove([backup.file_path]);
      await (supabase.from('backups' as any).delete().eq('id', backup.id) as any);
      setBackupHistory(prev => prev.filter(b => b.id !== backup.id));
      toast({ title: t('Backup deleted', 'تم حذف النسخة الاحتياطية') });
    } catch (error: any) {
      toast({ title: t('Delete failed', 'فشل الحذف'), description: error.message, variant: 'destructive' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as BackupData;
        if (!parsed.metadata || !parsed.data) throw new Error('Invalid backup file format');
        setRestoreFileData(parsed);
        toast({
          title: t('Backup file loaded', 'تم تحميل ملف النسخة'),
          description: t(
            `${parsed.metadata.tables.length} tables, created ${new Date(parsed.metadata.createdAt).toLocaleString()}`,
            `${parsed.metadata.tables.length} جدول، تم إنشاؤها ${new Date(parsed.metadata.createdAt).toLocaleString()}`
          ),
        });
      } catch {
        toast({ title: t('Invalid file', 'ملف غير صالح'), variant: 'destructive' });
        setRestoreFileData(null);
      }
    };
    reader.readAsText(file);
  };

  const DELETE_ORDER: TableName[] = [
    'order_items', 'quote_requests', 'districts',
    'orders', 'offers', 'products', 'categories', 'cities',
    'blogs', 'projects', 'services', 'slider', 'team_members',
    'certifications', 'partners', 'testimonials',
    'contact_submissions', 'marketer_applications',
    'about_info', 'contact_info', 'profiles', 'user_roles',
  ];

  const INSERT_ORDER: TableName[] = [
    'about_info', 'contact_info', 'categories', 'cities',
    'profiles', 'user_roles',
    'products', 'offers', 'services', 'slider',
    'blogs', 'projects', 'team_members', 'certifications',
    'partners', 'testimonials',
    'orders', 'order_items',
    'districts', 'quote_requests',
    'contact_submissions', 'marketer_applications',
  ];

  const handleRestore = async () => {
    if (!restoreFileData) return;
    setIsRestoring(true);
    setProgress(0);

    try {
      const tablesToRestore = restoreFileData.metadata.tables as TableName[];
      const deleteList = DELETE_ORDER.filter(t => tablesToRestore.includes(t));
      for (let i = 0; i < deleteList.length; i++) {
        const table = deleteList[i];
        setCurrentOperation(t(`Clearing ${table}...`, `جاري مسح ${table}...`));
        setProgress(Math.round((i / (deleteList.length + tablesToRestore.length)) * 100));
        const { error } = await (supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000') as any);
        if (error && table === 'contact_info') {
          await (supabase.from('contact_info' as any).delete().neq('email', '') as any);
        }
      }

      const insertList = INSERT_ORDER.filter(t => tablesToRestore.includes(t) && restoreFileData.data[t]?.length > 0);
      for (let i = 0; i < insertList.length; i++) {
        const table = insertList[i];
        const rows = restoreFileData.data[table];
        setCurrentOperation(t(`Restoring ${table} (${rows.length} records)...`, `جاري استعادة ${table} (${rows.length} سجل)...`));
        setProgress(Math.round(((deleteList.length + i) / (deleteList.length + insertList.length)) * 100));

        for (let j = 0; j < rows.length; j += 100) {
          const batch = rows.slice(j, j + 100);
          const { error } = await (supabase.from(table as any).upsert(batch as any, { onConflict: 'id' }) as any);
          if (error) {
            console.error(`Error restoring ${table} batch ${j}:`, error);
            toast({ title: t(`Warning: ${table}`, `تحذير: ${table}`), description: error.message, variant: 'destructive' });
          }
        }
      }

      setProgress(100);
      setCurrentOperation(t('Restore complete!', 'اكتملت الاستعادة!'));
      toast({
        title: t('Restore completed successfully', 'تمت الاستعادة بنجاح'),
        description: t(`${insertList.length} tables restored`, `تم استعادة ${insertList.length} جدول`),
      });
    } catch (error: any) {
      toast({ title: t('Restore failed', 'فشلت الاستعادة'), description: error.message, variant: 'destructive' });
    } finally {
      setIsRestoring(false);
      setRestoreFileData(null);
      setRestoreFileName('');
      setTimeout(() => { setProgress(0); setCurrentOperation(''); }, 3000);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('Backup & Restore', 'النسخ الاحتياطي والاستعادة')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('Create and restore full database backups with scheduling', 'إنشاء واستعادة نسخ احتياطية كاملة لقاعدة البيانات مع جدولة')}
        </p>
      </div>

      {/* Progress */}
      {isWorking && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{currentOperation || t('Processing...', 'جاري المعالجة...')}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Settings */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('Scheduled Backups', 'النسخ الاحتياطي المجدول')}
            </CardTitle>
            <CardDescription>
              {t('Automatically create cloud backups on a schedule', 'إنشاء نسخ احتياطية سحابية تلقائياً وفقاً لجدول زمني')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={handleToggleSchedule}
                  disabled={isWorking}
                />
                <span className="text-sm font-medium">
                  {settings.is_enabled
                    ? t('Enabled', 'مفعل')
                    : t('Disabled', 'معطل')}
                </span>
              </div>

              <Select value={settings.frequency} onValueChange={handleFrequencyChange} disabled={isWorking}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">{t('Every Hour', 'كل ساعة')}</SelectItem>
                  <SelectItem value="daily">{t('Daily', 'يومياً')}</SelectItem>
                  <SelectItem value="weekly">{t('Weekly', 'أسبوعياً')}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleScheduledBackup}
                disabled={isWorking}
              >
                <Play className="h-4 w-4" />
                {t('Run Now', 'تشغيل الآن')}
              </Button>

              {settings.last_run_at && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {t('Last run:', 'آخر تشغيل:')} {formatTime(settings.last_run_at)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {t('Manual Backup', 'نسخ احتياطي يدوي')}
            </CardTitle>
            <CardDescription>
              {t('Export selected tables as a JSON file to your device', 'تصدير الجداول المحددة كملف JSON إلى جهازك')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">
                  {t('Select Tables', 'اختر الجداول')} ({selectedTables.size}/{ALL_TABLES.length})
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>{t('All', 'الكل')}</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>{t('None', 'لا شيء')}</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {ALL_TABLES.map(table => (
                  <label key={table} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <Checkbox checked={selectedTables.has(table)} onCheckedChange={() => toggleTable(table)} disabled={isWorking} />
                    <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{table}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleBackup} disabled={isWorking || selectedTables.size === 0} className="w-full gap-2">
              <Download className="h-4 w-4" />
              {t('Download Backup', 'تحميل النسخة الاحتياطية')}
            </Button>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-orange-500" />
              {t('Restore Backup', 'استعادة نسخة احتياطية')}
            </CardTitle>
            <CardDescription>
              {t('Import a backup file to restore data', 'استيراد ملف نسخة احتياطية لاستعادة البيانات')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <FileJson className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <Input type="file" accept=".json" onChange={handleFileSelect} disabled={isWorking} className="max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">{t('Select a .json backup file', 'اختر ملف نسخة احتياطية .json')}</p>
            </div>

            {restoreFileData && (
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileJson className="h-4 w-4 text-primary" />
                    {restoreFileName}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('Created:', 'تاريخ الإنشاء:')} {new Date(restoreFileData.metadata.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {restoreFileData.metadata.tables.length} {t('tables', 'جداول')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(restoreFileData.metadata.recordCounts).map(([table, count]) => (
                      <Badge key={table} variant="secondary" className="text-xs">{table}: {count}</Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">
                    {t('Warning: Restoring will replace all existing data. This cannot be undone.', 'تحذير: الاستعادة ستستبدل جميع البيانات الموجودة. لا يمكن التراجع.')}
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2" disabled={isWorking}>
                      <Shield className="h-4 w-4" />
                      {t('Restore Data', 'استعادة البيانات')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('Confirm Restore', 'تأكيد الاستعادة')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('This will DELETE all existing data and replace it with backup data. Are you absolutely sure?', 'سيتم حذف جميع البيانات واستبدالها ببيانات النسخة الاحتياطية. هل أنت متأكد تماماً؟')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('Cancel', 'إلغاء')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRestore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('Yes, Restore', 'نعم، استعادة')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('Backup History', 'سجل النسخ الاحتياطي')}
          </CardTitle>
          <CardDescription>
            {t('Cloud backups created automatically or manually', 'النسخ الاحتياطية السحابية المنشأة تلقائياً أو يدوياً')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('No cloud backups yet', 'لا توجد نسخ احتياطية سحابية بعد')}</p>
              <p className="text-xs mt-1">{t('Use "Run Now" to create your first cloud backup', 'استخدم "تشغيل الآن" لإنشاء أول نسخة احتياطية سحابية')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('File', 'الملف')}</TableHead>
                    <TableHead>{t('Type', 'النوع')}</TableHead>
                    <TableHead>{t('Status', 'الحالة')}</TableHead>
                    <TableHead>{t('Tables', 'الجداول')}</TableHead>
                    <TableHead>{t('Records', 'السجلات')}</TableHead>
                    <TableHead>{t('Size', 'الحجم')}</TableHead>
                    <TableHead>{t('Created', 'الإنشاء')}</TableHead>
                    <TableHead>{t('Actions', 'إجراءات')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupHistory.map(backup => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">{backup.file_name}</TableCell>
                      <TableCell>
                        <Badge variant={backup.trigger_type === 'scheduled' ? 'default' : 'secondary'} className="text-xs">
                          {backup.trigger_type === 'scheduled' ? t('Scheduled', 'مجدول') : t('Manual', 'يدوي')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={backup.status === 'completed' ? 'default' : backup.status === 'in_progress' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {backup.status === 'completed' ? t('Done', 'مكتمل') : backup.status === 'in_progress' ? t('Running', 'جاري') : t('Failed', 'فشل')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{backup.tables?.length || 0}</TableCell>
                      <TableCell className="text-xs">{backup.total_records}</TableCell>
                      <TableCell className="text-xs">{formatFileSize(backup.file_size_bytes)}</TableCell>
                      <TableCell className="text-xs">{formatTime(backup.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {backup.status === 'completed' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadCloudBackup(backup)}>
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteBackup(backup)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
