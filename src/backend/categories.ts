import { supabase, handleError } from './config';

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  slug: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
}

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      descriptionAr: row.description_ar,
      descriptionEn: row.description_en,
      slug: row.slug,
      image: row.image,
      displayOrder: row.display_order || 0,
      isActive: row.is_active || false
    }));
  } catch (error) {
    handleError(error, 'fetch categories');
    return [];
  }
};

export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      nameAr: data.name_ar,
      nameEn: data.name_en,
      descriptionAr: data.description_ar,
      descriptionEn: data.description_en,
      slug: data.slug,
      image: data.image,
      displayOrder: data.display_order || 0,
      isActive: data.is_active || false
    };
  } catch (error) {
    handleError(error, 'fetch category by slug');
    return null;
  }
};
