DROP POLICY IF EXISTS "Anyone can record a page view" ON public.page_views;
CREATE POLICY "Anyone can record a page view"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(path) BETWEEN 1 AND 2048
  AND octet_length(path) <= 8192
  AND path LIKE '/%'
  AND path !~ '[[:space:][:cntrl:]]'
  AND lower(path) NOT IN ('/admin', '/client', '/marketer')
  AND lower(path) NOT LIKE '/admin/%'
  AND lower(path) NOT LIKE '/client/%'
  AND lower(path) NOT LIKE '/marketer/%'
  AND (page_title IS NULL OR (char_length(page_title) <= 300 AND octet_length(page_title) <= 1200))
  AND (language IS NULL OR language IN ('en', 'ar'))
  AND (referrer IS NULL OR (char_length(referrer) <= 2048 AND octet_length(referrer) <= 8192))
  AND created_at >= now() - interval '5 minutes'
  AND created_at <= now() + interval '5 minutes'
);