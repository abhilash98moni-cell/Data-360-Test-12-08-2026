import fs from 'fs';

let code = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf8');

// Update imports
code = code.replace(
  "saveQuestionnaireAuditorNotes\n} from '../../services/questionnaireApiClient';",
  `saveQuestionnaireAuditorNotes,
  requestEditAccessQuestionnaire,
  reviewEditAccessQuestionnaire,
  customizeQuestionnaire
} from '../../services/questionnaireApiClient';`
);

fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', code);
console.log('patched imports');
