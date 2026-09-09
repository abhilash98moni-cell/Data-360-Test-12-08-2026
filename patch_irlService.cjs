const fs = require('fs');

const newCode = `import { getSupabaseServerClient } from '../lib/supabaseServer.js';
import { getItemCompletionDetails } from '../utils/irlValidation.js';
export { getSupabaseServerClient };

export interface AuthoritativeIRLRecord {
  found: boolean;
  recordId?: string;
  state: any;
  createdAt?: string;
}

export async function getAuthoritativeIRLState(clientName: string, distName: string, auditId: string): Promise<AuthoritativeIRLRecord> {
  const supabase = getSupabaseServerClient();
  
  const { data: qData, error: qError } = await supabase
    .from('questionnaires')
    .select('*')
    .eq('audit_id', auditId)
    .maybeSingle();

  if (qError || !qData) {
    return { found: false, state: {
      client: clientName, distributor: distName, auditId, status: 'Not Started',
      isLocked: false, completionPercentage: 0, completedCount: 0, totalCount: 0, requests: [], version: 1, updatedAt: new Date().toISOString()
    } };
  }

  const { data: itemsData } = await supabase
    .from('questionnaire_items')
    .select('*')
    .eq('questionnaire_id', qData.id);

  return {
    found: true,
    recordId: qData.id,
    state: {
      client: clientName,
      distributor: distName,
      auditId,
      status: qData.status,
      isLocked: qData.is_locked,
      completionPercentage: qData.completion_percentage,
      submissionDate: qData.submission_date,
      submittedBy: qData.submitted_by,
      requests: itemsData || [],
      version: 1,
      updatedAt: qData.updated_at
    },
    createdAt: qData.created_at
  };
}

export async function saveAuthoritativeIRLState(clientName: string, distName: string, state: any, auditId?: string) {
  const supabase = getSupabaseServerClient();
  const targetAuditId = auditId || state.auditId;
  
  // Upsert Questionnaire
  const { data: qData, error: qError } = await supabase
    .from('questionnaires')
    .upsert({
      audit_id: targetAuditId,
      status: state.status || 'Draft',
      is_locked: state.isLocked || false,
      completion_percentage: state.completionPercentage || 0,
      submission_date: state.submissionDate,
      submitted_by: state.submittedBy,
      updated_at: new Date().toISOString()
    }, { onConflict: 'audit_id' })
    .select()
    .single();

  if (qError) throw new Error(\`Failed to save questionnaire: \${qError.message}\`);

  // Upsert Items
  if (state.requests && state.requests.length > 0) {
    const items = state.requests.map((r: any) => ({
      questionnaire_id: qData.id,
      ref_number: String(r.refNumber || r.id),
      category: r.category,
      title: r.title,
      description: r.description,
      is_mandatory: r.isMandatory || false,
      status: r.status || 'Pending',
      reviewer_status: r.reviewerStatus || 'Pending Review',
      text_response: r.textResponse,
      reviewer_comment: r.reviewerComment,
      updated_at: new Date().toISOString()
    }));
    
    // Simplistic replace for now to ensure consistency
    await supabase.from('questionnaire_items').delete().eq('questionnaire_id', qData.id);
    await supabase.from('questionnaire_items').insert(items);
  }

  return { savedAt: new Date().toISOString(), recordId: qData.id, state };
}

export async function getAuthoritativeSubmissions(clientName?: string) {
  const supabase = getSupabaseServerClient();
  let query = supabase.from('questionnaires').select('*, engagements(client_name, distributor_name)');
  const { data, error } = await query;
  if (error) return [];
  
  return data.map((d: any) => ({
    client: d.engagements?.client_name,
    distributor: d.engagements?.distributor_name,
    auditId: d.audit_id,
    status: d.status,
    isLocked: d.is_locked,
    completionPercentage: d.completion_percentage,
    submissionDate: d.submission_date,
    submittedBy: d.submitted_by
  }));
}

export async function createAuthoritativeEditRequest(params: any) {
  throw new Error("Edit requests must be migrated to proper relational tables.");
}
export async function getAuthoritativeEditRequests(clientName?: string, distName?: string) {
  return [];
}
export async function reviewAuthoritativeEditRequest(params: any) {
  throw new Error("Edit requests must be migrated to proper relational tables.");
}
`;

fs.writeFileSync('src/services/irlService.ts', newCode);
