DROP POLICY IF EXISTS "Anyone can submit marketer application" ON public.marketer_applications;
CREATE POLICY "Anyone can submit marketer application"
ON public.marketer_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 120
  AND char_length(btrim(phone)) BETWEEN 3 AND 40
  AND char_length(btrim(city)) BETWEEN 1 AND 120
  AND char_length(btrim(total_experience)) BETWEEN 1 AND 160
  AND (message IS NULL OR octet_length(message) <= 10000)
  AND is_processed IS DISTINCT FROM true
  AND (created_at IS NULL OR created_at <= now())
  AND (
    (cv_file_data IS NULL AND cv_file_name IS NULL AND cv_file_type IS NULL)
    OR (
      cv_file_data IS NOT NULL
      AND cv_file_name IS NOT NULL
      AND char_length(btrim(cv_file_name)) BETWEEN 1 AND 255
      AND cv_file_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/jpg')
      AND octet_length(cv_file_data) <= 7340032
      AND cv_file_data ~ ('^data:' || cv_file_type || ';base64,[A-Za-z0-9+/]+={0,2}$')
    )
  )
);

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 160
  AND char_length(btrim(email)) BETWEEN 3 AND 254
  AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
  AND (phone IS NULL OR octet_length(phone) <= 80)
  AND (subject IS NULL OR octet_length(subject) <= 500)
  AND char_length(btrim(message)) BETWEEN 1 AND 20000
  AND is_read IS DISTINCT FROM true
  AND (created_at IS NULL OR created_at <= now())
);

DROP POLICY IF EXISTS "Anyone can submit quote request" ON public.quote_requests;
CREATE POLICY "Anyone can submit quote request"
ON public.quote_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 160
  AND char_length(btrim(email)) BETWEEN 3 AND 254
  AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
  AND (phone IS NULL OR octet_length(phone) <= 80)
  AND (company IS NULL OR octet_length(company) <= 250)
  AND (
    company IS NULL
    OR company NOT LIKE 'marketer:%'
    OR company = 'marketer:' || auth.uid()::text
  )
  AND (message IS NULL OR octet_length(message) <= 50000)
  AND (quantity IS NULL OR quantity BETWEEN 1 AND 1000000)
  AND is_processed IS DISTINCT FROM true
  AND admin_reply IS NULL
  AND (created_at IS NULL OR created_at <= now())
);

DROP POLICY IF EXISTS "Allow authenticated users to update quotes" ON public.quote_requests;

DROP POLICY IF EXISTS "Anyone can submit orders" ON public.orders;
CREATE POLICY "Anyone can submit orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND has_role(auth.uid(), 'client'::app_role))
  )
  AND status = 'pending'
  AND char_length(btrim(customer_name)) BETWEEN 1 AND 160
  AND char_length(btrim(customer_phone)) BETWEEN 3 AND 40
  AND char_length(btrim(customer_address)) BETWEEN 1 AND 2000
  AND subtotal BETWEEN 0 AND 1000000000
  AND shipping BETWEEN 0 AND 1000000000
  AND discount BETWEEN 0 AND 1000000000
  AND total BETWEEN 0 AND 1000000000
  AND (notes IS NULL OR octet_length(notes) <= 10000)
  AND (reference_source IS NULL OR octet_length(reference_source) <= 250)
  AND (created_at IS NULL OR created_at <= now())
);

DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Site settings are viewable by everyone"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  setting_key IN (
    'company_profile_url',
    'ga4_enabled',
    'ga4_id',
    'gtm_enabled',
    'gtm_id',
    'meta_author',
    'meta_canonical_url',
    'meta_robots',
    'meta_theme_color',
    'meta_twitter_handle',
    'seo_description_ar',
    'seo_description_en',
    'seo_keywords',
    'seo_og_image',
    'seo_title_ar',
    'seo_title_en'
  )
);