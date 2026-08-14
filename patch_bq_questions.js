import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

code = code.replace(
  "                const answer = localAnswers[q.id];",
  `                if (q.isActive === false && !isAuditor) return null;
                const answer = localAnswers[q.id];`
);

code = code.replace(
  "                const isLocked = questionnaireState?.isLocked && isDistributor;",
  "                const isLocked = questionnaireState?.isLocked && isDistributor && questionnaireState?.editAccessStatus !== 'APPROVED';"
);

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('patched questions loop');
