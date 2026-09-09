export type EnterpriseRole = 
  | 'Platform Super Admin' 
  | 'AA Super Admin' 
  | 'Audit Manager' 
  | 'Auditor' 
  | 'Reviewer' 
  | 'Client Super Admin' 
  | 'Client Employee' 
  | 'Distributor Admin' 
  | 'Distributor Employee'
  | 'Distributor';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Auditor' | 'Distributor' | EnterpriseRole;
  title: string;
  organization: string;
  avatarInitials: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'User Invited' | 'Distributor Assigned' | 'Documents Uploaded' | 'Clarification Requested' | 'Submission Completed' | 'Evidence Accepted' | 'Evidence Rejected' | 'Required Data Updated' | 'System' | string;
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
  targetUserRole?: string;
  targetOrganization?: string;
  targetVoucherNo?: string;
  targetSampleId?: string;
  metadata?: {
    voucherNo?: string;
    sampleId?: string;
    linkTab?: string;
    targetRole?: string;
    distributorName?: string;
    action?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface ConversationSummary {
  conversationId: string;
  auditId: string;
  distributorId: string;
  distributorName: string;
  distributorCode?: string;
  distributorRegion?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderName: string;
    senderRole: string;
  };
  unreadCount: number;
}

export interface ThreadedMessage {
  id: string;
  conversationId: string;
  auditId: string;
  distributorId: string;
  contextType?: 'GENERAL' | 'IRL' | 'QUESTIONNAIRE' | 'SAMPLING';
  contextId?: string;
  contextLabel?: string;
  requestRef?: string;
  requestTitle?: string;
  senderName: string;
  senderEmail: string;
  senderRole: EnterpriseRole;
  senderOrganization: string;
  timestamp: string;
  content: string;
  attachments?: {
    fileName: string;
    fileSizeMB: number;
    url?: string;
    googleDriveFileId?: string;
  }[];
  mentions?: string[];
  replyToId?: string;
  isReadByAuditor?: boolean;
  isReadByDistributor?: boolean;
  createdAt?: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userEmail: string;
  userName: string;
  userRole: EnterpriseRole | string;
  userOrganization: string;
  isActive: boolean;
  joinedAt: string;
  addedBy: string;
  removedAt?: string;
  removedBy?: string;
}

export interface EvidenceRecord {
  id: string;
  clientName?: string;
  auditId: string;
  auditCode: string;
  auditName?: string;
  distributorName: string;
  requestRef: string;
  requestTitle: string;
  section?: string;
  fileName: string;
  fileSizeMB: number;
  fileType: string;
  googleDriveFileId?: string;
  googleDriveFolderId?: string;
  version: number;
  hash?: string;
  uploader?: 'Auditor' | 'Distributor' | string;
  uploaderRole?: string;
  uploadedBy: string;
  source?: string;
  uploadedDate: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'CLARIFICATION_REQUIRED' | 'Pending Review' | 'Accepted' | 'Rejected' | 'Clarification Required';
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  // AI-ready data structure fields (nullable/optional for future AI integration)
  aiStatus?: string;
  aiSummary?: string;
  aiFlags?: Record<string, any>;
  aiRiskScore?: number;
  aiExtractedData?: Record<string, any>;
  aiAnalysisTimestamp?: string;
  documentUsage?: string | string[];
  auditPeriod?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  organization: string;
  action: 'Login' | 'Logout' | 'Upload' | 'Download' | 'Delete' | 'Submission' | 'Role Change' | 'Invitation' | 'Password Reset';
  ipAddress: string;
  browser: string;
  device: string;
  details: string;
}

export type AuditType = 
  | 'Distributor' 
  | 'Vendor' 
  | 'Dealer' 
  | 'Franchise' 
  | 'Compliance' 
  | 'Operational' 
  | 'Financial' 
  | 'Forensic';

export type AuditStatus = 'Planning' | 'Fieldwork' | 'Sampling' | 'Draft Report' | 'Management Review' | 'Remediation' | 'Completed';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface AuditEngagement {
  id: string;
  code: string;
  title: string;
  clientName: string;
  clientIndustry: string;
  distributorName?: string;
  distributorCode?: string;
  auditPeriod?: string;
  type: AuditType;
  status: AuditStatus;
  riskRating: RiskLevel;
  leadAuditor: string;
  teamSize: number;
  startDate: string;
  targetCompletion: string;
  progressPercent: number;
  financialExposure: number; // Discrepancies or leakage identified in USD
  sampledRecordsCount: number;
  totalPopulationCount: number;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  location: string;
}

