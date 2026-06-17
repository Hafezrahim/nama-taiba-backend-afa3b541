-- Allow anyone to submit a testimonial/review (must be unapproved and not featured)
CREATE POLICY "Anyone can submit a review"
ON public.testimonials
FOR INSERT
TO public
WITH CHECK (
  is_approved = false AND is_featured = false
);