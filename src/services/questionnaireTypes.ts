import { BUSINESS_QUESTIONNAIRE_SECTIONS, TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS } from '../data/questionnaireData';

export type QuestionnaireReviewerStatus = 'Accepted' | 'Clarification Required' | 'Rejected' | 'Pending Review';

export interface QuestionnaireQuestionReviewItem {
  reviewerStatus: QuestionnaireReviewerStatus;
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface QuestionnaireAnswerItem {
  questionId: string;
  responseValue: string;
  explanation?: string;
  attachments?: {
    id: string;
    fileName: string;
    fileSizeMB: number;
    fileType: string;
    googleDriveFileId?: string;
    uploadedBy: string;
    uploadedDate: string;
  }[];
  lastUpdated: string;
  updatedBy: string;
  reviewerStatus?: QuestionnaireReviewerStatus;
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface QuestionnaireAuditorNoteItem {
  questionId: string;
  internalNotes: string;
  isFlaggedForFollowUp: boolean;
  followUpNote: string;
  linkedIRLRequirementId?: string;
  riskRating?: 'Low' | 'Medium' | 'High' | 'Critical';
  reviewerStatus?: QuestionnaireReviewerStatus;
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuthoritativeQuestionnaireState {
  client: string;
  distributor: string;
  auditId: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Under Review' | 'Accepted';
  isLocked: boolean;
  editAccessStatus?: 'LOCKED' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
  editAccessRequestReason?: string;
  editAccessRequestedAt?: string;
  editAccessRequestedBy?: string;
  editAccessApprovedAt?: string;
  editAccessApprovedBy?: string;
  customSections?: any[];
  customTotalCount?: number;
  submissionDate?: string;
  completionPercentage: number;
  answeredCount: number;
  totalCount: number;
  submittedBy?: string;
  answers: Record<string, QuestionnaireAnswerItem>;
  auditorNotes?: Record<string, QuestionnaireAuditorNoteItem>;
  questionReviews?: Record<string, QuestionnaireQuestionReviewItem>;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface AuthoritativeQuestionnaireRecord {
  found: boolean;
  recordId?: string;
  state: AuthoritativeQuestionnaireState;
  createdAt?: string;
}

/**
 * Calculates answer completion count based on whether answers have meaningful values
 */
export function calculateQuestionnaireProgress(answers: Record<string, QuestionnaireAnswerItem>, customSections?: any[]): {
  answeredCount: number;
  totalCount: number;
  completionPercentage: number;
} {
  const sectionsToUse = customSections && customSections.length > 0 ? customSections : BUSINESS_QUESTIONNAIRE_SECTIONS;
  const totalCount = sectionsToUse.reduce((acc: number, sec: any) => acc + (sec.questions ? sec.questions.filter((q: any) => q.isActive !== false).length : 0), 0);
  let answeredCount = 0;

  for (const section of sectionsToUse) {
    for (const q of section.questions) {
      const ans = answers[q.id];
      if (q.isActive !== false && ans && ans.responseValue && ans.responseValue.trim().length > 0) {
        // If question requires details when Yes/No
        if (q.responseType === 'yes_no_details') {
          if (ans.responseValue === 'Yes' || ans.responseValue === 'No') {
            answeredCount++;
          }
        } else {
          answeredCount++;
        }
      }
    }
  }

  const completionPercentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  return { answeredCount, totalCount, completionPercentage };
}
