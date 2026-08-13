import { IIRRequestItem } from '../types';

export interface RequirementCompletionDetail {
  isComplete: boolean;
  reason?: string;
}

/**
 * Canonical Validation Model for IRL Requirements.
 * Enforces Rules A, B, C, D, E consistently across frontend and backend.
 */
export const getItemCompletionDetails = (item: any): RequirementCompletionDetail => {
  const isMandatory = Boolean(item.isMandatory ?? item.is_mandatory);

  // Rule E: Optional / Non-mandatory items (isMandatory === false) NEVER block submission
  if (!isMandatory) {
    return { isComplete: true };
  }

  // 1. Rule D: Yes/No Conditional Question
  if (item.questionType === 'yes_no_conditional') {
    if (item.textResponse !== 'Yes' && item.textResponse !== 'No') {
      if (!isMandatory) {
        return { isComplete: true };
      }
      return {
        isComplete: false,
        reason: 'Mandatory Yes/No question has not been answered.'
      };
    }

    const activeSubs = item.textResponse === 'Yes' 
      ? item.conditionalRules?.yesSubQuestions || [] 
      : item.conditionalRules?.noSubQuestions || [];
    
    for (const sub of activeSubs) {
      if (sub.isMandatory) {
        const resp = item.subQuestionResponses?.[sub.id];
        if (!resp) {
          return {
            isComplete: false,
            reason: `Mandatory conditional sub-question (${sub.refCode || 'Sub-question'}: "${sub.title || ''}") is missing response.`
          };
        }
        if (sub.responseFormat === 'file') {
          if (!resp.uploadedFiles || resp.uploadedFiles.length === 0) {
            return {
              isComplete: false,
              reason: `Mandatory conditional sub-question (${sub.refCode || 'Sub-question'}: "${sub.title || ''}") requires a document upload.`
            };
          }
        } else if (sub.responseFormat === 'text_and_file') {
          const hasText = !!resp.textResponse && resp.textResponse.trim().length > 0;
          const hasFile = !!resp.uploadedFiles && resp.uploadedFiles.length > 0;
          if (!hasText || !hasFile) {
            return {
              isComplete: false,
              reason: `Mandatory conditional sub-question (${sub.refCode || 'Sub-question'}: "${sub.title || ''}") requires both text explanation and document upload.`
            };
          }
        } else if (sub.responseFormat === 'dropdown') {
          if (!resp.selectedOption) {
            return {
              isComplete: false,
              reason: `Mandatory conditional sub-question (${sub.refCode || 'Sub-question'}: "${sub.title || ''}") requires dropdown selection.`
            };
          }
        } else {
          if (!resp.textResponse || resp.textResponse.trim().length === 0) {
            return {
              isComplete: false,
              reason: `Mandatory conditional sub-question (${sub.refCode || 'Sub-question'}: "${sub.title || ''}") requires text response.`
            };
          }
        }
      }
    }
    return { isComplete: true };
  }

  // 2. Rule D: Yes/No Only Question
  if (item.questionType === 'yes_no_only' || item.isYesNoOnly || item.responseType === 'Yes/No Only') {
    if (item.textResponse === 'Yes' || item.textResponse === 'No') {
      return { isComplete: true };
    }
    if (!isMandatory) {
      return { isComplete: true };
    }
    return {
      isComplete: false,
      reason: 'Mandatory Yes/No question has not been answered.'
    };
  }

  // 3. Rule B: Document Required & File Uploaded
  const hasFiles = Boolean(item.uploadedFiles && item.uploadedFiles.length > 0);
  if (hasFiles) {
    return { isComplete: true }; // Document uploaded -> Complete without needing explanation
  }

  // No document uploaded
  if (isMandatory) {
    const explanationLen = (item.noUploadExplanation || '').trim().length;
    if (explanationLen >= 50) {
      return { isComplete: true }; // Rule C: Explanation >= 50 chars -> Complete
    }

    // Check for text-only or text-required items
    const isTextOnly = item.responseType === 'Text only' || item.allowDocumentUpload === false;
    const hasTextResponse = Boolean(item.textResponse && item.textResponse.trim().length > 0);

    if (isTextOnly) {
      if (hasTextResponse) {
        return { isComplete: true };
      }
      return {
        isComplete: false,
        reason: 'Mandatory text response is missing.'
      };
    }

    // Rule A / Rule C: Standard question with missing document
    if (explanationLen === 0) {
      return {
        isComplete: false,
        reason: 'Required document is missing and no explanation has been provided (minimum 50 characters required).'
      };
    } else {
      return {
        isComplete: false,
        reason: `Required document is missing and explanation is only ${explanationLen} characters (minimum 50 characters required).`
      };
    }
  }

  // Rule E: Optional / Non-mandatory items (isMandatory === false)
  return { isComplete: true };
};

export const isItemComplete = (item: any): boolean => {
  return getItemCompletionDetails(item).isComplete;
};
