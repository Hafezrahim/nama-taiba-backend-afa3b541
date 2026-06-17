
-- Security events log (populated by webhook + triggers)
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  source TEXT NOT NULL DEFAULT 'webhook',
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_id UUID,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_resolved ON public.security_events(resolved);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update security events"
  ON public.security_events FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete security events"
  ON public.security_events FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert security events"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Security findings (audit checklist)
CREATE TABLE public.security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','ignored','fixed')),
  recommendation TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage security findings"
  ON public.security_findings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_security_findings_updated_at
  BEFORE UPDATE ON public.security_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial findings from black-box audit
INSERT INTO public.security_findings (code, title, description, severity, category, recommendation) VALUES
('AUTH_LEAKED_PWD', 'Leaked password protection disabled', 'Supabase Auth can check submitted passwords against the HaveIBeenPwned database. This protection is currently disabled, allowing users to register with known compromised passwords.', 'warning', 'auth', 'Enable "Leaked password protection" in Supabase Dashboard → Authentication → Policies.'),
('AUTH_OTP_LONG_EXPIRY', 'Long OTP / magic-link expiry', 'OTP and magic-link tokens may have a longer expiry than recommended (>1 hour), expanding the attack window for intercepted links.', 'warning', 'auth', 'Reduce OTP expiry to ≤3600 seconds in Supabase Dashboard → Authentication → Email Templates.'),
('PUBLIC_INSERT_TESTIMONIALS', 'Public testimonial submissions allow spam', 'Anyone (anon) can INSERT into testimonials. While restricted to is_approved=false, this allows mass spam submissions.', 'warning', 'rls', 'Add server-side rate limiting (edge function) or require auth for submissions.'),
('PUBLIC_INSERT_CONTACT', 'Contact form has no rate limit', 'contact_submissions allows public INSERT with no rate limiting. Vulnerable to flooding/spam.', 'warning', 'rls', 'Add IP-based rate limiting via an edge function wrapper.'),
('PUBLIC_INSERT_QUOTES', 'Quote requests publicly insertable', 'quote_requests allows public INSERT. Could be abused for spam or to enumerate products.', 'info', 'rls', 'Add captcha or rate limiting to the quote form.'),
('PUBLIC_INSERT_MARKETERS', 'Marketer applications store CV in DB', 'marketer_applications publicly insertable and stores CV file as base64 text in DB. Bloats DB and exposes file content via SELECT to admins only — no malware scanning.', 'warning', 'data', 'Move CVs to documents storage bucket with RLS; scan uploads.'),
('PUBLIC_ORDERS_INSERT', 'Anonymous orders allow PII submission', 'orders accepts anon INSERT with customer_name, phone, address. No verification means fake orders can flood the system.', 'warning', 'rls', 'Require phone OTP verification before order submission, or add rate limit.'),
('STORAGE_PUBLIC_LISTING', 'Public storage buckets allow listing', 'Public buckets (avatars, products, projects, blogs, partners, documents) allow anyone to list contents, potentially exposing unintended files.', 'warning', 'storage', 'Restrict storage.objects SELECT to specific path patterns or require auth for listing.'),
('PROFILES_PHONE_EXPOSURE', 'Phone numbers stored without encryption', 'profiles.phone is stored plaintext. Visible to user and admins only via RLS, but unencrypted at rest in DB backups.', 'info', 'data', 'Consider pgcrypto for sensitive PII, or use Supabase Vault.');
