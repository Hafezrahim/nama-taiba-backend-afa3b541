import { supabase, handleError } from './config';

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  category: string;
  size: string;
  price: number;
  isFeatured: boolean;
  inStock: boolean;
  keywords?: string;
  slug: string;
  moq: number;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      descriptionAr: row.description_ar || '',
      descriptionEn: row.description_en || '',
      image: row.image || '',
      category: row.category,
      size: row.size || '',
      price: Number(row.price) || 0,
      isFeatured: row.is_featured || false,
      inStock: row.in_stock || false,
      keywords: row.keywords || '',
      slug: generateSlug(row.name_en),
      moq: row.moq || 1
    }));
  } catch (error) {
    handleError(error, 'fetch products');
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      nameAr: data.name_ar,
      nameEn: data.name_en,
      descriptionAr: data.description_ar || '',
      descriptionEn: data.description_en || '',
      image: data.image || '',
      category: data.category,
      size: data.size || '',
      price: Number(data.price) || 0,
      isFeatured: data.is_featured || false,
      inStock: data.in_stock || false,
      keywords: data.keywords || '',
      slug: generateSlug(data.name_en),
      moq: data.moq || 1
    };
  } catch (error) {
    handleError(error, 'fetch product by id');
    return null;
  }
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('in_stock', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      descriptionAr: row.description_ar || '',
      descriptionEn: row.description_en || '',
      image: row.image || '',
      category: row.category,
      size: row.size || '',
      price: Number(row.price) || 0,
      isFeatured: row.is_featured || false,
      inStock: row.in_stock || false,
      keywords: row.keywords || '',
      slug: generateSlug(row.name_en),
      moq: row.moq || 1
    }));
  } catch (error) {
    handleError(error, 'fetch featured products');
    return [];
  }
};
