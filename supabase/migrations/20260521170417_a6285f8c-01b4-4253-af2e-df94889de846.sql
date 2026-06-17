DROP POLICY IF EXISTS "Deliverers are viewable by authenticated" ON public.deliverers;
DROP POLICY IF EXISTS "Shipments viewable by authenticated" ON public.shipments;

CREATE POLICY "Admins can view deliverers"
ON public.deliverers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Order owners can view their shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = shipments.order_id
      AND o.user_id = auth.uid()
  )
);