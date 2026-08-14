import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

// Replace session with userOrg/userRole or standard session mapping
code = code.replace(/session\.email/g, "(session?.email || 'user@example.com')");
code = code.replace(/session\.name/g, "(session?.name || 'User')");

// Also, the session object might need to be passed down or retrieved. We have userRole as a prop, but maybe session is not available.
// Let's check props.
code = code.replace(
  "export const BusinessQuestionnaireView: React.FC<BusinessQuestionnaireViewProps> = ({",
  "export const BusinessQuestionnaireView: React.FC<BusinessQuestionnaireViewProps & { session?: any }> = ({"
);
code = code.replace(
  "  isAuditor",
  "  isAuditor,\n  session"
);

// Fixing 'activeSections' declaration order.
// Let's remove the first one if it's there.
code = code.replace(
  "  const activeSection = activeSections[activeSectionIdx] || activeSections[0];",
  "  // Moved below"
);

const regex = /const activeSections = useMemo.*?\], \[questionnaireState\]\);/s;
const match = code.match(regex);
if (match) {
   code = code.replace(match[0], match[0] + "\n  const activeSection = activeSections[activeSectionIdx] || activeSections[0];");
}


fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('fixed session and activeSections order');
