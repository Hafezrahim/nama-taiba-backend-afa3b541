CREATE TABLE public.submission_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_type text NOT NULL,
  submission_id uuid NOT NULL,
  channel text NOT NULL,
  recipient text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.submission_replies TO authenticated;
GRANT ALL ON public.submission_replies TO service_role;

ALTER TABLE public.submission_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view replies"
ON public.submission_replies FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert replies"
ON public.submission_replies FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_submission_replies_submission ON public.submission_replies (submission_type, submission_id, created_at DESC);

CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  page_title text,
  language text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.page_views TO anon;
GRANT SELECT, INSERT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a page view"
ON public.page_views FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view page views"
ON public.page_views FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_page_views_path_created ON public.page_views (path, created_at DESC);