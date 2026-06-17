-- Update app_role enum to include new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketer';

-- Add approval status to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Update the handle_new_user function to not auto-create role (we'll do it during signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name_en, full_name_ar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'full_name_ar', NEW.raw_user_meta_data->>'name')
  );
  
  -- Role will be inserted separately during signup with proper approval status
  RETURN NEW;
END;
$$;

-- Update RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own role during signup
DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;
CREATE POLICY "Users can insert own role during signup"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create helper function to check if user role is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;