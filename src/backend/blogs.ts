import { supabase, handleError } from './config';

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export interface Blog {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  image: string;
  date: string;
  author: string;
  slug: string;
  metaTitleAr?: string;
  metaTitleEn?: string;
  metaDescriptionAr?: string;
  metaDescriptionEn?: string;
  keywords?: string;
  featuredImage?: string;
  readTime?: number;
  viewsCount?: number;
}

export const getBlogs = async (): Promise<Blog[]> => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      contentAr: row.content_ar || '',
      contentEn: row.content_en || '',
      image: row.image || '',
      date: row.published_date || '',
      author: row.author || '',
      slug: row.slug || generateSlug(row.title_en),
      metaTitleAr: row.meta_title_ar,
      metaTitleEn: row.meta_title_en,
      metaDescriptionAr: row.meta_description_ar,
      metaDescriptionEn: row.meta_description_en,
      keywords: row.keywords,
      featuredImage: row.featured_image,
      readTime: row.read_time || 5,
      viewsCount: row.views_count || 0
    }));
  } catch (error) {
    handleError(error, 'fetch blogs');
    return [];
  }
};

export const incrementBlogViews = async (id: string): Promise<void> => {
  try {
    await supabase.rpc('increment_blog_views', { blog_id: id });
  } catch (error) {
    console.error('Error incrementing blog views:', error);
  }
};

export const getBlogById = async (id: string): Promise<Blog | null> => {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      titleAr: data.title_ar,
      titleEn: data.title_en,
      contentAr: data.content_ar || '',
      contentEn: data.content_en || '',
      image: data.image || '',
      date: data.published_date || '',
      author: data.author || '',
      slug: data.slug || generateSlug(data.title_en),
      metaTitleAr: data.meta_title_ar,
      metaTitleEn: data.meta_title_en,
      metaDescriptionAr: data.meta_description_ar,
      metaDescriptionEn: data.meta_description_en,
      keywords: data.keywords,
      featuredImage: data.featured_image,
      readTime: data.read_time || 5,
      viewsCount: data.views_count || 0
    };
  } catch (error) {
    handleError(error, 'fetch blog by id');
    return null;
  }
};
