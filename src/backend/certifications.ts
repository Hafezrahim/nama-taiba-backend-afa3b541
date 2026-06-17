import { supabase, handleError } from './config';

export interface Certification {
  id: string;
  name_ar: string;
  name_en: string;
  image: string;
  type_ar: string;
  type_en: string;
  issued_by_ar: string;
  issued_by_en: string;
}

export const getCertifications = async (): Promise<Certification[]> => {
  try {
    const { data, error } = await supabase
      .from('certifications')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      name_ar: row.name_ar,
      name_en: row.name_en,
      image: row.image || '',
      type_ar: row.type_ar || '',
      type_en: row.type_en || '',
      issued_by_ar: row.issued_by_ar || '',
      issued_by_en: row.issued_by_en || ''
    }));
  } catch (error) {
    handleError(error, 'fetch certifications');
    return [];
  }
};
