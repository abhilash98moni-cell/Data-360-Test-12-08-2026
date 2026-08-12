import { BRDSection } from '../types';

export const BRD_DOCUMENT_DATA: BRDSection[] = [
  {
    id: 'sec-1',
    number: 1,
    title: 'Project Vision',
    summary: 'Data360 aims to be the definitive multi-tenant SaaS platform empowering tier-1 audit firms to streamline distributor, vendor, dealer, compliance, financial, and forensic audits at scale.',
    content: {
      overview: 'Data360 is conceived as an enterprise-grade, multi-client SaaS Audit & Risk Management Platform engineered specifically for professional audit and accounting firms. The platform unifies fragmented fieldwork spreadsheets, disparate ERP integrations, sampling engines, and manual reporting into an end-to-end cloud workspace. By embedding AI-driven forensic anomaly detection and real-time client collaboration portals, Data360 drastically reduces audit cycle times while expanding sample coverage and leak discovery.',
      subsections: [
        {
          subtitle: 'Core Value Proposition',
          details: [
            'End-to-End Multi-Tenant Client Architecture for seamless management of multiple client audit portfolios.',
            'Automated Fieldwork Workflows for 8 core audit streams: Distributor, Vendor, Dealer, Franchise, Compliance, Operational, Financial, and Forensic.',
            'Continuous Automated Sampling & Statistical Precision using MUS (Monetary Unit Sampling) and Stratified Random algorithms.',
            'Real-Time Revenue Leakage & Fraud Identification powered by Benford\'s Law and ML transaction pattern analysis.',
            'Client Remediation Portal with automated CAPA tracking, SLA enforcement, and verifiable sign-off workflows.'
          ]
        }
      ]
    }
  },
  {
    id: 'sec-2',
    number: 2,
    title: 'Business Objectives',
    summary: 'Measurable strategic goals to elevate audit firm productivity, revenue capture, accuracy, and client retention.',
    content: {
      overview: 'The primary business objectives for deploying Data360 across audit firm practices encompass cost reduction, cycle time acceleration, audit quality enhancement, and new recurring software-led audit services.',
      subsections: [
        {
          subtitle: 'Key Strategic Metrics',
          details: [
            'Reduce Fieldwork Execution Time by 40% through standardized automated test programs and automated OCR/document ingestion.',
            'Increase Financial Leakage Discovery Rate by 35% using AI-based forensic transaction testing on 100% population datasets.',
            'Compress Draft-to-Final Audit Report Cycle from 18 days to 4 days via real-time collaborative draft review.',
            'Maintain 99.9% Platform Uptime and SOC 2 Type II Compliance across all client tenant data silos.',
            'Boost Audit Firm Resource Utilization by 25%, allowing senior managers to oversee 3x more active engagements concurrently.'
          ]
        }
      ]
    }
  },
  {
    id: 'sec-3',
    number: 3,
    title: 'Stakeholders',
    summary: 'Internal and external key players, leadership sponsors, and governance bodies.',
    content: {
      overview: 'The deployment and continuous operation of Data360 involves stakeholders across the Audit Firm, Enterprise Clients, Audited Entities (Distributors/Vendors), and Technical Oversight committees.',
      table: {
        headers: ['Stakeholder Group', 'Role', 'Key Responsibilities', 'Impact Level'],
        rows: [
          ['Audit Firm Executive Board', 'Sponsor & Steering', 'Capital allocation, platform adoption KPI tracking, client satisfaction oversight', 'Strategic / High'],
          ['Lead Audit Partners', 'Business Owner', 'Engagement sign-off, methodology compliance, fee structure optimization', 'Operational / High'],
          ['Audit Managers & Seniors', 'Primary Users', 'Workpaper review, sampling setup, draft report authorization, finding review', 'Operational / Critical'],
          ['Field Auditors & Forensic Specialists', 'Day-to-Day Execution', 'Data ingestion, evidence uploading, test step execution, anomaly verification', 'Operational / Critical'],
          ['Client CFO & Internal Audit Heads', 'Client Stakeholder', 'Portfolio progress monitoring, executive dashboard review, CAPA approval', 'Executive / Medium'],
          ['Audited Entity Representatives (Distributors/Dealers)', 'Auditee / Responders', 'Submitting requested evidence, responding to audit observations, CAPA execution', 'External / High'],
          ['Chief Information Security Officer (CISO)', 'Governance', 'Data privacy, encryption standard compliance, penetration test approvals', 'Governance / High']
        ]
      }
    }
  },
  {
    id: 'sec-4',
    number: 4,
    title: 'User Personas',
    summary: 'Detailed profiles of key platform users and their workflow needs.',
    content: {
      subsections: [
        {
          subtitle: 'Persona 1: Partner / Engagement Director (Victoria Vance)',
          details: [
            'Goals: High-level portfolio visibility across 15+ multi-million dollar client engagements.',
            'Pain Points: Lack of consolidated real-time reporting, surprise delays near report deadlines.',
            'Data360 Needs: Executive risk heatmaps, overall audit progress indicators, one-click sign-off workflow.'
          ]
        },
        {
          subtitle: 'Persona 2: Senior Forensic Audit Lead (Marcus Sterling)',
          details: [
            'Goals: Detecting revenue leakage, phantom stock, duplicate billing, and kickback schemes in vendor/distributor ledgers.',
            'Pain Points: Manual Excel formulas failing on millions of ERP ledger rows; inability to run statistical sampling easily.',
            'Data360 Needs: Automated Benford\'s Law visualization, duplicate detection algorithm, MUS sampling builder, evidence chain-of-custody log.'
          ]
        },
        {
          subtitle: 'Persona 3: Audited Entity Manager / Distributor Compliance Officer (Rahul Patel)',
          details: [
            'Goals: Swiftly resolving audit queries, submitting requested invoices/inventory proofs, and clearing CAPAs.',
            'Pain Points: Unorganized email threads, lost attachments, unclear observation deadlines.',
            'Data360 Needs: Secure auditee portal, drag-and-drop evidence vault, direct response threads with status trackers.'
          ]
        }
      ]
    }
  },
  {
    id: 'sec-5',
    number: 5,
    title: 'Scope (In-Scope Modules)',
    summary: 'Comprehensive functional boundaries included in the Data360 MVP and Enterprise Release.',
    content: {
      overview: 'The platform encompasses 6 core functional pillars delivering end-to-end audit lifecycle automation:',
      items: [
        'Multi-Client Engagement & Tenant Manager: Role-based data isolation, client onboarding, custom audit team assignment.',
        '8 Audit Stream Workspaces: Tailored templates for Distributor, Vendor, Dealer, Franchise, Compliance, Operational, Financial, and Forensic audits.',
        'Statistical Sampling Engine: Support for Monetary Unit Sampling (MUS), Stratified Random Sampling, Systematic Sampling, and Risk-Based Selection.',
        'AI Forensic Anomaly Detector: Ingestion of General Ledger / AP / AR datasets to spot duplicate payments, split transactions under approval caps, and out-of-pattern discounts.',
        'Evidence Vault & Chain of Custody: Cryptographic hashing (SHA-256) of uploaded files, OCR text extraction, timestamped audit trail.',
        'CAPA & Remediation Portal: Automated observation workflow, severity matrix, financial impact tally, and auditee action item tracking.'
      ]
    }
  },
  {
    id: 'sec-6',
    number: 6,
    title: 'Out of Scope',
    summary: 'Explicit functional boundaries excluded from the current product release.',
    content: {
      overview: 'To ensure focused delivery and high stability, the following capabilities are explicitly deferred to future phases:',
      items: [
        'Automated Tax Return Filing: Data360 will identify tax compliance anomalies but will not interface directly with government tax portals.',
        'Live Real-time Payroll Processing: Direct execution of employee paychecks is excluded; payroll audit testing remains advisory.',
        'Custom Native Mobile Hardware Scanners: Field auditors will use responsive web interface on tablets/laptops rather than standalone barcode hardware devices.',
        'Direct Third-Party ERP Database Mutation: Data360 reads and ingests SAP/Oracle/NetSuite data via APIs/exports but will NEVER write back directly into client core accounting ledgers.'
      ]
    }
  },
  {
    id: 'sec-7',
    number: 7,
    title: 'Functional Requirements',
    summary: 'Detailed system requirements and capability specifications.',
    content: {
      table: {
        headers: ['Req ID', 'Module', 'Requirement Description', 'Priority'],
        rows: [
          ['FR-101', 'Multi-Tenancy', 'System must strictly isolate client data using tenant-specific encryption keys and role-based access limits.', 'P0 - Critical'],
          ['FR-102', 'Audit Creation', 'System must allow audit leads to initialize engagements choosing from 8 pre-configured audit type templates.', 'P0 - Critical'],
          ['FR-103', 'Sampling Engine', 'System must generate statistical sample sizes based on user-entered confidence levels, tolerable error, and expected misstatement.', 'P0 - Critical'],
          ['FR-104', 'Forensic Ingestion', 'System must ingest CSV, XLSX, and ERP API exports up to 10M rows and run Benford\'s Law 1st & 2nd digit test automatically.', 'P1 - High'],
          ['FR-105', 'Finding Tracker', 'System must automatically aggregate financial impact ($) across all identified findings to calculate total audit exposure.', 'P0 - Critical'],
          ['FR-106', 'Auditee Portal', 'System must grant restricted external access to auditees to view assigned queries and submit evidence files.', 'P1 - High'],
          ['FR-107', 'Report Builder', 'System must auto-populate executive summaries and draft reports in PDF and DOCX formats with configurable firm branding.', 'P1 - High'],
          ['FR-108', 'AI Assistance', 'System must provide natural language querying over audit workpapers to auto-summarize root causes and draft observations.', 'P2 - Medium'],
          ['FR-109', 'Supabase DB & Metadata Layer', 'System must maintain persistent Supabase PostgreSQL database schemas for evidence_files, pending_signup_requests, profiles, and system_audit_logs with Row Level Security (RLS).', 'P0 - Critical'],
          ['FR-110', 'Google Drive Cloud Backup Vault', 'System must automatically isolate and back up all uploaded evidence files to Google Drive using a hierarchical multi-tenant directory structure (Data360_Test/Clients/[Client]/Audits/[Audit]/Distributors/[Distributor]).', 'P0 - Critical'],
          ['FR-111', 'Dual-Indexed Backup Sync', 'System must execute real-time dual-indexing: streaming physical files into Google Drive subfolders while indexing file metadata, SHA-256 hashes, and version history in Supabase.', 'P0 - Critical'],
          ['FR-112', 'Google Backup Diagnostic Suite', 'System must provide an automated 6-step diagnostic suite (Auth, Root Folder, Subfolder Creation, File Upload, Stream Download, File Cleanup) to verify Google Drive backup integrity.', 'P1 - High']
        ]
      }
    }
  },
  {
    id: 'sec-8',
    number: 8,
    title: 'Non-Functional Requirements',
    summary: 'System performance, security, availability, and usability constraints.',
    content: {
      subsections: [
        {
          subtitle: 'Security & Compliance (NFR-SEC)',
          details: [
            'Data Encryption: AES-256 encryption at rest, TLS 1.3 in transit across all web API endpoints.',
            'Access Controls: Mandatory Multi-Factor Authentication (MFA) and Single Sign-On (SSO) integration via SAML 2.0 / OpenID Connect.',
            'Certifications: Built to satisfy SOC 2 Type II, ISO 27001, and GDPR data residency standards.'
          ]
        },
        {
          subtitle: 'Performance & Scalability (NFR-PERF)',
          details: [
            'API Response Time: 95th percentile response time under 300ms for routine navigation and query filtering.',
            'Big Data Parsing: Ingestion and anomaly analysis of 1 million transaction rows completed within 60 seconds.',
            'Concurrent Users: Capable of handling 5,000 active concurrent auditors and auditees across regions without latency degradation.'
          ]
        },
        {
          subtitle: 'Availability & Reliability (NFR-AVAIL)',
          details: [
            'Uptime SLA: 99.95% annual availability with scheduled maintenance windows during non-peak weekend hours.',
            'Disaster Recovery: RPO (Recovery Point Objective) < 15 minutes, RTO (Recovery Time Objective) < 2 hours.'
          ]
        },
        {
          subtitle: 'Supabase & Google Drive Cloud Backup Architecture (NFR-STORAGE-BACKUP)',
          details: [
            'Dual Storage Architecture: Physical evidence files stored in Google Drive vault; metadata, SHA-256 hashes, and user sessions stored in Supabase PostgreSQL.',
            'Google Drive OAuth2 Auth: Server-side OAuth2 Refresh Token credentials linked to GCP Project 550795089041 with ambient Google Auth fallback.',
            'Multi-Tenant Isolation: Idempotent lookup and automatic provisioning of subfolder paths (Data360_Test/Clients/[Client]/Audits/[Audit]/Distributors/[Distributor]/03_Distributor_Evidence).',
            'Automated Backup Verification: Continuous 6-step API diagnostic testing to guarantee backup upload, retrieval, stream download, and cleanup capabilities.'
          ]
        }
      ]
    }
  },
  {
    id: 'sec-9',
    number: 9,
    title: 'Assumptions',
    summary: 'Core working assumptions underlying technical and operational design.',
    content: {
      items: [
        'Audited entities can provide financial ledgers and inventory reports in structured digital formats (CSV, Excel, or standard ERP database views).',
        'Audit firm staff have standard web access on corporate devices with modern modern browser support (Chrome, Edge, Safari, Firefox).',
        'Enterprise clients will authorize API key connections or staging file drops for ERP integrations (SAP, Oracle Cloud, NetSuite, Dynamics 365).'
      ]
    }
  },
  {
    id: 'sec-10',
    number: 10,
    title: 'Constraints',
    summary: 'Technical, regulatory, and resource limitations governing product build.',
    content: {
      items: [
        'Regulatory Compliance: Strict adherence to international auditing standards (ISA, IIA Standards) requiring immutable audit logs.',
        'Data Sovereignty: Client data must reside within designated geographic regions (US East, EU Frankfurt, AP Singapore) to comply with localized privacy laws.',
        'Browser Memory Limits: Client-side sampling previews must utilize Web Workers to prevent main thread freezing during multi-megabyte calculations.'
      ]
    }
  },
  {
    id: 'sec-11',
    number: 11,
    title: 'Business Rules',
    summary: 'Mandatory operational logic enforcing audit independence and data integrity.',
    content: {
      table: {
        headers: ['Rule ID', 'Rule Name', 'Enforcement Logic', 'System Behavior'],
        rows: [
          ['BR-001', 'Segregation of Duties (SoD)', 'The auditor who logged a finding cannot be the sole approver who closes the finding.', 'System blocks self-approval and flags an warning log.'],
          ['BR-002', 'Workpaper Lockout', 'Once an audit engagement is signed off by the Partner, workpapers become read-only.', 'All edit buttons disabled; revision requires formal Partner unlock request.'],
          ['BR-003', 'Critical Finding SLA', 'Any Critical finding ($50k+ exposure or fraud) must trigger an instant SMS/email alert to the Engagement Partner within 1 hour.', 'Automated notification engine dispatches alert upon severity classification.'],
          ['BR-004', 'Evidence Cryptographic Integrity', 'Every file uploaded must generate a SHA-256 checksum upon receipt.', 'System re-verifies hash on download; alerts lead auditor if file checksum changes.']
        ]
      }
    }
  },
  {
    id: 'sec-12',
    number: 12,
    title: 'Success Metrics',
    summary: 'KPIs for measuring software performance and business outcomes.',
    content: {
      items: [
        'Audit Velocity Index: 30% reduction in total billable hours per audit engagement while maintaining or raising quality score.',
        'Audit Leak Discovery Value: Total accumulated financial recovery / leak identification logged across active audits ($10M+ threshold target).',
        'Auditee Response Turnaround: Average time for audited entities to respond to fieldwork queries reduced from 5.2 days to 1.4 days.',
        'User Adoption Rate: >90% daily active auditor engagement within 30 days of client rollout.'
      ]
    }
  },
  {
    id: 'sec-13',
    number: 13,
    title: 'Risks & Mitigation Strategies',
    summary: 'Identified project risks with proactive mitigation plans.',
    content: {
      table: {
        headers: ['Risk ID', 'Description', 'Likelihood / Impact', 'Mitigation Strategy'],
        rows: [
          ['RSK-01', 'Auditee data provided in corrupted or unstandardized formats.', 'High / Medium', 'Build robust pre-ingestion ETL data cleaning wizards with auto-column matching.'],
          ['RSK-02', 'User resistance from auditors accustomed to legacy Excel workbooks.', 'Medium / High', 'Provide 1-click Excel export/import syncing and intuitive spreadsheet-like grid views.'],
          ['RSK-03', 'Cross-tenant data leakage due to permission misconfiguration.', 'Low / Critical', 'Implement automated continuous security integration testing and strict row-level database security policies.']
        ]
      }
    }
  },
  {
    id: 'sec-14',
    number: 14,
    title: 'Future Roadmap',
    summary: 'Multi-phase evolution beyond the baseline system release.',
    content: {
      subsections: [
        {
          subtitle: 'Phase 1: Foundation & Core Audit Workspaces (Current Launch)',
          details: '8 core audit templates, MUS sampling engine, basic forensic Benford testing, auditee response portal, BRD integration.'
        },
        {
          subtitle: 'Phase 2: Deep ERP Connectors & Automated Continuous Auditing (Q3 2026)',
          details: 'Direct real-time webhook listeners for SAP S/4HANA, NetSuite, and Oracle Fusion to execute perpetual inventory and invoice audits.'
        },
        {
          subtitle: 'Phase 3: Autonomous AI Forensic Agent (Q1 2027)',
          details: 'Self-learning AI agent capable of drafting complete preliminary audit observation memos, running cross-client vendor risk clustering, and predicting high-leakage distributor channels.'
        }
      ]
    }
  }
];
