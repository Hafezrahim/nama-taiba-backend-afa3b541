DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
CREATE POLICY "Projects are viewable by everyone"
ON public.projects FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Team members are viewable by everyone"
ON public.team_members FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Offers are viewable by everyone" ON public.offers;
CREATE POLICY "Offers are viewable by everyone"
ON public.offers FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Districts are viewable by everyone" ON public.districts;
CREATE POLICY "Districts are viewable by everyone"
ON public.districts FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Partners are viewable by everyone" ON public.partners;
CREATE POLICY "Partners are viewable by everyone"
ON public.partners FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;
CREATE POLICY "Cities are viewable by everyone"
ON public.cities FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services are viewable by everyone"
ON public.services FOR SELECT TO anon, authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "About info is viewable by everyone" ON public.about_info;
CREATE POLICY "About info is viewable by everyone"
ON public.about_info FOR SELECT TO anon, authenticated
USING (section_key IN ('vision', 'mission', 'history'));