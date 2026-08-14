import fs from 'fs';
let code = fs.readFileSync('src/services/questionnaireService.ts', 'utf8');

code = code.replace(
  "  const progress = calculateQuestionnaireProgress(newState.answers);",
  "  const progress = calculateQuestionnaireProgress(newState.answers, currentState.customSections);"
);

fs.writeFileSync('src/services/questionnaireService.ts', code);
console.log('patched save answers');