export interface AuditFinding {
  id: string;
  engagementId: string;
  engagementTitle: string;
  findingCode: string;
  title: string;
  category: 'Revenue Leakage' | 'Unauthorized Discount' | 'Phantom Stock' | 'Contract Violation' | 'Duplicate Payment' | 'Process Defect' | 'Compliance Breached';
  severity: RiskLevel;
  financialImpact: number;
  status: 'Open' | 'Under Review' | 'CAPA Assigned' | 'Resolved' | 'Closed';
  identifiedDate: string;
  assignedTo: string;
  dueDate: string;
  rootCause: string;
  recommendation: string;
  auditedEntity: string;
  evidenceFilesCount: number;
}

export interface SamplingRun {
  id: string;
  auditId: string;
  populationName: string;
  populationSize: number;
  totalPopulationValue: number;
  methodology: 'Monetary Unit Sampling (MUS)' | 'Stratified Random' | 'Systematic Interval' | 'Risk-Weighted Forensic';
  confidenceLevel: number; // e.g. 95%
  tolerableMisstatement: number;
  sampleSize: number;
  sampledValue: number;
  exceptionsFound: number;
  projectedError: number;
  status: 'Calculated' | 'In Progress' | 'Verified';
}

export interface ForensicAnomaly {
  id: string;
  transactionRef: string;
  vendorOrPartner: string;
  amount: number;
  date: string;
  anomalyType: 'Benford Law Deviation' | 'Split Below Threshold' | 'Duplicate Invoice / Account' | 'Off-Hours Transaction' | 'Unusual Discount Ratio' | 'Shell Company Match';
  riskScore: number; // 0 - 100
  status: 'Unreviewed' | 'Flagged for Testing' | 'Cleared' | 'Confirmed Misstatement';
  description: string;
}

