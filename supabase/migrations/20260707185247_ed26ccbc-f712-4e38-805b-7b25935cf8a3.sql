
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_title_ar TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_description_ar TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords_en TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords_ar TEXT;
