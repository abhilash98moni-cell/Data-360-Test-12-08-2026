const fs = require('fs');

function patch(filename) {
  let code = fs.readFileSync(filename, 'utf8');

  // Insert the is_admin function
  const funcStr = `
-- Create a secure function to check admin role without triggering RLS recursion
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
$$;
`;
  if (!code.includes('public.is_admin()')) {
    code = code.replace('-- Enable RLS on all tables', funcStr + '\n-- Enable RLS on all tables');
  }

  // Replace recursive policies
  code = code.replace(
    /CREATE POLICY "Admins can manage all profiles" ON public\.profiles FOR ALL USING \(EXISTS \(SELECT 1 FROM public\.profiles WHERE profiles\.id = auth\.uid\(\) AND profiles\.role = 'admin'\)\);/g,
    'CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());'
  );

  code = code.replace(
    /CREATE POLICY "Admins can view system logs" ON public\.system_audit_logs FOR SELECT USING \(EXISTS \(SELECT 1 FROM public\.profiles WHERE profiles\.id = auth\.uid\(\) AND profiles\.role = 'admin'\)\);/g,
    'CREATE POLICY "Admins can view system logs" ON public.system_audit_logs FOR SELECT USING (public.is_admin());'
  );

  fs.writeFileSync(filename, code);
  console.log(`Patched ${filename}`);
}

patch('src/db/supabase_schema.sql');
patch('supabase_schema.sql');

