import fs from 'fs';
let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

code = code.replace(/session\?/g, "currentUser");

// Ensure the props interface matches what we use
code = code.replace(
  "export const BusinessQuestionnaireView: React.FC<BusinessQuestionnaireViewProps & { session?: any }> = ({",
  "export const BusinessQuestionnaireView: React.FC<BusinessQuestionnaireViewProps> = ({"
);

// We need to also remove the extra isAuditor and session props if they were added improperly
code = code.replace(
  "  isAuditor,\\n  session",
  ""
);

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('fixed currentUser');
