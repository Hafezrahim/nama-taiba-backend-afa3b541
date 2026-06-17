import { supabase, handleError } from './config';

export interface Service {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconName: string;
}

export const getServices = async (): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      titleEn: row.title_en,
      titleAr: row.title_ar,
      descriptionEn: row.description_en || '',
      descriptionAr: row.description_ar || '',
      iconName: row.icon_name || 'chevron-right'
    }));
  } catch (error) {
    handleError(error, 'fetch services');
    return [];
  }
};
