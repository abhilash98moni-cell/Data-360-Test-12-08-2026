import { AuthoritativeQuestionnaireState, QuestionnaireAnswerItem, QuestionnaireAuditorNoteItem } from './questionnaireService';

export async function fetchQuestionnaireState(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  userRole?: string,
  userOrg?: string
): Promise<{ success: boolean; found: boolean; state: AuthoritativeQuestionnaireState; error?: string }> {
  try {
    const params = new URLSearchParams({
      client,
      distributor,
      auditId,
      ...(userRole ? { role: userRole } : {}),
      ...(userOrg ? { organization: userOrg } : {})
    });

    const res = await fetch(`/api/questionnaire/sync?${params.toString()}`, {
      headers: {
        'x-user-role': userRole || '',
        'x-user-org': userOrg || ''
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Failed to sync questionnaire state`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('fetchQuestionnaireState API error:', err);
    return {
      success: false,
      found: false,
      state: null as any,
      error: err.message || 'Network error syncing questionnaire'
    };
  }
}

export async function saveQuestionnaireAnswers(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  answers: Record<string, QuestionnaireAnswerItem>,
  userEmail: string,
  userName: string,
  version: number,
  userRole?: string,
  userOrg?: string
): Promise<{ success: boolean; state?: AuthoritativeQuestionnaireState; error?: string }> {
  try {
    const res = await fetch('/api/questionnaire/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || '',
        'x-user-org': userOrg || ''
      },
      body: JSON.stringify({
        client,
        distributor,
        auditId,
        answers,
        userEmail,
        userName,
        version,
        userRole,
        userOrg
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Failed to save questionnaire answers`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('saveQuestionnaireAnswers API error:', err);
    return {
      success: false,
      error: err.message || 'Failed to save questionnaire answers'
    };
  }
}

export async function submitQuestionnaire(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  userEmail: string,
  userName: string,
  userRole?: string,
  userOrg?: string
): Promise<{ success: boolean; state?: AuthoritativeQuestionnaireState; error?: string }> {
  try {
    const res = await fetch('/api/questionnaire/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || '',
        'x-user-org': userOrg || ''
      },
      body: JSON.stringify({
        client,
        distributor,
        auditId,
        userEmail,
        userName,
        userRole,
        userOrg
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Failed to submit questionnaire`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('submitQuestionnaire API error:', err);
    return {
      success: false,
      error: err.message || 'Failed to submit questionnaire'
    };
  }
}

export async function saveQuestionnaireAuditorNotes(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  auditorNotes: Record<string, QuestionnaireAuditorNoteItem>,
  userEmail: string,
  userName: string,
  userRole: string
): Promise<{ success: boolean; auditorNotes?: Record<string, QuestionnaireAuditorNoteItem>; error?: string }> {
  try {
    const res = await fetch('/api/questionnaire/auditor-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole || ''
      },
      body: JSON.stringify({
        client,
        distributor,
        auditId,
        auditorNotes,
        userEmail,
        userName,
        userRole
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}: Failed to save auditor notes`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('saveQuestionnaireAuditorNotes API error:', err);
    return {
      success: false,
      error: err.message || 'Failed to save auditor notes'
    };
  }
}

export async function requestEditAccessQuestionnaire(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  userEmail: string,
  userName: string
): Promise<{ success: boolean; state?: AuthoritativeQuestionnaireState; error?: string }> {
  try {
    const res = await fetch('/api/questionnaire/edit-access-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, distributor, auditId, userEmail, userName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request edit access');
    return data;
  } catch (err: any) {
    console.error('requestEditAccessQuestionnaire error:', err);
    return { success: false, error: err.message };
  }
}

export async function reviewEditAccessQuestionnaire(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  action: 'APPROVE' | 'REJECT',
  userEmail: string,
  userName: string
): Promise<{ success: boolean; state?: AuthoritativeQuestionnaireState; error?: string }> {
  try {
    const res = await fetch('/api/questionnaire/edit-access-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, distributor, auditId, action, userEmail, userName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to review edit access');
    return data;
  } catch (err: any) {
    console.error('reviewEditAccessQuestionnaire error:', err);
    return { success: false, error: err.message };
  }
}

export async function customizeQuestionnaire(
  client: string,
  distributor: string,
  auditId: string = 'eng-101',
  customSections: any[],
  userEmail: string,
  userName: string
): Promise<{ success: boolean; state?: AuthoritativeQuestionnaireState; error?: string }> {
  try {
    const res = await fetch('/api/questionnaire/customize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, distributor, auditId, customSections, userEmail, userName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to customize questionnaire');
    return data;
  } catch (err: any) {
    console.error('customizeQuestionnaire error:', err);
    return { success: false, error: err.message };
  }
}
