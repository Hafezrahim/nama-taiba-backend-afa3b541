-- Migration: Allow admin users to delete marketer applications, contact submissions, and quote requests

-- 1. Marketer Applications DELETE policy
CREATE POLICY "Admins can delete marketer applications"
ON public.marketer_applications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Contact Submissions DELETE policy
CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Quote Requests DELETE policy
CREATE POLICY "Admins can delete quote requests"
ON public.quote_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Submission Replies DELETE policy
CREATE POLICY "Admins can delete submission replies"
ON public.submission_replies
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure explicit permissions are granted
GRANT DELETE ON public.marketer_applications TO authenticated;
GRANT DELETE ON public.contact_submissions TO authenticated;
GRANT DELETE ON public.quote_requests TO authenticated;
GRANT DELETE ON public.submission_replies TO authenticated;
