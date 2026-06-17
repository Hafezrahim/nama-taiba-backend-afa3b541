-- Add latitude and longitude columns to contact_info for Leaflet map
ALTER TABLE public.contact_info 
ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT 30.0444,
ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT 31.2357;