
-- Create deliverers table
CREATE TABLE public.deliverers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT DEFAULT 'car',
  vehicle_number TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shipments table linking orders to deliverers
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  deliverer_id UUID NOT NULL REFERENCES public.deliverers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.deliverers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS policies for deliverers
CREATE POLICY "Admins can manage deliverers" ON public.deliverers FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Deliverers are viewable by authenticated" ON public.deliverers FOR SELECT TO authenticated USING (true);

-- RLS policies for shipments
CREATE POLICY "Admins can manage shipments" ON public.shipments FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Shipments viewable by authenticated" ON public.shipments FOR SELECT TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_deliverers_updated_at BEFORE UPDATE ON public.deliverers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
