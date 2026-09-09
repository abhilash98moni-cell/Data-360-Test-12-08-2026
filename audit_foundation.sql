-- 1. Core Engagements Table
CREATE TABLE IF NOT EXISTS public.engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(255) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    distributor_name VARCHAR(255) NOT NULL,
    status VARCHAR(100) DEFAULT 'Planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Audit Assignments Table (For Authorization)
CREATE TABLE IF NOT EXISTS public.audit_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(255) REFERENCES public.engagements(audit_id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(audit_id, user_email)
);

-- 3. Questionnaires (IRL) Table
CREATE TABLE IF NOT EXISTS public.questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(255) REFERENCES public.engagements(audit_id) ON DELETE CASCADE,
    status VARCHAR(100) DEFAULT 'Draft',
    is_locked BOOLEAN DEFAULT false,
    completion_percentage NUMERIC DEFAULT 0,
    submission_date TIMESTAMPTZ,
    submitted_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(audit_id)
);

-- 4. Questionnaire Items
CREATE TABLE IF NOT EXISTS public.questionnaire_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE CASCADE,
    ref_number VARCHAR(100) NOT NULL,
    category VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    status VARCHAR(100) DEFAULT 'Pending',
    reviewer_status VARCHAR(100) DEFAULT 'Pending Review',
    text_response TEXT,
    reviewer_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Evidence Records
CREATE TABLE IF NOT EXISTS public.evidence_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id VARCHAR(255) REFERENCES public.engagements(audit_id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.questionnaire_items(id) ON DELETE SET NULL,
    google_drive_file_id VARCHAR(255),
    file_name TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size_mb NUMERIC,
    uploaded_by VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Uploaded',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;

-- Allow all for now, to be restricted by policies later
CREATE POLICY "Allow all" ON public.engagements FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.audit_assignments FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.questionnaires FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.questionnaire_items FOR ALL USING (true);
CREATE POLICY "Allow all" ON public.evidence_records FOR ALL USING (true);
