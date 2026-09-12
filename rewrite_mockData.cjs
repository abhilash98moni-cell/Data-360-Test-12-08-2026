const fs = require('fs');

const content = fs.readFileSync('src/data/mockData.ts', 'utf8');

let newContent = content.replace(
  /export const INITIAL_ENGAGEMENTS: AuditEngagement\[\] = \[([\s\S]*?)\];/,
  (match) => {
    // We can just inject the filtered string.
    return `export const INITIAL_ENGAGEMENTS: AuditEngagement[] = [
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
];`;
  }
);

newContent = newContent.replace(
  /export const INITIAL_FINDINGS: AuditFinding\[\] = \[([\s\S]*?)\];/,
  (match) => {
    return `export const INITIAL_FINDINGS: AuditFinding[] = [
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
];`;
  }
);

newContent = newContent.replace(
  /export const INITIAL_SAMPLING_RUNS: SamplingRun\[\] = \[([\s\S]*?)\];/,
  (match) => {
    return `export const INITIAL_SAMPLING_RUNS: SamplingRun[] = [
  {
    id: 'smp-1',
    engagementId: 'eng-101',
    title: 'Q2 Midwest Freight Deductions',
    datasetName: 'midwest_q2_freight_log.xlsx',
    populationSize: 450,
    sampleSize: 45,
    methodology: 'Stratified Random',
    status: 'Completed',
    runDate: '2026-07-22',
    exceptionsFound: 3,
    confidenceLevel: 95
  }
];`;
  }
);

newContent = newContent.replace(
  /export const INITIAL_FORENSIC_ANOMALIES: ForensicAnomaly\[\] = \[([\s\S]*?)\];/,
  (match) => {
    return `export const INITIAL_FORENSIC_ANOMALIES: ForensicAnomaly[] = [
  {
    id: 'ano-1',
    engagementId: 'eng-101',
    title: 'Sequential Invoice Numbers Detected',
    category: 'Falsified Records',
    description: 'Vendor invoices 40992 through 41015 submitted sequentially on weekends.',
    riskScore: 92,
    amountImplicated: 45000,
    status: 'Investigating',
    flaggedDate: '2026-07-25'
  }
];`;
  }
);

newContent = newContent.replace(
  /export const INITIAL_ASSIGNMENTS: AuditAssignment\[\] = \[([\s\S]*?)\];/,
  (match) => {
    return `export const INITIAL_ASSIGNMENTS: AuditAssignment[] = [
  {
    id: 'asg-1',
    engagementId: 'eng-101',
    auditorName: 'Sarah Jenkins',
    role: 'Lead Auditor',
    assignedTasks: ['Risk Assessment', 'Revenue Testing', 'Management Interviews'],
    completionPercent: 80
  },
  {
    id: 'asg-2',
    engagementId: 'eng-101',
    auditorName: 'David Chen',
    role: 'IT/Data Specialist',
    assignedTasks: ['ERP Data Extraction', 'Journal Entry Analytics'],
    completionPercent: 100
  }
];`;
  }
);

fs.writeFileSync('src/data/mockData.ts', newContent);
console.log('Done rewriting mockData.ts');
