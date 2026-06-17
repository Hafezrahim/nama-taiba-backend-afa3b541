import { supabase, handleError } from './config';

export interface Testimonial {
  id: string;
  nameAr: string;
  nameEn: string;
  positionAr: string;
  positionEn: string;
  contentAr: string;
  contentEn: string;
  rating: number;
  avatar?: string;
  isFeatured: boolean;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      positionAr: row.position_ar || '',
      positionEn: row.position_en || '',
      contentAr: row.content_ar,
      contentEn: row.content_en,
      rating: row.rating || 5,
      avatar: row.avatar,
      isFeatured: row.is_featured || false
    }));
  } catch (error) {
    handleError(error, 'fetch testimonials');
    return [];
  }
};
