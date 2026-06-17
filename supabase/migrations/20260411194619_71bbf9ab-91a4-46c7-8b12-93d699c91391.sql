
INSERT INTO storage.buckets (id, name, public)
VALUES ('blogs', 'blogs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('partners', 'partners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blogs');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blogs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'blogs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blogs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view partner images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partners');

CREATE POLICY "Admins can upload partner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'partners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update partner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'partners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete partner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'partners' AND public.has_role(auth.uid(), 'admin'));
