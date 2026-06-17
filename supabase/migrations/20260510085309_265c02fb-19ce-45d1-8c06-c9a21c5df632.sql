
-- 1) Allow customers to read their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view items of their own orders" ON public.order_items;
CREATE POLICY "Users can view items of their own orders"
ON public.order_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
));

-- 2) Remove sensitive tables from Realtime publication (admin features don't depend on these)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'orders','order_items','profiles','marketer_applications',
    'user_roles','contact_submissions','quote_requests'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN undefined_object OR undefined_table THEN
      -- table not in publication, ignore
      NULL;
    END;
  END LOOP;
END$$;

-- 3) Restrict public storage buckets: allow file READ only (no listing of bucket contents).
-- Drop overly broad policies for our public buckets.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (qual ILIKE '%bucket_id = ''avatars''%'
        OR qual ILIKE '%bucket_id = ''products''%'
        OR qual ILIKE '%bucket_id = ''projects''%'
        OR qual ILIKE '%bucket_id = ''blogs''%'
        OR qual ILIKE '%bucket_id = ''partners''%'
        OR qual ILIKE '%bucket_id = ''documents''%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END$$;

-- Recreate per-bucket SELECT policies that require a specific object name (prevents listing/wildcards)
CREATE POLICY "Public read avatars by path"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public read products by path"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public read projects by path"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'projects' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public read blogs by path"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blogs' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public read partners by path"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partners' AND name IS NOT NULL AND length(name) > 0);

CREATE POLICY "Public read documents by path"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents' AND name IS NOT NULL AND length(name) > 0);

-- 4) Revoke anonymous EXECUTE on SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_user_approved(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_user_approved(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- Blog view counter is invoked from public site; allow anon + authenticated only
REVOKE EXECUTE ON FUNCTION public.increment_blog_views(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(uuid) TO anon, authenticated;
