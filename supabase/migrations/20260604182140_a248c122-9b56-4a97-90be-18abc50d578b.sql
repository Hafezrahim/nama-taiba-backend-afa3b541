-- SEO snapshots: weekly crawls + on-page score history
CREATE TABLE public.seo_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual' | 'cron' | 'crawler'
  on_page_score INTEGER,
  checks JSONB DEFAULT '[]'::jsonb,
  sitemap_urls INTEGER,
  sitemap_lastmod TEXT,
  robots_ok BOOLEAN,
  structured_data_valid BOOLEAN,
  verification_status JSONB DEFAULT '{}'::jsonb,
  gsc_summary JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_snapshots TO authenticated;
GRANT ALL ON public.seo_snapshots TO service_role;

ALTER TABLE public.seo_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read seo snapshots"
  ON public.seo_snapshots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert seo snapshots"
  ON public.seo_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete seo snapshots"
  ON public.seo_snapshots FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_seo_snapshots_date ON public.seo_snapshots(snapshot_date DESC);