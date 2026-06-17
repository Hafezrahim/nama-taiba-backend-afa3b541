-- Add company profile URL setting key (uses existing site_settings or about_info)
-- Create documents bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view documents
CREATE POLICY "Documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Admins can upload
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed company_profile_url setting if not exists
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('company_profile_url', 'https://www.nama-taiba.com/public/frontend/img/nama/NamaTaiba-profile.pdf')
ON CONFLICT DO NOTHING;