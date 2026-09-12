import { AuditEngagement, AuditFinding, SamplingRun, ForensicAnomaly, AuditAssignment } from '../types';

export const INITIAL_ENGAGEMENTS: AuditEngagement[] = [
  {
    id: 'eng-101',
    code: 'AUD-2026-DIST-001',
    title: 'FY26 Midwest Trading Co. Rebates & Inventory Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    type: 'Distributor',
    status: 'Fieldwork',
    riskRating: 'High',
    leadAuditor: 'Sarah Jenkins',
    teamSize: 4,
    startDate: '2026-06-15',
    targetCompletion: '2026-08-30',
    progressPercent: 68,
    financialExposure: 425000,
    sampledRecordsCount: 1450,
    totalPopulationCount: 18200,
    findingsCount: { critical: 2, high: 4, medium: 7, low: 3 },
    location: 'Midwest Region (MDT-8092)'
  }
];

export const INITIAL_FINDINGS: AuditFinding[] = [
  {
    id: 'fnd-1',
    engagementId: 'eng-101',
    engagementTitle: 'FY26 Distributor Channel Rebates',
    findingCode: 'FND-DIST-01',
    title: 'Unearned Volume Rebate Claimed by Midwest Trading Co.',
    category: 'Revenue Leakage',
    severity: 'Critical',
    financialImpact: 185000,
    status: 'CAPA Assigned',
    identifiedDate: '2026-07-12',
    assignedTo: 'Midwest Compliance Team (Robert Vance)',
    dueDate: '2026-08-15',
    rootCause: 'Distributor calculated rebates using gross list prices instead of net contractual prices following Q2 price restructuring.',
    recommendation: 'Issue clawback invoice for $185,000 and update ERP rebate tier engine to validate against net sales ledger.',
    auditedEntity: 'Midwest Trading Co. (Distributor ID: DIST-882)',
    evidenceFilesCount: 4
  }
];

export const INITIAL_SAMPLING_RUNS: SamplingRun[] = [
  {
    id: 'smp-1',
    auditId: 'eng-101',
    populationName: 'Q2 Midwest Freight Deductions',
    populationSize: 450,
    totalPopulationValue: 450000,
    methodology: 'Stratified Random',
    confidenceLevel: 95,
    tolerableMisstatement: 22500,
    sampleSize: 45,
    sampledValue: 45000,
    exceptionsFound: 3,
    projectedError: 15000,
    status: 'Verified',
  }
];

export const INITIAL_FORENSIC_ANOMALIES: ForensicAnomaly[] = [
  {
    id: 'ano-1',
    transactionRef: 'INV-40992',
    vendorOrPartner: 'Midwest Trading Co.',
    amount: 45000,
    date: '2026-07-25',
    anomalyType: 'Duplicate Invoice / Account',
    description: 'Vendor invoices 40992 through 41015 submitted sequentially on weekends.',
    riskScore: 92,
    status: 'Unreviewed'
  }
];

export const INITIAL_ASSIGNMENTS: AuditAssignment[] = [
  {
    id: 'asg-1',
    engagementId: 'eng-101',
    engagementTitle: 'FY26 Midwest Trading Co. Rebates & Inventory Audit',
    taskTitle: 'Risk Assessment',
    assignee: 'Sarah Jenkins',
    role: 'Audit Manager',
    module: 'Questionnaire',
    status: 'On Progress',
    dueDate: '2026-08-15',
    priority: 'High'
  },
  {
    id: 'asg-2',
    engagementId: 'eng-101',
    engagementTitle: 'FY26 Midwest Trading Co. Rebates & Inventory Audit',
    taskTitle: 'ERP Data Extraction',
    assignee: 'David Chen',
    role: 'Auditor',
    module: 'Forensic Testing',
    status: 'Completed',
    dueDate: '2026-08-10',
    priority: 'High'
  }
];

