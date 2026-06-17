
-- Create categories table for products
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories are viewable by everyone
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Add index for slug lookups
CREATE INDEX idx_categories_slug ON public.categories(slug);

-- Create profiles table for users (following Supabase best practices)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name_ar TEXT,
  full_name_en TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio_ar TEXT,
  bio_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name_en, full_name_ar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'full_name_ar', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create slider table for homepage carousel
CREATE TABLE public.slider (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  subtitle_ar TEXT,
  subtitle_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  image TEXT NOT NULL,
  link TEXT,
  button_text_ar TEXT,
  button_text_en TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for slider
ALTER TABLE public.slider ENABLE ROW LEVEL SECURITY;

-- Slider items are viewable by everyone
CREATE POLICY "Slider items are viewable by everyone" 
ON public.slider 
FOR SELECT 
USING (is_active = true);

-- Add index for ordering
CREATE INDEX idx_slider_order ON public.slider(display_order);

-- Add SEO columns to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS meta_title_ar TEXT,
ADD COLUMN IF NOT EXISTS meta_title_en TEXT,
ADD COLUMN IF NOT EXISTS meta_description_ar TEXT,
ADD COLUMN IF NOT EXISTS meta_description_en TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT,
ADD COLUMN IF NOT EXISTS featured_image TEXT,
ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add index for slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);

-- Add index for keywords search
CREATE INDEX IF NOT EXISTS idx_blogs_keywords ON public.blogs USING gin(to_tsvector('english', keywords));

-- Add trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on slider
CREATE TRIGGER update_slider_updated_at
BEFORE UPDATE ON public.slider
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.categories (name_ar, name_en, slug, description_ar, description_en, display_order, is_active) VALUES
('إسمنت', 'Cement', 'cement', 'جميع أنواع الإسمنت والخلطات الجافة', 'All types of cement and dry mixes', 1, true),
('حديد تسليح', 'Steel', 'steel', 'حديد التسليح بمختلف الأقطار والأنواع', 'Reinforcement steel in various diameters and types', 2, true),
('رمل وحصى', 'Sand & Gravel', 'sand-gravel', 'رمل وحصى البناء بأنواعه', 'Construction sand and gravel of all types', 3, true),
('طوب وبلوك', 'Brick', 'brick', 'الطوب والبلوك الأحمر والأسمنتي', 'Red and cement bricks and blocks', 4, true),
('جبس وديكور', 'Gypsum', 'gypsum', 'مواد الجبس والديكورات الداخلية', 'Gypsum and interior decoration materials', 5, true),
('دهانات', 'Paint', 'paint', 'الدهانات الداخلية والخارجية', 'Interior and exterior paints', 6, true),
('بلاط وسيراميك', 'Tiles', 'tiles', 'البلاط والسيراميك والبورسلان', 'Tiles, ceramics, and porcelain', 7, true),
('أخشاب', 'Wood', 'wood', 'الأخشاب ومشتقاتها', 'Wood and wood products', 8, true);

-- Insert sample slider items
INSERT INTO public.slider (title_ar, title_en, subtitle_ar, subtitle_en, description_ar, description_en, image, link, button_text_ar, button_text_en, display_order, is_active) VALUES
('مواد بناء عالية الجودة', 'High Quality Building Materials', 'أفضل الأسعار في المملكة', 'Best Prices in the Kingdom', 'نوفر لكم جميع احتياجاتكم من مواد البناء بأعلى جودة وأفضل الأسعار', 'We provide all your building material needs with the highest quality and best prices', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200', '/products', 'تصفح المنتجات', 'Browse Products', 1, true),
('عروض خاصة لفترة محدودة', 'Special Offers for Limited Time', 'خصومات تصل إلى 25%', 'Discounts up to 25%', 'استفد من عروضنا الحصرية على مختلف مواد البناء', 'Take advantage of our exclusive offers on various building materials', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200', '/offers', 'اطلع على العروض', 'View Offers', 2, true),
('خدمة توصيل سريعة', 'Fast Delivery Service', 'نصل إليك أينما كنت', 'We reach you wherever you are', 'خدمة توصيل احترافية لجميع مناطق المملكة', 'Professional delivery service to all regions of the Kingdom', 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1200', '/contact', 'اتصل بنا', 'Contact Us', 3, true);
