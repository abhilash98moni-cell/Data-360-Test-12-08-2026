-- 1. Create a secure function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop the recursive policies and recreate them securely
DO $$ 
BEGIN
    -- profiles
    DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
    CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

    -- system logs
    DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_audit_logs;
    CREATE POLICY "Admins can view system logs" ON public.system_audit_logs FOR SELECT USING (public.is_admin());

    -- pending_signup_requests (drop the potentially hidden one and recreate)
    DROP POLICY IF EXISTS "Admins can view pending requests" ON public.pending_signup_requests;
    CREATE POLICY "Admins can view pending requests" ON public.pending_signup_requests FOR SELECT USING (public.is_admin());
    
    DROP POLICY IF EXISTS "Admins can manage pending requests" ON public.pending_signup_requests;
    CREATE POLICY "Admins can manage pending requests" ON public.pending_signup_requests FOR ALL USING (public.is_admin());

END $$;
