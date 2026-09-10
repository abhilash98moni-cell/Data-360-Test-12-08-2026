const fs = require('fs');

function clean(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Replace the malformed public function with the clean private one
  const regex = /-- Create a secure function to check admin role without triggering RLS recursion[\s\S]*?WHERE id = auth\.uid\(\) AND role = 'admin'\s*\);\s*\$\$;/g;
  
  const correct = `-- 1. Private schema for security-definer helpers
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

  code = code.replace(regex, correct);
  fs.writeFileSync(filename, code);
}

clean('src/db/supabase_schema.sql');
clean('supabase_schema.sql');
