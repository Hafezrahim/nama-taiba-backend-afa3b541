import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  downloadTemplate,
  parseExcelFile,
  PRODUCT_TEMPLATE_HEADERS,
  PRODUCT_TEMPLATE_SAMPLE,
  CATEGORY_TEMPLATE_HEADERS,
  CATEGORY_TEMPLATE_SAMPLE,
  normalizeProductRow,
  normalizeCategoryRow,
} from '@/utils/excelImport';

interface Props {
  type: 'products' | 'categories';
  onImported?: () => void;
}

export default function ExcelImportButtons({ type, onImported }: Props) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleDownloadTemplate = () => {
    if (type === 'products') {
      downloadTemplate('products-template.xlsx', PRODUCT_TEMPLATE_HEADERS, PRODUCT_TEMPLATE_SAMPLE);
    } else {
      downloadTemplate('categories-template.xlsx', CATEGORY_TEMPLATE_HEADERS, CATEGORY_TEMPLATE_SAMPLE);
    }
    toast.success(t('Template downloaded', 'تم تنزيل القالب'));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const rows = await parseExcelFile(file);
      if (!rows.length) throw new Error(t('No rows found', 'لا توجد صفوف'));

      const table = type === 'products' ? 'products' : 'categories';
      const normalized = rows.map((r) =>
        type === 'products' ? normalizeProductRow(r) : normalizeCategoryRow(r)
      );

      // Validate required fields
      const invalid = normalized.find((r: any) =>
        type === 'products'
          ? !r.name_en || !r.name_ar || !r.category
          : !r.name_en || !r.name_ar || !r.slug
      );
      if (invalid) throw new Error(t('Missing required fields in some rows', 'حقول مطلوبة مفقودة في بعض الصفوف'));

      const { error } = await supabase.from(table).insert(normalized as any);
      if (error) throw error;

      toast.success(t(`Imported ${normalized.length} rows`, `تم استيراد ${normalized.length} صف`));
      onImported?.();
    } catch (err: any) {
      toast.error(err.message || t('Import failed', 'فشل الاستيراد'));
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
        <FileDown className="h-4 w-4" />
        {t('Template', 'قالب')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        className="gap-2"
      >
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        {t('Import Excel', 'استيراد Excel')}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
