CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF _role = 'admin'::app_role THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
      AND (role = 'admin' OR role = 'user')
    );
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE(id uuid, email character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can view user emails';
    END IF;

    RETURN QUERY
    SELECT au.id, CAST(au.email AS VARCHAR)
    FROM auth.users au;
END;
$function$;