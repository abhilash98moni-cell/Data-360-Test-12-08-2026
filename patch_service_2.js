import fs from 'fs';
let code = fs.readFileSync('src/services/questionnaireService.ts', 'utf8');

// Update getAuthoritativeQuestionnaireState baseline init
code = code.replace(
  "      isLocked: false,",
  `      isLocked: false,
      editAccessStatus: 'LOCKED',`
);

fs.writeFileSync('src/services/questionnaireService.ts', code);
console.log('patched init');
