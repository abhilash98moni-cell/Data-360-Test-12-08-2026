-- ====================================================================
-- DATA360 ENTERPRISE AUTHENTICATION & ADMIN APPROVAL WORKFLOW SCHEMA
-- Compatible with Supabase PostgreSQL (Auth & Database)
-- ====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Enum Types for Roles & Request Status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'auditor', 'distributor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signup_request_status') THEN
        CREATE TYPE signup_request_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;


-- 2. Create Public User Profiles Table (Linked 1-to-1 with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'auditor',
    organization TEXT NOT NULL DEFAULT 'Data360 Platform',
    title TEXT,
    avatar_initials VARCHAR(5),
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast role and email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);


-- 3. Create Pending Signup Requests Table (Supabase Gatekeeper Queue)
-- CRITICAL: Unapproved user data stays in this table until Admin approves!
CREATE TABLE IF NOT EXISTS public.pending_signup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'auditor',
    organization TEXT NOT NULL,
    status signup_request_status NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT
);

-- Index for pending queue filtering
CREATE INDEX IF NOT EXISTS idx_pending_requests_status ON public.pending_signup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_requests_email ON public.pending_signup_requests(email);


-- 4. Create System Auth Audit Logs Table
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g., 'SIGNUP_REQUEST', 'ADMIN_APPROVE', 'ADMIN_REJECT', 'USER_LOGIN'
    performed_by UUID REFERENCES auth.users(id),
    target_user_email TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. Trigger Function to Automatically Create User Profile on Supabase User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    input_role text;
    final_role user_role;
BEGIN
    input_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'auditor'));
    
    IF input_role = 'admin' THEN
        final_role := 'admin'::user_role;
    ELSIF input_role = 'distributor' THEN
        final_role := 'distributor'::user_role;
    ELSE
        final_role := 'auditor'::user_role;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        organization,
        title,
        avatar_initials
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        final_role,
        COALESCE(NEW.raw_user_meta_data->>'organization', 'Data360 Platform'),
        CASE 
            WHEN final_role = 'admin' THEN 'Platform Owner / Admin'
            WHEN final_role = 'distributor' THEN 'Distributor Compliance Manager'
            ELSE 'Lead Forensic Auditor'
        END,
        UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) FROM 1 FOR 2))
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        organization = EXCLUDED.organization,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger errors from failing user creation in auth.users
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();


-- 6. Configure Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert a signup request into the pending queue
DROP POLICY IF EXISTS "Public can submit signup requests" ON public.pending_signup_requests;
CREATE POLICY "Public can submit signup requests"
    ON public.pending_signup_requests
    FOR INSERT
    WITH CHECK (true);

-- Policy: Admin can view and manage all pending requests
DROP POLICY IF EXISTS "Admins can view and manage pending requests" ON public.pending_signup_requests;
CREATE POLICY "Admins can view and manage pending requests"
    ON public.pending_signup_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Admins can view and manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- 7. Insert Initial Demonstration Pending Requests (Optional Test Seed Data)
INSERT INTO public.pending_signup_requests (email, password_hash, full_name, role, organization)
VALUES 
    ('m.thorne@apex-auditors.com', '$2a$10$e7x...samplehash', 'Marcus Thorne', 'auditor', 'Apex Audit Practice'),
    ('e.rostova@logistics-global.com', '$2a$10$e7x...samplehash', 'Elena Rostova', 'distributor', 'Global Logistics Corp')
ON CONFLICT (email) DO NOTHING;


-- 8. Audit Reports Table (Reporting Module)
CREATE TABLE IF NOT EXISTS public.audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(255) UNIQUE,
    report_type VARCHAR(100),
    distributor_id VARCHAR(255) NOT NULL,
    distributor_name VARCHAR(255),
    client_id VARCHAR(255),
    client_name VARCHAR(255),
    audit_id VARCHAR(255),
    template_id VARCHAR(100),
    template_version VARCHAR(50),
    report_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by VARCHAR(255),
    created_by_name VARCHAR(255),
    created_by_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finalized_by VARCHAR(255),
    finalized_at TIMESTAMP WITH TIME ZONE,
    docx_file_id VARCHAR(255),
    pdf_file_id VARCHAR(255),
    google_drive_file_id VARCHAR(255),
    google_drive_folder_id VARCHAR(255),
    google_drive_file_url VARCHAR(1024),
    last_drive_sync_at TIMESTAMP WITH TIME ZONE,
    report_content JSONB DEFAULT '{}'::jsonb,
    overview JSONB DEFAULT '{}'::jsonb,
    findings JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_reports_distributor ON public.audit_reports(distributor_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_status ON public.audit_reports(status);

ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to audit_reports" ON public.audit_reports;
CREATE POLICY "Allow all access to audit_reports" ON public.audit_reports
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Done!
CREATE TABLE IF NOT EXISTS public.test_table_auto_apply (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
