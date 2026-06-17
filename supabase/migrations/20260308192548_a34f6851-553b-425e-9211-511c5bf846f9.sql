
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text DEFAULT '',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Site settings are viewable by everyone"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert default SEO/GTM settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('seo_title_en', 'Nama Taiba | Building Materials & Construction Solutions'),
  ('seo_title_ar', 'نما طيبة | مواد البناء والحلول الإنشائية'),
  ('seo_description_en', 'Nama Taiba Factory - Leading manufacturer of premium building materials, GRC, GRP, and modern construction solutions in Saudi Arabia'),
  ('seo_description_ar', 'مصنع نما طيبة - مصنع رائد لمواد البناء عالية الجودة والحلول الإنشائية الحديثة في المملكة العربية السعودية'),
  ('seo_keywords', 'building materials, construction, GRC, GRP, Saudi Arabia, Nama Taiba, مصنع نما طيبة, مواد بناء'),
  ('seo_og_image', ''),
  ('gtm_id', ''),
  ('gtm_enabled', 'false'),
  ('meta_author', 'Nama Taiba'),
  ('meta_robots', 'index, follow'),
  ('meta_canonical_url', 'https://www.nama-taiba.com'),
  ('meta_twitter_handle', '@namataiba'),
  ('meta_theme_color', '#6b2fa0');
