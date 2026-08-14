import fs from 'fs';
let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

// There are multiple activeSection references.
// Let's make sure it's defined inside the component properly.
// Check if it's missing or if it was removed in our previous fix.
code = code.replace(
  "  const handleRequestEditAccess = async () => {",
  "  const activeSection = activeSections[activeSectionIdx] || activeSections[0];\n\n  const handleRequestEditAccess = async () => {"
);

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('fixed activeSection');
