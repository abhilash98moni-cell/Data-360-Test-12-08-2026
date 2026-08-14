import fs from 'fs';
let code = fs.readFileSync('src/services/questionnaireService.ts', 'utf8');

const newMethods = `
export async function requestAuthoritativeQuestionnaireEditAccess(
  clientName: string,
  distName: string,
  auditId: string,
  userEmail: string,
  userName: string
): Promise<AuthoritativeQuestionnaireRecord> {
  const supabase = getSupabaseServerClient();
  const stateKey = \`\${clientName}::\${distName}::\${auditId}\`;

  const { state: currentState } = await getAuthoritativeQuestionnaireState(clientName, distName, auditId, false);
  
  const newState = {
    ...currentState,
    editAccessStatus: 'REQUESTED' as const,
    editAccessRequestedAt: new Date().toISOString(),
    editAccessRequestedBy: userName || userEmail,
    version: currentState.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'QUESTIONNAIRE_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: newState,
    created_at: new Date().toISOString()
  });

  if (insertRes.error) throw new Error(insertRes.error.message);

  return { found: true, state: newState };
}

export async function reviewAuthoritativeQuestionnaireEditAccess(
  clientName: string,
  distName: string,
  auditId: string,
  action: 'APPROVE' | 'REJECT',
  userEmail: string,
  userName: string
): Promise<AuthoritativeQuestionnaireRecord> {
  const supabase = getSupabaseServerClient();
  const stateKey = \`\${clientName}::\${distName}::\${auditId}\`;

  const { state: currentState } = await getAuthoritativeQuestionnaireState(clientName, distName, auditId, true);
  
  const newState = {
    ...currentState,
    editAccessStatus: action === 'APPROVE' ? 'APPROVED' as const : 'REJECTED' as const,
    isLocked: action === 'APPROVE' ? false : true,
    editAccessApprovedAt: new Date().toISOString(),
    editAccessApprovedBy: userName || userEmail,
    version: currentState.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };
  
  if (action === 'APPROVE' && newState.status === 'Submitted') {
     newState.status = 'In Progress';
  }

  // We save distributor state
  const distributorState = { ...newState };
  delete distributorState.auditorNotes;

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'QUESTIONNAIRE_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: distributorState,
    created_at: new Date().toISOString()
  });

  if (insertRes.error) throw new Error(insertRes.error.message);

  return { found: true, state: newState };
}

export async function customizeAuthoritativeQuestionnaire(
  clientName: string,
  distName: string,
  auditId: string,
  customSections: any[],
  userEmail: string,
  userName: string
): Promise<AuthoritativeQuestionnaireRecord> {
  const supabase = getSupabaseServerClient();
  const stateKey = \`\${clientName}::\${distName}::\${auditId}\`;

  const { state: currentState } = await getAuthoritativeQuestionnaireState(clientName, distName, auditId, true);
  
  const progress = calculateQuestionnaireProgress(currentState.answers, customSections);
  
  const newState = {
    ...currentState,
    customSections,
    customTotalCount: progress.totalCount,
    answeredCount: progress.answeredCount,
    totalCount: progress.totalCount,
    completionPercentage: progress.completionPercentage,
    version: currentState.version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail
  };

  const distributorState = { ...newState };
  delete distributorState.auditorNotes;

  const insertRes = await supabase.from('system_audit_logs').insert({
    event_type: 'QUESTIONNAIRE_DISTRIBUTOR_STATE',
    target_user_email: stateKey,
    details: distributorState,
    created_at: new Date().toISOString()
  });

  if (insertRes.error) throw new Error(insertRes.error.message);

  return { found: true, state: newState };
}
`;

fs.writeFileSync('src/services/questionnaireService.ts', code + '\n' + newMethods);
console.log('patched new methods');