export interface AuditAssignment {
  id: string;
  engagementId: string;
  engagementTitle: string;
  taskTitle: string;
  assignee: string;
  role: 'Auditor' | 'Audit Manager' | 'Audit Partner' | 'Client Admin';
  module: 'Questionnaire' | 'Evidence Collection' | 'MUS Sampling' | 'Forensic Testing' | 'CAPA Review' | 'Drafting Report';
  status: 'Completed' | 'On Progress' | 'Pending';
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface IIRFile {
  id: string;
  evidenceId: string;
  googleDriveFileId?: string;
  fileName: string;
  fileSizeMB: number;
  fileType: string;
  uploadedBy: string;
  source?: string;
  uploadDate: string;
  version: number;
  hash: string;
  status: 'Uploaded' | 'Accepted' | 'Rejected';
  webViewLink?: string;
  folderPath?: string;
}

export interface IIRComment {
  id: string;
  author: string;
  role: 'Distributor' | 'Auditor' | 'Audit Manager';
  timestamp: string;
  message: string;
  attachments?: string[];
}

export type IIRResponseStatus = 
  | 'Pending' 
  | 'In Progress'
  | 'Partially Completed' 
  | 'Completed' 
  | 'Submitted' 
  | 'Under Review' 
  | 'Clarification Required' 
  | 'Accepted' 
  | 'Rejected';

export type IIRReviewerStatus = 
  | 'Pending Review' 
  | 'Accepted' 
  | 'Clarification Required' 
  | 'Rejected';

export type ReferenceType = 
  | 'Sample Data' 
  | 'Blank Template' 
  | 'Instruction / Guidance Document';

export interface ReferenceMaterialVersion {
  version: number;
  fileName: string;
  fileSizeMB: number;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  source?: string;
  description?: string;
  fileUrl?: string;
}

export interface AuditorReferenceMaterial {
  id: string;
  tenant?: string;
  client?: string;
  auditId?: string;
  requirementId: string;
  requirementVersion?: number;
  referenceType: ReferenceType;
  fileName: string;
  fileSizeMB: number;
  fileType: string;
  description: string;
  uploadedBy: string;
  source?: string;
  uploadDate: string;
  fileVersion: number;
  status: 'Active' | 'Archived' | 'Draft';
  displayToDistributor: boolean;
  fileUrl?: string;
  versionHistory?: ReferenceMaterialVersion[];
}

export interface ReferenceAccessLog {
  id: string;
  referenceId: string;
  requirementRef: string;
  user: string;
  userRole: string;
  timestamp: string;
  action: 'Uploaded' | 'Viewed' | 'Downloaded' | 'Replaced' | 'Version Created' | 'Visibility Changed';
  ipAddress: string;
  auditId?: string;
  distributorName?: string;
  details?: string;
}

export interface SubQuestion {
  id: string;
  refCode: string; // e.g. "1A", "1B", "1C"
  title: string;
  description?: string;
  responseFormat: 'text' | 'file' | 'text_and_file' | 'dropdown' | 'number' | 'yes_no';
  options?: string[]; // for dropdown format
  isMandatory: boolean;
}

export interface SubQuestionResponse {
  subQuestionId: string;
  textResponse?: string;
  selectedOption?: string;
  uploadedFiles?: IIRFile[];
}

export interface IIRRequestItem {
  id: string;
  refNumber: string; // e.g. "1.1", "2.3"
  category: string; // e.g. "Distributor General Information"
  categoryNumber: number; // 1 to 6
  title: string;
  description: string;
  isMandatory: boolean;
  questionType?: 'standard' | 'yes_no_conditional' | 'yes_no_only';
  allowDocumentUpload?: boolean;
  allowTextResponse?: boolean;
  isYesNoOnly?: boolean;
  responseType?: 'Yes/No Only' | 'File + text' | 'File only' | 'Text only' | string;
  conditionalRules?: {
    yesSubQuestions?: SubQuestion[];
    noSubQuestions?: SubQuestion[];
  };
  subQuestionResponses?: Record<string, SubQuestionResponse>;
  allowedFileTypes: string[];
  maxSizeMB: number;
  status: IIRResponseStatus;
  reviewerStatus: IIRReviewerStatus;
  textResponse: string;
  noUploadExplanation: string;
  uploadedFiles: IIRFile[];
  comments: IIRComment[];
  lastUpdated: string;
  reviewerComment?: string;
  sampleMaterialEnabled?: boolean;
  referenceMaterial?: AuditorReferenceMaterial;
}

export interface IIRAuditTrail {
  id: string;
  action: 'Login' | 'Draft Saved' | 'File Uploaded' | 'File Downloaded' | 'File Deleted' | 'File Replaced' | 'Response Edited' | 'Submitted' | 'Edit Requested' | 'Edit Approved' | 'Review Status Updated';
  user: string;
  role: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}

export interface BRDSection {
  id: string;
  number: number;
  title: string;
  summary: string;
  content: {
    overview?: string;
    items?: string[];
    subsections?: {
      subtitle: string;
      details: string | string[];
    }[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  };
}

export interface ReportFinding {
  id: string;
  findingNumber: number;
  severity: 'Critical' | 'High' | 'Significant' | 'Medium' | 'Low';
  title: string;
  description: string;
  contractSection: string;
  rootCause: string;
  impact: string;
  evidence: string[];
  recommendedActionClient: string;
  recommendedActionDistributor: string;
  owner: string;
  dueDate: string;
  sources: string[];
}

export interface DistributorOverview {
  name: string;
  location: string;
  employees: number | string;
  contracts: string;
  contacts: string;
  products: string;
  sales: string;
  services: string;
  territories: string;
  percentBusiness: string;
  grossMargin: string;
  inventory: string;
  accountsReceivable: string;
  documentData?: Record<string, string>;
  sections?: { id: string; label: string }[];
}

export interface ReportMetadata {
  id: string;
  clientId: string;
  distributorId: string;
  auditId: string;
  reportType: string;
  templateId: string;
  templateVersion: string;
  reportVersion: string;
  status: 'DRAFT' | 'IN REVIEW' | 'FINAL';
  docxFileId?: string;
  pdfFileId?: string;
  createdBy: string;
  createdAt: string;
  finalizedBy?: string;
  finalizedAt?: string;
  executiveSummary?: string;
  findings: ReportFinding[];
  overview: DistributorOverview;
  documentData?: Record<string, string>;
  sections?: { id: string; label: string }[];
}
