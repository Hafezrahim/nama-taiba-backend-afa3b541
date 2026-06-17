-- Create cities table
CREATE TABLE public.cities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create districts table
CREATE TABLE public.districts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    shipping_price NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Cities policies
CREATE POLICY "Cities are viewable by everyone" 
ON public.cities 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage cities" 
ON public.cities 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Districts policies
CREATE POLICY "Districts are viewable by everyone" 
ON public.districts 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage districts" 
ON public.districts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_districts_city_id ON public.districts(city_id);
CREATE INDEX idx_cities_is_active ON public.cities(is_active);
CREATE INDEX idx_districts_is_active ON public.districts(is_active);

-- Add VAT rate to contact_info table (company settings)
ALTER TABLE public.contact_info ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 15;
ALTER TABLE public.contact_info ADD COLUMN IF NOT EXISTS vat_number TEXT;