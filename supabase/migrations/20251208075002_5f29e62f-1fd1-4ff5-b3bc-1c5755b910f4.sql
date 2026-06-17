-- Temporarily disable and re-enable RLS to force refresh
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the INSERT policy with explicit anon role
DROP POLICY IF EXISTS "Anyone can submit orders" ON public.orders;
CREATE POLICY "Anyone can submit orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Same for order_items
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit order items" ON public.order_items;
CREATE POLICY "Anyone can submit order items" 
ON public.order_items 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);