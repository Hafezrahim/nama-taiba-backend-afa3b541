
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference_source text DEFAULT NULL;
