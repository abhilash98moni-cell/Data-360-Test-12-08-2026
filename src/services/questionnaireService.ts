import { SupabaseClient } from '@supabase/supabase-js';
import { BUSINESS_QUESTIONNAIRE_SECTIONS, TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS } from '../data/questionnaireData.js';
import { getSupabaseServerClient } from '../lib/supabaseServer.js';

export { getSupabaseServerClient };

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
}

export interface QuestionnaireAuditorNoteItem {
  questionId: string;
  internalNotes: string;
  isFlaggedForFollowUp: boolean;
  followUpNote: string;
  linkedIRLRequirementId?: string;
  riskRating?: 'Low' | 'Medium' | 'High' | 'Critical';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AuthoritativeQuestionnaireState {
  client: string;
  distributor: string;
  auditId: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Under Review' | 'Accepted';
  isLocked: boolean;
  submissionDate?: string;
  completionPercentage: number;
  answeredCount: number;
  totalCount: number;
  submittedBy?: string;
  answers: Record<string, QuestionnaireAnswerItem>;
  auditorNotes?: Record<string, QuestionnaireAuditorNoteItem>;
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
export function calculateQuestionnaireProgress(answers: Record<string, QuestionnaireAnswerItem>): {
  answeredCount: number;
  totalCount: number;
  completionPercentage: number;
} {
  const totalCount = TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS;
  let answeredCount = 0;

  for (const section of BUSINESS_QUESTIONNAIRE_SECTIONS) {
    for (const q of section.questions) {
      const ans = answers[q.id];
      if (ans && ans.responseValue && ans.responseValue.trim().length > 0) {
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

/**
 * Retrieves the authoritative Business Questionnaire state from Supabase PostgreSQL.
 * If isAuditor is false, auditorNotes are strictly stripped out before returning.
 */
export async function getAuthoritativeQuestionnaireState(
  clientName: string,
  distName: string,
  auditId: string = 'eng-101',
  isAuditor: boolean = false
): Promise<AuthoritativeQuestionnaireRecord> {
  const supabase = getSupabaseServerClient();
  const stateKey = `${clientName}::${distName}::${auditId}`;

  // 1. Fetch latest distributor responses
  const { data: distData, error: distError } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'QUESTIONNAIRE_DISTRIBUTOR_STATE')
    .eq('target_user_email', stateKey)
    .order('created_at', { ascending: false })
    .limit(1);

  if (distError) {
    console.error('Supabase getAuthoritativeQuestionnaireState error:', distError);
    throw new Error(`Failed to load questionnaire state from Supabase: ${distError.message}`);
  }

  let currentState: AuthoritativeQuestionnaireState;

  if (distData && distData.length > 0 && distData[0].details) {
    currentState = distData[0].details;
  } else {
    // Baseline state
    const nowIso = new Date().toISOString();
    currentState = {
      client: clientName,
      distributor: distName,
      auditId,
      status: 'In Progress',
      isLocked: false,
      completionPercentage: 0,
      answeredCount: 0,
      totalCount: TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS,
      answers: {},
      version: 1,
      updatedAt: nowIso,
      updatedBy: 'System'
    };

    // Save baseline snapshot to database
    const insertRes = await supabase.from('system_audit_logs').insert({
      event_type: 'QUESTIONNAIRE_DISTRIBUTOR_STATE',
      target_user_email: stateKey,
      details: currentState,
      created_at: nowIso
    }).select().single();

    if (insertRes.error) {
      console.error('Supabase questionnaire baseline initialization error:', insertRes.error);
      throw new Error(`Failed to initialize questionnaire state in Supabase: ${insertRes.error.message}`);
    }
  }

  // 2. If Auditor, fetch auditor-only notes
  if (isAuditor) {
    const { data: auditData, error: auditError } = await supabase
      .from('system_audit_logs')
      .select('*')
      .eq('event_type', 'QUESTIONNAIRE_AUDITOR_STATE')
      .eq('target_user_email', stateKey)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!auditError && auditData && auditData.length > 0 && auditData[0].details) {
      currentState.auditorNotes = auditData[0].details.auditorNotes || {};
    } else {
      currentState.auditorNotes = {};
    }
  } else {
    // Strictly ensure no auditor notes exist for distributors
    delete currentState.auditorNotes;
  }

  return {
    found: true,
    state: currentState
  };
}

/**
 * Saves updated questionnaire responses to Supabase PostgreSQL.
 */
export async function saveAuthoritativeQuestionnaireAnswers(
  clientName: string,
  distName: string,
  auditId: string = 'eng-101',
  answers: Record<string, QuestionnaireAnswerItem>,
  userEmail: string = 'distributor@example.com',
  userName: string = 'Distributor User',
  clientVersion?: number
): Promise<{ success: boolean; state: AuthoritativeQuestionnaireState }> {
  const supabase = getSupabaseServerClient();
  const stateKey = `${clientName}::${distName}::${auditId}`;
  const nowIso = new Date().toISOString();

  // Load latest state to handle versioning
  const { data: latestData } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'QUESTIONNAIRE_DISTRIBUTOR_STATE')
    .eq('target_user_email', stateKey)
    .order('created_at', { ascending: false })
    .limit(1);

  const existingState = latestData?.[0]?.details || {};
  const currentVersion = Number(existingState.version || 1);
  const nextVersion = clientVersion && clientVersion > currentVersion ? clientVersion + 1 : currentVersion + 1;

  const { answeredCount, totalCount, completionPercentage } = calculateQuestionnaireProgress(answers);

  const updatedState: AuthoritativeQuestionnaireState = {
    client: clientName,
    distributor: distName,
    auditId,
    status: existingState.status || 'In Progress',
    isLocked: existingState.isLocked || false,
    submissionDate: existingState.submissionDate,
    completionPercentage,
    answeredCount,
    totalCount,
    submittedBy: existingState.submittedBy,
    answers,
    version: nextVersion,
    updatedAt: nowIso,
    updatedBy: `${userName} (${userEmail})`
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'QUESTIONNAIRE_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: updatedState,
    created_at: nowIso
  }).select().single();

  if (insertRes.error) {
    console.error('Supabase saveAuthoritativeQuestionnaireAnswers error:', insertRes.error);
    throw new Error(`Failed to persist questionnaire answers to Supabase: ${insertRes.error.message}`);
  }

  return {
    success: true,
    state: updatedState
  };
}

/**
 * Submits the questionnaire, locking it from further distributor edits unless reopened by auditor.
 */
export async function submitAuthoritativeQuestionnaire(
  clientName: string,
  distName: string,
  auditId: string = 'eng-101',
  userEmail: string,
  userName: string
): Promise<{ success: boolean; state: AuthoritativeQuestionnaireState }> {
  const supabase = getSupabaseServerClient();
  const stateKey = `${clientName}::${distName}::${auditId}`;
  const nowIso = new Date().toISOString();

  // Load existing state
  const { data: latestData, error: loadErr } = await supabase
    .from('system_audit_logs')
    .select('*')
    .eq('event_type', 'QUESTIONNAIRE_DISTRIBUTOR_STATE')
    .eq('target_user_email', stateKey)
    .order('created_at', { ascending: false })
    .limit(1);

  if (loadErr || !latestData || latestData.length === 0) {
    throw new Error('Questionnaire state not found to submit.');
  }

  const existingState = latestData[0].details;
  const currentVersion = Number(existingState.version || 1);
  const nextVersion = currentVersion + 1;

  const { answeredCount, totalCount, completionPercentage } = calculateQuestionnaireProgress(existingState.answers || {});

  const submittedState: AuthoritativeQuestionnaireState = {
    ...existingState,
    status: 'Submitted',
    isLocked: true,
    submissionDate: nowIso,
    submittedBy: `${userName} (${userEmail})`,
    completionPercentage,
    answeredCount,
    totalCount,
    version: nextVersion,
    updatedAt: nowIso,
    updatedBy: `${userName} (${userEmail})`
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'QUESTIONNAIRE_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: submittedState,
    created_at: nowIso
  }).select().single();

  if (insertRes.error) {
    throw new Error(`Failed to submit questionnaire to Supabase: ${insertRes.error.message}`);
  }

  // Insert notification for Audit team
  try {
    await supabase.from('notifications').insert({
      title: 'Business Questionnaire Submitted',
      message: `${distName} has formally submitted the Business Questionnaire (${answeredCount}/${totalCount} questions completed).`,
      category: 'Submission Completed',
      target_organization: clientName,
      created_at: nowIso
    });
  } catch (notifErr) {
    console.warn('Failed to insert questionnaire submission notification:', notifErr);
  }

  return {
    success: true,
    state: submittedState
  };
}

/**
 * Saves Auditor-only notes, risk ratings, and follow-up flags to Supabase PostgreSQL.
 * Stored under a separate event type strictly inaccessible to distributors.
 */
export async function saveAuthoritativeQuestionnaireAuditorNotes(
  clientName: string,
  distName: string,
  auditId: string = 'eng-101',
  auditorNotes: Record<string, QuestionnaireAuditorNoteItem>,
  userEmail: string = 'auditor@example.com',
  userName: string = 'Audit Lead'
): Promise<{ success: boolean; auditorNotes: Record<string, QuestionnaireAuditorNoteItem> }> {
  const supabase = getSupabaseServerClient();
  const stateKey = `${clientName}::${distName}::${auditId}`;
  const nowIso = new Date().toISOString();

  const auditorState = {
    client: clientName,
    distributor: distName,
    auditId,
    auditorNotes,
    updatedAt: nowIso,
    updatedBy: `${userName} (${userEmail})`
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'QUESTIONNAIRE_AUDITOR_STATE',
    target_user_email: stateKey,
    details: auditorState,
    created_at: nowIso
  }).select().single();

  if (insertRes.error) {
    console.error('Supabase saveAuthoritativeQuestionnaireAuditorNotes error:', insertRes.error);
    throw new Error(`Failed to persist auditor notes to Supabase: ${insertRes.error.message}`);
  }

  return {
    success: true,
    auditorNotes
  };
}
