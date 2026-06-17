import { supabase, handleError } from './config';

export interface Project {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  date: string;
  location: string;
  keywords?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      titleEn: row.title_en,
      titleAr: row.title_ar,
      descriptionEn: row.description_en || '',
      descriptionAr: row.description_ar || '',
      image: row.image || '',
      date: row.date || '',
      location: row.location || '',
      keywords: row.keywords || ''
    }));
  } catch (error) {
    handleError(error, 'fetch projects');
    return [];
  }
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      titleEn: data.title_en,
      titleAr: data.title_ar,
      descriptionEn: data.description_en || '',
      descriptionAr: data.description_ar || '',
      image: data.image || '',
      date: data.date || '',
      location: data.location || '',
      keywords: data.keywords || ''
    };
  } catch (error) {
    handleError(error, 'fetch project by id');
    return null;
  }
};
