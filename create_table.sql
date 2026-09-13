CREATE TABLE IF NOT EXISTS public.auditor_distributor_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auditor_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  distributor_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  UNIQUE(auditor_user_id, distributor_name)
);

ALTER TABLE public.auditor_distributor_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access auditor_distributor" ON public.auditor_distributor_access
  FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Platform Super Admin', 'AA Super Admin', 'Admin', 'service_role')
  );

CREATE POLICY "Auditors read own access" ON public.auditor_distributor_access
  FOR SELECT USING (
    auditor_user_id = auth.uid()
  );
