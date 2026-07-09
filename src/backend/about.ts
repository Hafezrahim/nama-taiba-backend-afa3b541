import { supabase, handleError } from './config';

export interface AboutInfo {
  vision: { content_ar: string; content_en: string; image?: string };
  mission: { content_ar: string; content_en: string; image?: string };
  history: { content_ar: string; content_en: string; image?: string };
}

export const getAboutInfo = async (): Promise<AboutInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('about_info')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    const aboutInfo: { [key: string]: { content_ar: string; content_en: string; image?: string } } = {};
    
    (data || []).forEach((row: any) => {
      aboutInfo[row.section_key] = {
        content_ar: row.content_ar,
        content_en: row.content_en,
        image: row.image
      };
    });

    return {
      vision: aboutInfo.vision || { 
        content_ar: 'رؤيتنا هي أن نكون المصنع الأول في المملكة للجودة والخدمات', 
        content_en: 'Our vision is to be the top manufacturer in Saudi Arabia for quality'
      },
      mission: aboutInfo.mission || { 
        content_ar: 'تقديم منتجات بلوك بمعايير عالمية', 
        content_en: 'Deliver block products with global standards'
      },
      history: aboutInfo.history || { 
        content_ar: 'تأسس المصنع في 2016 في المدينة المنورة', 
        content_en: 'Established in 2016 in Madinah'
      }
    };
  } catch (error) {
    handleError(error, 'fetch about info');
    return null;
  }
};
