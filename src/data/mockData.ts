import { AuditEngagement, AuditFinding, SamplingRun, ForensicAnomaly, AuditAssignment } from '../types';

export const INITIAL_ENGAGEMENTS: AuditEngagement[] = [
  {
    id: 'eng-101',
    code: 'AUD-2026-DIST-001',
    title: 'FY26 Midwest Trading Co. Rebates & Inventory Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    distributorName: 'Midwest Trading Co.',
    distributorCode: 'MDT-8092',
    auditPeriod: 'FY 2025-26',
    type: 'Distributor',
    status: 'Fieldwork',
    riskRating: 'High',
    leadAuditor: 'Sarah Jenkins',
    teamSize: 4,
    startDate: '15 Sep 2026',
    targetCompletion: '17 Dec 2026',
    forecastCompletion: '12 Dec 2026',
    baselineCompletion: '17 Dec 2026',
    progressPercent: 72,
    daysRemaining: 8,
    overdueItemsCount: 3,
    varianceText: '5 days ahead',
    varianceStatus: 'ahead',
    financialExposure: 425000,
    sampledRecordsCount: 1450,
    totalPopulationCount: 18200,
    findingsCount: { critical: 2, high: 4, medium: 7, low: 3 },
    location: 'Midwest Region (MDT-8092)',
    timelinePhases: {
      irlKickoff: { progress: 100, status: 'Completed', startWeek: 1, endWeek: 2 },
      dataCollection: { progress: 80, status: 'In Progress', startWeek: 2, endWeek: 5 },
      dataAnalytics: { progress: 50, status: 'In Progress', startWeek: 4, endWeek: 7 },
      supportingDocs: { progress: 60, status: 'In Progress', startWeek: 6, endWeek: 9 },
      transactionTesting: { progress: 80, status: 'In Progress', startWeek: 6, endWeek: 10 },
      interviewReporting: { progress: 80, status: 'In Progress', startWeek: 10, endWeek: 12 }
    },
    documents: [
      { id: 'doc-101-1', name: 'Master Distributor Agreement FY26.pdf', size: '2.4 MB', category: 'Legal & Contractual', uploadDate: '16 Sep 2026', status: 'Verified' },
      { id: 'doc-101-2', name: 'IRL Baseline Requirement Checklist.xlsx', size: '480 KB', category: 'Compliance', uploadDate: '18 Sep 2026', status: 'Verified' },
      { id: 'doc-101-3', name: 'Q2 Rebate Ledger Extraction.csv', size: '5.1 MB', category: 'Financial', uploadDate: '24 Sep 2026', status: 'Under Review' },
      { id: 'doc-101-4', name: 'Warehouse Physical Stock Certificate.pdf', size: '1.2 MB', category: 'Inventory', uploadDate: '02 Oct 2026', status: 'Verified' }
    ],
    activityLogs: [
      { id: 'act-101-1', timestamp: 'Today, 10:45 AM', user: 'Sarah Jenkins (Lead Auditor)', action: 'Completed review of Q2 rebate calculations and marked 3 exceptions' },
      { id: 'act-101-2', timestamp: 'Yesterday, 3:20 PM', user: 'Robert Vance (Midwest Trading Co.)', action: 'Uploaded revised inventory count reconciliation report' },
      { id: 'act-101-3', timestamp: '10 Oct 2026, 11:00 AM', user: 'David Chen (Auditor)', action: 'Generated Stratified Random sampling batch #2' },
      { id: 'act-101-4', timestamp: '15 Sep 2026, 9:00 AM', user: 'Sarah Jenkins (Lead Auditor)', action: 'Initiated FY26 Midwest Trading Co. audit kick-off' }
    ]
  },
  {
    id: 'eng-102',
    code: 'AUD-2026-DIST-002',
    title: 'FY26 ABC Distributors Commercial Compliance Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    distributorName: 'ABC Distributors',
    distributorCode: 'ABC-2002',
    auditPeriod: 'FY 2025-26',
    type: 'Distributor',
    status: 'Fieldwork',
    riskRating: 'Critical',
    leadAuditor: 'Marcus Vance',
    teamSize: 3,
    startDate: '01 Oct 2026',
    targetCompletion: '20 Dec 2026',
    forecastCompletion: '26 Dec 2026',
    baselineCompletion: '20 Dec 2026',
    progressPercent: 41,
    daysRemaining: 14,
    overdueItemsCount: 5,
    varianceText: '6 days delayed',
    varianceStatus: 'delayed',
    financialExposure: 580000,
    sampledRecordsCount: 980,
    totalPopulationCount: 14500,
    findingsCount: { critical: 4, high: 6, medium: 5, low: 2 },
    location: 'Eastern Region (ABC-2002)',
    timelinePhases: {
      irlKickoff: { progress: 100, status: 'Completed', startWeek: 1, endWeek: 2 },
      dataCollection: { progress: 65, status: 'Overdue', startWeek: 2, endWeek: 5 },
      dataAnalytics: { progress: 30, status: 'In Progress', startWeek: 4, endWeek: 7 },
      supportingDocs: { progress: 20, status: 'Overdue', startWeek: 6, endWeek: 9 },
      transactionTesting: { progress: 15, status: 'Pending', startWeek: 6, endWeek: 10 },
      interviewReporting: { progress: 0, status: 'Pending', startWeek: 10, endWeek: 12 }
    },
    documents: [
      { id: 'doc-102-1', name: 'ABC Distributors Territory Agreement.pdf', size: '3.1 MB', category: 'Legal & Contractual', uploadDate: '02 Oct 2026', status: 'Verified' },
      { id: 'doc-102-2', name: 'Point of Sale (POS) Claims Q1-Q2.xlsx', size: '8.4 MB', category: 'Financial', uploadDate: '12 Oct 2026', status: 'Flagged Exceptions' },
      { id: 'doc-102-3', name: 'Price Protection Authorization Records.pdf', size: '1.8 MB', category: 'Pricing', uploadDate: '18 Oct 2026', status: 'Under Review' }
    ],
    activityLogs: [
      { id: 'act-102-1', timestamp: 'Today, 09:15 AM', user: 'Marcus Vance (Lead Auditor)', action: 'Flagged 5 overdue questionnaire responses for escalation' },
      { id: 'act-102-2', timestamp: '12 Oct 2026, 4:30 PM', user: 'Helen Zhang (ABC Compliance)', action: 'Submitted Q1-Q2 POS Claims dataset' },
      { id: 'act-102-3', timestamp: '01 Oct 2026, 10:00 AM', user: 'Marcus Vance (Lead Auditor)', action: 'Opened audit workspace for ABC Distributors' }
    ]
  },
  {
    id: 'eng-103',
    code: 'AUD-2026-DIST-003',
    title: 'FY26 XYZ Trading Channel Margin & Stock Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    distributorName: 'XYZ Trading',
    distributorCode: 'XYZ-3003',
    auditPeriod: 'FY 2025-26',
    type: 'Distributor',
    status: 'Fieldwork',
    riskRating: 'Medium',
    leadAuditor: 'Elena Rostova',
    teamSize: 2,
    startDate: '15 Oct 2026',
    targetCompletion: '22 Dec 2026',
    forecastCompletion: '24 Dec 2026',
    baselineCompletion: '22 Dec 2026',
    progressPercent: 18,
    daysRemaining: 20,
    overdueItemsCount: 1,
    varianceText: '2 days delayed',
    varianceStatus: 'delayed',
    financialExposure: 195000,
    sampledRecordsCount: 320,
    totalPopulationCount: 8900,
    findingsCount: { critical: 1, high: 2, medium: 3, low: 4 },
    location: 'Western Region (XYZ-3003)',
    timelinePhases: {
      irlKickoff: { progress: 100, status: 'Completed', startWeek: 1, endWeek: 2 },
      dataCollection: { progress: 40, status: 'In Progress', startWeek: 2, endWeek: 5 },
      dataAnalytics: { progress: 10, status: 'In Progress', startWeek: 4, endWeek: 7 },
      supportingDocs: { progress: 0, status: 'Pending', startWeek: 6, endWeek: 9 },
      transactionTesting: { progress: 0, status: 'Pending', startWeek: 6, endWeek: 10 },
      interviewReporting: { progress: 0, status: 'Pending', startWeek: 10, endWeek: 12 }
    },
    documents: [
      { id: 'doc-103-1', name: 'XYZ Trading Direct Wholesale Contract.pdf', size: '1.9 MB', category: 'Legal', uploadDate: '16 Oct 2026', status: 'Verified' },
      { id: 'doc-103-2', name: 'Initial Requirement List (IRL) Package.pdf', size: '2.2 MB', category: 'Compliance', uploadDate: '20 Oct 2026', status: 'Verified' }
    ],
    activityLogs: [
      { id: 'act-103-1', timestamp: 'Yesterday, 2:00 PM', user: 'Elena Rostova (Lead Auditor)', action: 'Issued reminder for missing ERP sales transaction logs' },
      { id: 'act-103-2', timestamp: '15 Oct 2026, 11:30 AM', user: 'Elena Rostova (Lead Auditor)', action: 'Kick-off meeting held with XYZ Trading executives' }
    ]
  },
  {
    id: 'eng-104',
    code: 'AUD-2026-DIST-004',
    title: 'FY26 Sunrise Distributors Channel Governance Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    distributorName: 'Sunrise Distributors',
    distributorCode: 'SND-4004',
    auditPeriod: 'FY 2025-26',
    type: 'Distributor',
    status: 'Planning',
    riskRating: 'Low',
    leadAuditor: 'David Chen',
    teamSize: 2,
    startDate: '01 Nov 2026',
    targetCompletion: '24 Dec 2026',
    forecastCompletion: '24 Dec 2026',
    baselineCompletion: '24 Dec 2026',
    progressPercent: 0,
    daysRemaining: 28,
    overdueItemsCount: 0,
    varianceText: 'On schedule',
    varianceStatus: 'neutral',
    financialExposure: 0,
    sampledRecordsCount: 0,
    totalPopulationCount: 6500,
    findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
    location: 'Southern Territory (SND-4004)',
    timelinePhases: {
      irlKickoff: { progress: 0, status: 'Pending', startWeek: 1, endWeek: 2 },
      dataCollection: { progress: 0, status: 'Pending', startWeek: 2, endWeek: 5 },
      dataAnalytics: { progress: 0, status: 'Pending', startWeek: 4, endWeek: 7 },
      supportingDocs: { progress: 0, status: 'Pending', startWeek: 6, endWeek: 9 },
      transactionTesting: { progress: 0, status: 'Pending', startWeek: 6, endWeek: 10 },
      interviewReporting: { progress: 0, status: 'Pending', startWeek: 10, endWeek: 12 }
    },
    documents: [
      { id: 'doc-104-1', name: 'Sunrise Distribution Charter FY26.pdf', size: '1.5 MB', category: 'Legal', uploadDate: '01 Nov 2026', status: 'Pending' }
    ],
    activityLogs: [
      { id: 'act-104-1', timestamp: '01 Nov 2026, 9:00 AM', user: 'David Chen (Auditor)', action: 'Audit scheduled and pre-engagement checklist issued' }
    ]
  },
  {
    id: 'eng-105',
    code: 'AUD-2026-DIST-005',
    title: 'FY26 Trident Supplies Complete Channel Audit',
    clientName: 'Apex Electronics Corp',
    clientIndustry: 'Consumer Technology',
    distributorName: 'Trident Supplies',
    distributorCode: 'TRD-5005',
    auditPeriod: 'FY 2025-26',
    type: 'Distributor',
    status: 'Completed',
    riskRating: 'Low',
    leadAuditor: 'Sarah Jenkins',
    teamSize: 3,
    startDate: '01 Aug 2026',
    targetCompletion: '10 Dec 2026',
    forecastCompletion: '10 Dec 2026',
    baselineCompletion: '10 Dec 2026',
    progressPercent: 100,
    daysRemaining: 0,
    overdueItemsCount: 0,
    varianceText: 'Completed',
    varianceStatus: 'completed',
    financialExposure: 82000,
    sampledRecordsCount: 2200,
    totalPopulationCount: 22000,
    findingsCount: { critical: 0, high: 1, medium: 2, low: 5 },
    location: 'Northern Region (TRD-5005)',
    timelinePhases: {
      irlKickoff: { progress: 100, status: 'Completed', startWeek: 1, endWeek: 2 },
      dataCollection: { progress: 100, status: 'Completed', startWeek: 2, endWeek: 5 },
      dataAnalytics: { progress: 100, status: 'Completed', startWeek: 4, endWeek: 7 },
      supportingDocs: { progress: 100, status: 'Completed', startWeek: 6, endWeek: 9 },
      transactionTesting: { progress: 100, status: 'Completed', startWeek: 6, endWeek: 10 },
      interviewReporting: { progress: 100, status: 'Completed', startWeek: 10, endWeek: 12 }
    },
    documents: [
      { id: 'doc-105-1', name: 'Final Signed Audit Report - Trident Supplies.pdf', size: '4.2 MB', category: 'Final Report', uploadDate: '10 Dec 2026', status: 'Signed & Published' },
      { id: 'doc-105-2', name: 'Management Representation Letter.pdf', size: '1.1 MB', category: 'Executive', uploadDate: '08 Dec 2026', status: 'Verified' },
      { id: 'doc-105-3', name: 'Full Sampling Verification Certificate.pdf', size: '950 KB', category: 'Audit Testing', uploadDate: '05 Dec 2026', status: 'Verified' }
    ],
    activityLogs: [
      { id: 'act-105-1', timestamp: '10 Dec 2026, 4:00 PM', user: 'Sarah Jenkins (Lead Auditor)', action: 'Published Final Executive Audit Report and closed engagement' },
      { id: 'act-105-2', timestamp: '08 Dec 2026, 2:30 PM', user: 'Trident Supplies Management', action: 'Signed Management Representation Letter' }
    ]
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

