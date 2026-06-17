
-- Table to store which admin pages each user can access
CREATE TABLE public.user_page_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page_path)
);

ALTER TABLE public.user_page_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage page permissions
CREATE POLICY "Admins can manage page permissions"
  ON public.user_page_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON public.user_page_permissions FOR SELECT
  USING (auth.uid() = user_id);
