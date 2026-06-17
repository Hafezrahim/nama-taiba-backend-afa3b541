import * as XLSX from 'xlsx';

export const downloadTemplate = (
  filename: string,
  headers: string[],
  sampleRow: Record<string, any>
) => {
  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, filename);
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows as any[]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const PRODUCT_TEMPLATE_HEADERS = [
  'name_en', 'name_ar', 'description_en', 'description_ar',
  'category', 'size', 'price', 'moq', 'image', 'keywords',
  'is_featured', 'in_stock', 'is_active'
];

export const PRODUCT_TEMPLATE_SAMPLE = {
  name_en: 'Concrete Block 20cm',
  name_ar: 'بلوك خرساني 20 سم',
  description_en: 'High quality concrete block',
  description_ar: 'بلوك خرساني عالي الجودة',
  category: 'blocks',
  size: '20x20x40',
  price: 5.5,
  moq: 100,
  image: '',
  keywords: 'block, concrete',
  is_featured: false,
  in_stock: true,
  is_active: true,
};

export const CATEGORY_TEMPLATE_HEADERS = [
  'name_en', 'name_ar', 'slug', 'description_en', 'description_ar',
  'image', 'display_order', 'is_active'
];

export const CATEGORY_TEMPLATE_SAMPLE = {
  name_en: 'Blocks',
  name_ar: 'بلوكات',
  slug: 'blocks',
  description_en: 'All concrete blocks',
  description_ar: 'جميع البلوكات الخرسانية',
  image: '',
  display_order: 0,
  is_active: true,
};

const toBool = (v: any) => {
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'نعم';
};

export const normalizeProductRow = (row: any) => ({
  name_en: String(row.name_en || '').trim(),
  name_ar: String(row.name_ar || '').trim(),
  description_en: String(row.description_en || '') || null,
  description_ar: String(row.description_ar || '') || null,
  category: String(row.category || '').trim(),
  size: String(row.size || '') || null,
  price: Number(row.price) || 0,
  moq: parseInt(row.moq) || 1,
  image: String(row.image || '') || null,
  keywords: String(row.keywords || '') || null,
  is_featured: toBool(row.is_featured),
  in_stock: row.in_stock === '' ? true : toBool(row.in_stock),
  is_active: row.is_active === '' ? true : toBool(row.is_active),
});

export const normalizeCategoryRow = (row: any) => ({
  name_en: String(row.name_en || '').trim(),
  name_ar: String(row.name_ar || '').trim(),
  slug: String(row.slug || '').trim(),
  description_en: String(row.description_en || '') || null,
  description_ar: String(row.description_ar || '') || null,
  image: String(row.image || '') || null,
  display_order: parseInt(row.display_order) || 0,
  is_active: row.is_active === '' ? true : toBool(row.is_active),
});
