import fs from 'fs';
let code = fs.readFileSync('src/services/questionnaireService.ts', 'utf8');

// Add editAccess and custom sections to AuthoritativeQuestionnaireState
code = code.replace(
  "  isLocked: boolean;",
  `  isLocked: boolean;
  editAccessStatus?: 'LOCKED' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
  editAccessRequestedAt?: string;
  editAccessRequestedBy?: string;
  editAccessApprovedAt?: string;
  editAccessApprovedBy?: string;
  customSections?: any[];
  customTotalCount?: number;`
);

// Update calculateQuestionnaireProgress
code = code.replace(
  "export function calculateQuestionnaireProgress(answers: Record<string, QuestionnaireAnswerItem>): {",
  `export function calculateQuestionnaireProgress(answers: Record<string, QuestionnaireAnswerItem>, customSections?: any[]): {`
);
code = code.replace(
  "const totalCount = TOTAL_BUSINESS_QUESTIONNAIRE_QUESTIONS;",
  `const sectionsToUse = customSections && customSections.length > 0 ? customSections : BUSINESS_QUESTIONNAIRE_SECTIONS;
  const totalCount = sectionsToUse.reduce((acc: number, sec: any) => acc + (sec.questions ? sec.questions.filter((q: any) => q.isActive !== false).length : 0), 0);`
);
code = code.replace(
  "for (const section of BUSINESS_QUESTIONNAIRE_SECTIONS) {",
  `for (const section of sectionsToUse) {`
);
code = code.replace(
  "if (ans && ans.responseValue && ans.responseValue.trim().length > 0) {",
  `if (q.isActive !== false && ans && ans.responseValue && ans.responseValue.trim().length > 0) {`
);

fs.writeFileSync('src/services/questionnaireService.ts', code);
console.log('patched calculateQuestionnaireProgress');
