import { supabase, handleError } from './config';

export interface Offer {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  validUntil: string;
  price: number;
  maxQty: number;
  minQty: number;
  category: string;
  contact: string;
}

export const getOffers = async (): Promise<Offer[]> => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      descriptionAr: row.description_ar || '',
      descriptionEn: row.description_en || '',
      image: row.image || '',
      validUntil: row.valid_until || '',
      price: Number(row.price) || 0,
      minQty: row.min_qty || 1,
      maxQty: row.max_qty || 1,
      category: row.category,
      contact: row.contact || ''
    }));
  } catch (error) {
    handleError(error, 'fetch offers');
    return [];
  }
};

export const getOfferById = async (id: string): Promise<Offer | null> => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      titleAr: data.title_ar,
      titleEn: data.title_en,
      descriptionAr: data.description_ar || '',
      descriptionEn: data.description_en || '',
      image: data.image || '',
      validUntil: data.valid_until || '',
      price: Number(data.price) || 0,
      minQty: data.min_qty || 1,
      maxQty: data.max_qty || 1,
      category: data.category,
      contact: data.contact || ''
    };
  } catch (error) {
    handleError(error, 'fetch offer by id');
    return null;
  }
};

export const getOfferCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const categoriesSet = new Set<string>();
    (data || []).forEach((row: any) => {
      if (row.category) categoriesSet.add(row.category);
    });

    return Array.from(categoriesSet);
  } catch (error) {
    handleError(error, 'fetch offer categories');
    return [];
  }
};
