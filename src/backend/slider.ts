import { supabase, handleError } from './config';

export interface SliderItem {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  image: string;
  link?: string;
  buttonTextAr?: string;
  buttonTextEn?: string;
  displayOrder: number;
  isActive: boolean;
}

export const getSliderItems = async (): Promise<SliderItem[]> => {
  try {
    const { data, error } = await supabase
      .from('slider')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      subtitleAr: row.subtitle_ar,
      subtitleEn: row.subtitle_en,
      descriptionAr: row.description_ar,
      descriptionEn: row.description_en,
      image: row.image,
      link: row.link,
      buttonTextAr: row.button_text_ar,
      buttonTextEn: row.button_text_en,
      displayOrder: row.display_order || 0,
      isActive: row.is_active || false
    }));
  } catch (error) {
    handleError(error, 'fetch slider items');
    return [];
  }
};
