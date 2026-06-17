
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
