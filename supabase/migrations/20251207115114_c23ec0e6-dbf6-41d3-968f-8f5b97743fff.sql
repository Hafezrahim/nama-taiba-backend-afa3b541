-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit orders" ON public.orders;

-- Create a permissive INSERT policy for anyone to submit orders
CREATE POLICY "Anyone can submit orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also fix order_items INSERT policy
DROP POLICY IF EXISTS "Anyone can submit order items" ON public.order_items;

CREATE POLICY "Anyone can submit order items" 
ON public.order_items 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);