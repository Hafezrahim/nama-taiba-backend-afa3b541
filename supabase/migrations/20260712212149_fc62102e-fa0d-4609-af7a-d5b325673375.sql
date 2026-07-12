
CREATE TABLE public.quality_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  content_en TEXT,
  content_ar TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quality_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_sections TO authenticated;
GRANT ALL ON public.quality_sections TO service_role;

ALTER TABLE public.quality_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active quality sections"
  ON public.quality_sections FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage quality sections"
  ON public.quality_sections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_quality_sections_updated_at
  BEFORE UPDATE ON public.quality_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
