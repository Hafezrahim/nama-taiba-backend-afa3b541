
CREATE OR REPLACE FUNCTION public.increment_blog_views(blog_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blogs SET views_count = COALESCE(views_count, 0) + 1 WHERE id = blog_id;
END;
$$;
