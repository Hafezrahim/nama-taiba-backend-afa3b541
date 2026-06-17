
CREATE TABLE public.map_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  address_en TEXT,
  address_ar TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  map_url TEXT,
  icon_color TEXT DEFAULT '#630d5f',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.map_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_locations TO authenticated;
GRANT ALL ON public.map_locations TO service_role;

ALTER TABLE public.map_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active map locations"
ON public.map_locations FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert map locations"
ON public.map_locations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update map locations"
ON public.map_locations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete map locations"
ON public.map_locations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_map_locations_updated_at
BEFORE UPDATE ON public.map_locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed one location from existing contact_info
INSERT INTO public.map_locations (name_en, name_ar, address_en, address_ar, latitude, longitude, phone, email, whatsapp, map_url, display_order)
SELECT 
  'Main Office',
  'المقر الرئيسي',
  address_en,
  address_ar,
  COALESCE(latitude, 24.7136),
  COALESCE(longitude, 46.6753),
  phone,
  email,
  whatsapp,
  map_url,
  0
FROM public.contact_info LIMIT 1;

-- Add map region columns to contact_info for default center/zoom
ALTER TABLE public.contact_info 
  ADD COLUMN IF NOT EXISTS map_center_lat DOUBLE PRECISION DEFAULT 24.7136,
  ADD COLUMN IF NOT EXISTS map_center_lng DOUBLE PRECISION DEFAULT 46.6753,
  ADD COLUMN IF NOT EXISTS map_zoom INTEGER DEFAULT 6;
