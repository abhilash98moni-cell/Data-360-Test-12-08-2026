const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Replace public.is_admin block with private.is_admin block
  const oldFunc = `-- Create a secure function to check admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;`;

  const newFunc = `-- Create a private schema for secure internal functions
CREATE SCHEMA IF NOT EXISTS private;

-- Create a secure function to check admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;`;

  code = code.replace(oldFunc, newFunc);
  code = code.replace(/public\.is_admin\(\)/g, '(SELECT private.is_admin())');
  
  fs.writeFileSync(filename, code);
  console.log(`Patched ${filename}`);
}

patch('src/db/supabase_schema.sql');
patch('supabase_schema.sql');

