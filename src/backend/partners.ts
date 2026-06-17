import { supabase, handleError } from './config';

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description_ar: string;
  description_en: string;
}

export const getPartners = async (): Promise<Partner[]> => {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      logo: row.logo || '',
      description_ar: row.description_ar || '',
      description_en: row.description_en || ''
    }));
  } catch (error) {
    handleError(error, 'fetch partners');
    return [];
  }
};
