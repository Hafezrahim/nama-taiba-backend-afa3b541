
-- Create backups metadata table
CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  tables text[] NOT NULL DEFAULT '{}',
  record_counts jsonb NOT NULL DEFAULT '{}',
  total_records integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  trigger_type text NOT NULL DEFAULT 'manual',
  file_size_bytes bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backups"
ON public.backups
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create backup schedule settings table
CREATE TABLE public.backup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'daily',
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup settings"
ON public.backup_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.backup_settings (is_enabled, frequency) VALUES (false, 'daily');

-- Create storage bucket for backups
INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- Only admins can access backup files
CREATE POLICY "Admins can manage backup files"
ON storage.objects
FOR ALL
USING (bucket_id = 'backups' AND has_role(auth.uid(), 'admin'::app_role));
