const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // We are going to replace the private schema block we added earlier with the user's exact SQL.
  // We'll just find the block starting with "-- Create a private schema" and ending before "-- Enable RLS on all tables"
  // Actually, we'll just replace the whole private schema and policies we injected.
  
  const oldPrivateBlockRegex = /-- Create a private schema for secure internal functions[\s\S]*?GRANT EXECUTE ON FUNCTION private\.is_admin\(\) TO authenticated;/;
  
  const newPrivateBlock = `-- 1. Private schema for security-definer helpers
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Secure admin-check function
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

-- 3. Restrict access to the private schema/function
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;`;

  code = code.replace(oldPrivateBlockRegex, newPrivateBlock);

  // Replace policies
  const oldProfilePolicyRegex = /DROP POLICY IF EXISTS "Admins can manage all profiles" ON public\.profiles;\s*CREATE POLICY "Admins can manage all profiles" ON public\.profiles\s*FOR ALL USING \(\(SELECT private\.is_admin\(\)\)\);/;
  
  const newProfilePolicy = `DROP POLICY IF EXISTS "Admins can manage all profiles"
ON public.profiles;

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING ((SELECT private.is_admin()))
WITH CHECK ((SELECT private.is_admin()));`;

  code = code.replace(oldProfilePolicyRegex, newProfilePolicy);

  const oldAuditPolicyRegex = /DROP POLICY IF EXISTS "Admins can view system logs" ON public\.system_audit_logs;\s*CREATE POLICY "Admins can view system logs" ON public\.system_audit_logs\s*FOR SELECT USING \(\(SELECT private\.is_admin\(\)\)\);/;

  const newAuditPolicy = `DROP POLICY IF EXISTS "Admins can view system logs"
ON public.system_audit_logs;

CREATE POLICY "Admins can view system logs"
ON public.system_audit_logs
FOR SELECT
TO authenticated
USING ((SELECT private.is_admin()));`;

  code = code.replace(oldAuditPolicyRegex, newAuditPolicy);

  fs.writeFileSync(filename, code);
  console.log(`Patched ${filename}`);
}

patch('src/db/supabase_schema.sql');
patch('supabase_schema.sql');
