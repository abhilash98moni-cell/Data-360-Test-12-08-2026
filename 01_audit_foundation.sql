CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    industry TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    region TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(255) UNIQUE NOT NULL,
    client_id UUID REFERENCES public.clients(id),
    distributor_id UUID REFERENCES public.distributors(id),
    title TEXT NOT NULL,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Planning',
    start_date DATE,
    target_completion DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(audit_id, user_id)
);

-- Basic RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for now" ON public.clients;
CREATE POLICY "Allow all for now" ON public.clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for now" ON public.distributors;
CREATE POLICY "Allow all for now" ON public.distributors FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for now" ON public.audits;
CREATE POLICY "Allow all for now" ON public.audits FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for now" ON public.audit_assignments;
CREATE POLICY "Allow all for now" ON public.audit_assignments FOR ALL USING (true);

