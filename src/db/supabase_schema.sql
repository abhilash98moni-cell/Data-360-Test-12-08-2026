-- ====================================================================
-- DATA360 ENTERPRISE SUPABASE DATABASE SCHEMA & MULTI-TENANT RLS POLICIES
-- Production Ready DDL Script for PostgreSQL / Supabase
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  tenant_type VARCHAR(50) NOT NULL CHECK (tenant_type IN ('Platform', 'Audit Firm', 'Client Company', 'Distributor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clients & Distributors Sub-Tables
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) DEFAULT 'Technology',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  entity_name VARCHAR(255) NOT NULL,
  region VARCHAR(100) DEFAULT 'North America',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'Platform Super Admin',
    'AA Super Admin',
    'Audit Manager',
    'Auditor',
    'Reviewer',
    'Client Super Admin',
    'Client Employee',
    'Distributor Admin',
    'Distributor Employee'
  )),
  organization_name VARCHAR(255) NOT NULL,
  tenant_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Pending Invitation', 'Deactivated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audits Engagement Table
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  distributor_name VARCHAR(255) NOT NULL,
  audit_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Planning',
  risk_rating VARCHAR(20) DEFAULT 'High',
  lead_auditor VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  target_completion DATE NOT NULL,
  progress_percent INT DEFAULT 0,
  financial_exposure NUMERIC(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Team Assignments
CREATE TABLE IF NOT EXISTS public.audit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Initial Information Request List (IRL) Items
CREATE TABLE IF NOT EXISTS public.irl_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  distributor_name VARCHAR(255) NOT NULL,
  ref_number VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'Pending',
  reviewer_status VARCHAR(50) DEFAULT 'Pending Review',
  text_response TEXT,
  no_upload_explanation TEXT,
  reviewer_comment TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Evidence Files Table (Supabase Storage Metadata)
CREATE TABLE IF NOT EXISTS public.evidence_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  request_item_id UUID REFERENCES public.irl_request_items(id) ON DELETE CASCADE,
  distributor_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_mb NUMERIC(8,2) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL,
  file_hash VARCHAR(64) NOT NULL,
  version INT DEFAULT 1,
  uploaded_by VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Accepted', 'Rejected', 'Clarification Required')),
  reviewer_comment TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Threaded Communication Messages
CREATE TABLE IF NOT EXISTS public.threaded_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  request_ref VARCHAR(50),
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  sender_organization VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES public.threaded_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_user_email VARCHAR(255),
  target_organization VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. System Audit Logs
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  browser VARCHAR(100),
  device VARCHAR(100),
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE MULTI-TENANT QUERYING
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_name);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_audits_client ON public.audits(client_name);
CREATE INDEX IF NOT EXISTS idx_audits_distributor ON public.audits(distributor_name);
CREATE INDEX IF NOT EXISTS idx_irl_distributor ON public.irl_request_items(distributor_name);
CREATE INDEX IF NOT EXISTS idx_evidence_distributor ON public.evidence_files(distributor_name);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON public.evidence_files(status);
CREATE INDEX IF NOT EXISTS idx_messages_audit ON public.threaded_messages(audit_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.system_audit_logs(timestamp DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) TENANT POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irl_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threaded_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Platform & Audit Firm Super Admins can access everything
CREATE POLICY "Admins full access" ON public.users
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('Platform Super Admin', 'AA Super Admin', 'service_role')
  );

-- Policy: Distributors can ONLY access evidence matching their organization name
CREATE POLICY "Distributor Evidence Isolation Policy" ON public.evidence_files
  FOR ALL USING (
    distributor_name = (
      SELECT organization_name FROM public.users WHERE id = auth.uid()
    ) OR (
      SELECT role FROM public.users WHERE id = auth.uid()
    ) IN ('Platform Super Admin', 'AA Super Admin', 'Audit Manager', 'Auditor', 'Reviewer', 'service_role')
  );

-- Policy: Distributors can ONLY access IRL request items matching their organization name
CREATE POLICY "Distributor IRL Isolation Policy" ON public.irl_request_items
  FOR ALL USING (
    distributor_name = (
      SELECT organization_name FROM public.users WHERE id = auth.uid()
    ) OR (
      SELECT role FROM public.users WHERE id = auth.uid()
    ) IN ('Platform Super Admin', 'AA Super Admin', 'Audit Manager', 'Auditor', 'Reviewer', 'service_role')
  );

-- Policy: System Audit Logs insertion policy
CREATE POLICY "Allow system log creation" ON public.system_audit_logs
  FOR INSERT WITH CHECK (true);
