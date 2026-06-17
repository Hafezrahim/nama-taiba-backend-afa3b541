-- =====================================================
-- SECURITY FIX: Critical RLS Issues
-- =====================================================

-- 1. Enable RLS on orders table (CRITICAL - currently disabled based on scan)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Fix profiles table - restrict SELECT to own profile or admin
-- First drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create proper policy - users can only view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 3. Fix user_roles INSERT policy - restrict to only 'user' role during self-registration
-- Drop existing policy first
DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;

-- Create more secure policy that only allows inserting 'user' role
CREATE POLICY "Users can insert user role during signup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'user'::app_role
  AND is_approved = false
);

-- 4. Secure order_items INSERT - require valid order association
DROP POLICY IF EXISTS "Anyone can submit order items" ON public.order_items;

CREATE POLICY "Order items can be inserted with valid order"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders WHERE id = order_id
  )
);