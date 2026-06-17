import { useState, useEffect, useMemo } from 'react';
import { pingIndexNowForEntity } from '@/utils/indexNow';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight, Upload, ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  image?: string;
  date?: string;
  location?: string;
  is_featured?: boolean;
  is_active?: boolean;
  keywords?: string;
}

const SUGGESTED_KEYWORDS = [
  { en: 'construction', ar: 'بناء' },
  { en: 'building materials', ar: 'مواد بناء' },
  { en: 'residential', ar: 'سكني' },
  { en: 'commercial', ar: 'تجاري' },
  { en: 'industrial', ar: 'صناعي' },
  { en: 'infrastructure', ar: 'بنية تحتية' },
  { en: 'renovation', ar: 'تجديد' },
  { en: 'concrete', ar: 'خرسانة' },
  { en: 'insulation', ar: 'عزل' },
  { en: 'waterproofing', ar: 'عزل مائي' },
  { en: 'project delivery', ar: 'تسليم مشاريع' },
  { en: 'quality assurance', ar: 'ضمان الجودة' },
];

export default function AdminProjects() {
  const { t, isRTL } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<Partial<Project>>({
    title_ar: '', title_en: '', description_ar: '', description_en: '',
    image: '', date: new Date().toISOString().split('T')[0],
    location: '', is_featured: false, is_active: true, keywords: ''
  });

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, pageSize]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load projects', 'فشل تحميل المشاريع'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title_ar || !formData.title_en) {
        toast.error(t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
        return;
      }
      const dataToSave = {
        title_ar: formData.title_ar, title_en: formData.title_en,
        description_ar: formData.description_ar, description_en: formData.description_en,
        image: formData.image, date: formData.date, location: formData.location,
        is_featured: formData.is_featured,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        keywords: formData.keywords
      };
      
      if (editingProject) {
        const { error } = await supabase.from('projects').update(dataToSave).eq('id', editingProject.id);
        if (error) throw error;
        toast.success(t('Project updated successfully', 'تم تحديث المشروع بنجاح'));
      } else {
        const { error } = await supabase.from('projects').insert([dataToSave]);
        if (error) throw error;
        toast.success(t('Project created successfully', 'تم إنشاء المشروع بنجاح'));
      }
      if (dataToSave.is_active) {
        pingIndexNowForEntity({ type: 'project', titleEn: dataToSave.title_en });
      }
      setIsDialogOpen(false);
      setEditingProject(null);
      resetForm();
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this project?', 'هل أنت متأكد من حذف هذا المشروع؟'))) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('Project deleted successfully', 'تم حذف المشروع بنجاح'));
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(t(`Delete ${selectedIds.length} projects?`, `حذف ${selectedIds.length} مشاريع؟`))) return;
    try {
      const { error } = await supabase.from('projects').delete().in('id', selectedIds);
      if (error) throw error;
      toast.success(t(`${selectedIds.length} projects deleted`, `تم حذف ${selectedIds.length} مشاريع`));
      setSelectedIds([]);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkStatusChange = async (status: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const { error } = await supabase.from('projects').update({ is_active: status }).in('id', selectedIds);
      if (error) throw error;
      toast.success(t(
        status ? `${selectedIds.length} projects activated` : `${selectedIds.length} projects deactivated`,
        status ? `تم تفعيل ${selectedIds.length} مشاريع` : `تم إلغاء تفعيل ${selectedIds.length} مشاريع`
      ));
      setSelectedIds([]);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === paginatedProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProjects.map(p => p.id));
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['ID', 'Title (EN)', 'Title (AR)', 'Location', 'Date', 'Featured', 'Active'];
    const rows = filteredProjects.map(p => [
      p.id, p.title_en, p.title_ar, p.location || '', p.date || '',
      p.is_featured ? 'Yes' : 'No', p.is_active !== false ? 'Active' : 'Inactive'
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `projects_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(t('Projects exported successfully', 'تم تصدير المشاريع بنجاح'));
  };

  const resetForm = () => {
    setFormData({
      title_ar: '', title_en: '', description_ar: '', description_en: '',
      image: '', date: new Date().toISOString().split('T')[0],
      location: '', is_featured: false, is_active: true, keywords: ''
    });
  };

  const addKeyword = (keyword: string) => {
    const current = formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (!current.includes(keyword)) {
      setFormData({ ...formData, keywords: [...current, keyword].join(', ') });
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData(project);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredProjects = projects.filter(project =>
    project.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.title_ar.includes(searchTerm)
  );

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Projects Management', 'إدارة المشاريع')}</h1>
          <p className="text-muted-foreground mt-1">
            {t(`Showing ${filteredProjects.length} of ${projects.length} projects`, `عرض ${filteredProjects.length} من ${projects.length} مشروع`)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            {t('Export CSV', 'تصدير CSV')}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('Add Project', 'إضافة مشروع')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? t('Edit Project', 'تعديل المشروع') : t('Add New Project', 'إضافة مشروع جديد')}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Title (English)', 'العنوان (إنجليزي)')}</Label>
                    <Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{t('Title (Arabic)', 'العنوان (عربي)')}</Label>
                    <Input value={formData.title_ar} onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Description (English)', 'الوصف (إنجليزي)')}</Label>
                    <Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} rows={4} />
                  </div>
                  <div>
                    <Label>{t('Description (Arabic)', 'الوصف (عربي)')}</Label>
                    <Textarea value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} rows={4} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Location', 'الموقع')}</Label>
                    <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div>
                    <Label>{t('Date', 'التاريخ')}</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{t('Image', 'الصورة')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.image || ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder={t('Image URL or upload', 'رابط الصورة أو رفع')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => document.getElementById('project-image-upload')?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <input
                      id="project-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(t('File size must be less than 5MB', 'يجب أن يكون حجم الملف أقل من 5 ميجابايت'));
                          return;
                        }
                        const ext = file.name.split('.').pop();
                        const fileName = `${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from('projects').upload(fileName, file);
                        if (error) {
                          toast.error(error.message);
                          return;
                        }
                        const { data: urlData } = supabase.storage.from('projects').getPublicUrl(fileName);
                        setFormData({ ...formData, image: urlData.publicUrl });
                        toast.success(t('Image uploaded', 'تم رفع الصورة'));
                      }}
                    />
                  </div>
                  {formData.image && (
                    <div className="mt-2 relative inline-block">
                      <img src={formData.image} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>{t('Keywords (SEO)', 'الكلمات المفتاحية (SEO)')}</Label>
                  <Input
                    value={formData.keywords || ''}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder={t('e.g. construction, building, residential', 'مثال: بناء، مواد بناء، سكني')}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {SUGGESTED_KEYWORDS.map((kw) => {
                      const label = `${kw.en} / ${kw.ar}`;
                      const currentKeywords = formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [];
                      const isSelected = currentKeywords.includes(kw.en) || currentKeywords.includes(kw.ar);
                      return (
                        <Badge
                          key={kw.en}
                          variant={isSelected ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          onClick={() => addKeyword(`${kw.en}, ${kw.ar}`)}
                        >
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
                    <Label>{t('Featured Project', 'مشروع مميز')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                    <Label>{t('Active', 'نشط')}</Label>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>{t('Cancel', 'إلغاء')}</Button>
                  <Button type="submit">{editingProject ? t('Update', 'تحديث') : t('Create', 'إنشاء')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('Search projects...', 'البحث عن المشاريع...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="border-primary">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">
                {t(`${selectedIds.length} selected`, `${selectedIds.length} محدد`)}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange(true)} className="gap-2">
                  <CheckCircle className="h-4 w-4" />{t('Activate', 'تفعيل')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange(false)} className="gap-2">
                  <XCircle className="h-4 w-4" />{t('Deactivate', 'إلغاء التفعيل')}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" />{t('Delete', 'حذف')}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>{t('Clear Selection', 'مسح التحديد')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedProjects.length > 0 && selectedIds.length === paginatedProjects.length}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>{t('Image', 'الصورة')}</TableHead>
              <TableHead>{t('Title', 'العنوان')}</TableHead>
              <TableHead>{t('Location', 'الموقع')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
              <TableHead className="text-right">{t('Actions', 'الإجراءات')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">{t('Loading...', 'جاري التحميل...')}</TableCell>
              </TableRow>
            ) : paginatedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">{t('No projects found', 'لا توجد مشاريع')}</TableCell>
              </TableRow>
            ) : (
              paginatedProjects.map((project) => (
                <TableRow key={project.id} className={selectedIds.includes(project.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox checked={selectedIds.includes(project.id)} onCheckedChange={() => toggleSelection(project.id)} />
                  </TableCell>
                  <TableCell>
                    {project.image && (
                      <img src={project.image} alt={isRTL ? project.title_ar : project.title_en} className="w-16 h-16 object-cover rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{isRTL ? project.title_ar : project.title_en}</TableCell>
                  <TableCell>{project.location}</TableCell>
                  <TableCell>{project.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {project.is_active !== false ? (
                        <Badge variant="default">{t('Active', 'نشط')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('Inactive', 'غير نشط')}</Badge>
                      )}
                      {project.is_featured && <Badge variant="secondary">{t('Featured', 'مميز')}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(project)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">{t('Rows per page:', 'عدد الصفوف:')}</Label>
            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t(`Page ${currentPage} of ${totalPages} (${filteredProjects.length} items)`, `صفحة ${currentPage} من ${totalPages} (${filteredProjects.length} عنصر)`)}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" /><ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" /><ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
