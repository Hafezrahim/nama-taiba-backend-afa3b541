-- Create table for marketer applications
CREATE TABLE public.marketer_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  total_experience TEXT NOT NULL,
  cv_file_name TEXT,
  cv_file_data TEXT,
  cv_file_type TEXT,
  message TEXT,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.marketer_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to submit applications
CREATE POLICY "Anyone can submit marketer application"
ON public.marketer_applications
FOR INSERT
WITH CHECK (true);