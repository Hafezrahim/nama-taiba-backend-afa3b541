
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
  ('ga4_id', ''),
  ('ga4_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;
