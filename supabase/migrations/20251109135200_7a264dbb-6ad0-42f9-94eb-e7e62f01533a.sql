-- Add RLS policies for admin users to manage all tables

-- Products table admin policies
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Blogs table admin policies
CREATE POLICY "Admins can manage blogs"
ON public.blogs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Projects table admin policies
CREATE POLICY "Admins can manage projects"
ON public.projects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Offers table admin policies
CREATE POLICY "Admins can manage offers"
ON public.offers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Services table admin policies
CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Partners table admin policies
CREATE POLICY "Admins can manage partners"
ON public.partners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Team members table admin policies
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Certifications table admin policies
CREATE POLICY "Admins can manage certifications"
ON public.certifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Testimonials table admin policies
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Categories table admin policies
CREATE POLICY "Admins can manage categories"
ON public.categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Slider table admin policies
CREATE POLICY "Admins can manage slider"
ON public.slider
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Contact info table admin policies
CREATE POLICY "Admins can manage contact info"
ON public.contact_info
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- About info table admin policies
CREATE POLICY "Admins can manage about info"
ON public.about_info
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Contact submissions admin policies
CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Quote requests admin policies
CREATE POLICY "Admins can view quote requests"
ON public.quote_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage quote requests"
ON public.quote_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Marketer applications admin policies
CREATE POLICY "Admins can view marketer applications"
ON public.marketer_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage marketer applications"
ON public.marketer_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));