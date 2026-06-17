import { useState, useEffect, useMemo } from 'react';
import { pingIndexNowForEntity } from '@/utils/indexNow';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, ChevronDown, Globe, Eye, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import AdminTablePagination from '@/components/admin/AdminTablePagination';

interface Blog {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar?: string;
  content_en?: string;
  image?: string;
  author?: string;
  slug?: string;
  is_published: boolean;
  published_date?: string;
  meta_title_ar?: string;
  meta_title_en?: string;
  meta_description_ar?: string;
  meta_description_en?: string;
  keywords?: string;
  featured_image?: string;
  read_time?: number;
}

export default function AdminBlogs() {
  const { t, isRTL } = useLanguage();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Blog>>({
    title_ar: '',
    title_en: '',
    content_ar: '',
    content_en: '',
    image: '',
    author: '',
    slug: '',
    is_published: false,
    published_date: new Date().toISOString().split('T')[0],
    meta_title_ar: '',
    meta_title_en: '',
    meta_description_ar: '',
    meta_description_en: '',
    keywords: '',
    featured_image: '',
    read_time: 5
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Image must be less than 5MB', 'يجب أن تكون الصورة أقل من 5 ميجابايت'));
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('blogs').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('blogs').getPublicUrl(fileName);
      setFormData({ ...formData, image: publicUrl });
      toast.success(t('Image uploaded', 'تم رفع الصورة'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error: any) {
      toast.error(t('Failed to load blogs', 'فشل تحميل المقالات'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.title_ar || !formData.title_en) {
        toast.error(t('Please fill all required fields', 'يرجى ملء جميع الحقول المطلوبة'));
        return;
      }

      // Auto-generate slug from title if not provided
      const slug = formData.slug || formData.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const dataToSave = {
        title_ar: formData.title_ar,
        title_en: formData.title_en,
        content_ar: formData.content_ar || '',
        content_en: formData.content_en || '',
        image: formData.image || '',
        author: formData.author || '',
        slug,
        is_published: formData.is_published || false,
        published_date: formData.published_date,
        meta_title_ar: formData.meta_title_ar,
        meta_title_en: formData.meta_title_en,
        meta_description_ar: formData.meta_description_ar,
        meta_description_en: formData.meta_description_en,
        keywords: formData.keywords,
        featured_image: formData.featured_image,
        read_time: formData.read_time || 5
      };
      
      if (editingBlog) {
        const { error } = await supabase
          .from('blogs')
          .update(dataToSave)
          .eq('id', editingBlog.id);

        if (error) throw error;
        toast.success(t('Blog updated successfully', 'تم تحديث المقالة بنجاح'));
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success(t('Blog created successfully', 'تم إنشاء المقالة بنجاح'));
      }
      if (dataToSave.is_published) {
        pingIndexNowForEntity({ type: 'blog', slug: dataToSave.slug, titleEn: dataToSave.title_en });
      }

      setIsDialogOpen(false);
      setEditingBlog(null);
      resetForm();
      fetchBlogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this blog?', 'هل أنت متأكد من حذف هذه المقالة؟'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('Blog deleted successfully', 'تم حذف المقالة بنجاح'));
      fetchBlogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: '',
      image: '',
      author: '',
      slug: '',
      is_published: false,
      published_date: new Date().toISOString().split('T')[0],
      meta_title_ar: '',
      meta_title_en: '',
      meta_description_ar: '',
      meta_description_en: '',
      keywords: '',
      featured_image: '',
      read_time: 5
    });
  };

  const openEditDialog = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData(blog);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingBlog(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.title_ar.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredBlogs.length / rowsPerPage);
  const paginatedBlogs = filteredBlogs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Blogs Management', 'إدارة المقالات')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('Add Blog', 'إضافة مقالة')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBlog 
                  ? t('Edit Blog', 'تعديل المقالة')
                  : t('Add New Blog', 'إضافة مقالة جديدة')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('Title (English)', 'العنوان (إنجليزي)')}</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t('Title (Arabic)', 'العنوان (عربي)')}</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('Content (English)', 'المحتوى (إنجليزي)')}</Label>
                  <RichTextEditor
                    value={formData.content_en || ''}
                    onChange={(value) => setFormData({ ...formData, content_en: value })}
                    placeholder={t('Write your blog content here...', 'اكتب محتوى المقالة هنا...')}
                    dir="ltr"
                    minHeight="250px"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('Content (Arabic)', 'المحتوى (عربي)')}</Label>
                  <RichTextEditor
                    value={formData.content_ar || ''}
                    onChange={(value) => setFormData({ ...formData, content_ar: value })}
                    placeholder={t('اكتب محتوى المقالة هنا...', 'اكتب محتوى المقالة هنا...')}
                    dir="rtl"
                    minHeight="250px"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('Author', 'الكاتب')}</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('Slug', 'الرابط')}</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder={t('Auto-generated if empty', 'سيتم التوليد تلقائياً')}
                  />
                </div>
                <div>
                  <Label>{t('Read Time (min)', 'وقت القراءة (دقيقة)')}</Label>
                  <Input
                    type="number"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('Blog Image', 'صورة المقالة')}</Label>
                  {formData.image ? (
                    <div className="relative mt-2">
                      <img src={formData.image} alt="Blog" className="w-full h-32 object-cover rounded-lg border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setFormData({ ...formData, image: '' })}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{uploading ? t('Uploading...', 'جارِ الرفع...') : t('Upload image (max 5MB)', 'رفع صورة (حد أقصى 5MB)')}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                      <Input className="mt-2" placeholder={t('Or paste image URL', 'أو الصق رابط الصورة')} value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
                    </div>
                  )}
                </div>
                <div>
                  <Label>{t('Published Date', 'تاريخ النشر')}</Label>
                  <Input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                  />
                </div>
              </div>

              {/* ── SEO Section ── */}
              <Separator />
              <Collapsible defaultOpen={!!editingBlog}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" type="button" className="w-full flex items-center justify-between px-0 hover:bg-transparent">
                    <span className="flex items-center gap-2 text-base font-semibold">
                      <Globe className="h-4 w-4 text-primary" />
                      {t('SEO Settings', 'إعدادات تحسين محركات البحث')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  {/* Meta Titles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1.5">
                        {t('Meta Title (English)', 'عنوان الميتا (إنجليزي)')}
                        <span className="text-[10px] text-muted-foreground">({(formData.meta_title_en || '').length}/60)</span>
                      </Label>
                      <Input
                        value={formData.meta_title_en}
                        onChange={(e) => setFormData({ ...formData, meta_title_en: e.target.value })}
                        placeholder={t('SEO title for search engines', 'عنوان تحسين محركات البحث')}
                        maxLength={60}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5">
                        {t('Meta Title (Arabic)', 'عنوان الميتا (عربي)')}
                        <span className="text-[10px] text-muted-foreground">({(formData.meta_title_ar || '').length}/60)</span>
                      </Label>
                      <Input
                        value={formData.meta_title_ar}
                        onChange={(e) => setFormData({ ...formData, meta_title_ar: e.target.value })}
                        placeholder={t('عنوان تحسين محركات البحث', 'عنوان تحسين محركات البحث')}
                        maxLength={60}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Meta Descriptions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1.5">
                        {t('Meta Description (English)', 'وصف الميتا (إنجليزي)')}
                        <span className="text-[10px] text-muted-foreground">({(formData.meta_description_en || '').length}/160)</span>
                      </Label>
                      <Textarea
                        value={formData.meta_description_en}
                        onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                        placeholder={t('Brief description for search results (max 160 chars)', 'وصف مختصر لنتائج البحث')}
                        maxLength={160}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5">
                        {t('Meta Description (Arabic)', 'وصف الميتا (عربي)')}
                        <span className="text-[10px] text-muted-foreground">({(formData.meta_description_ar || '').length}/160)</span>
                      </Label>
                      <Textarea
                        value={formData.meta_description_ar}
                        onChange={(e) => setFormData({ ...formData, meta_description_ar: e.target.value })}
                        placeholder={t('وصف مختصر لنتائج البحث', 'وصف مختصر لنتائج البحث')}
                        maxLength={160}
                        rows={3}
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <Label className="flex items-center gap-1.5">
                      {t('Keywords', 'الكلمات المفتاحية')}
                      <span className="text-[10px] text-muted-foreground">{t('(comma separated, EN & AR)', '(مفصولة بفواصل، عربي وإنجليزي)')}</span>
                    </Label>
                    <Textarea
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder={t('e.g. steel pipes, industrial solutions, أنابيب فولاذ, حلول صناعية', 'مثال: أنابيب فولاذ, حلول صناعية, steel pipes')}
                      rows={2}
                    />
                  </div>

                  {/* Featured Image for OG */}
                  <div>
                    <Label>{t('Featured Image (OG/Social)', 'الصورة المميزة (للمشاركة)')}</Label>
                    <Input
                      value={formData.featured_image}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      placeholder={t('URL for social sharing image (1200x630 recommended)', 'رابط صورة المشاركة')}
                    />
                  </div>

                  {/* SEO Preview */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      {t('Google Search Preview', 'معاينة نتائج البحث')}
                    </p>
                    <p className="text-primary text-sm font-medium truncate">
                      {formData.meta_title_en || formData.title_en || t('Blog Title', 'عنوان المقالة')}
                    </p>
                    <p className="text-green-700 text-xs truncate">
                      nama.sa/blog/{formData.slug || formData.title_en?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'post-slug'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {formData.meta_description_en || t('Add a meta description to see how this post will appear in search results...', 'أضف وصف الميتا لمعاينة ظهور المقالة في نتائج البحث...')}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator />

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label>{t('Published', 'منشور')}</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('Cancel', 'إلغاء')}
                </Button>
                <Button type="submit">
                  {editingBlog ? t('Update', 'تحديث') : t('Create', 'إنشاء')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('Search blogs...', 'البحث عن المقالات...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Title', 'العنوان')}</TableHead>
              <TableHead>{t('Author', 'الكاتب')}</TableHead>
              <TableHead>{t('Date', 'التاريخ')}</TableHead>
              <TableHead>{t('Status', 'الحالة')}</TableHead>
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
            ) : filteredBlogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t('No blogs found', 'لا توجد مقالات')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedBlogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium">
                    {isRTL ? blog.title_ar : blog.title_en}
                  </TableCell>
                  <TableCell>{blog.author}</TableCell>
                  <TableCell>{blog.published_date}</TableCell>
                  <TableCell>
                    {blog.is_published ? (
                      <Badge variant="default">{t('Published', 'منشور')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('Draft', 'مسودة')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(blog)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(blog.id)}
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

      <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredBlogs.length} itemsPerPage={rowsPerPage} />
    </div>
  );
}