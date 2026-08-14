import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "  saveAuthoritativeQuestionnaireAuditorNotes\n} from './src/services/questionnaireService.js';",
  `  saveAuthoritativeQuestionnaireAuditorNotes,
  requestAuthoritativeQuestionnaireEditAccess,
  reviewAuthoritativeQuestionnaireEditAccess,
  customizeAuthoritativeQuestionnaire
} from './src/services/questionnaireService.js';`
);

const newRoutes = `
  // Request Edit Access
  app.post('/api/questionnaire/edit-access-request', async (req, res) => {
    try {
      const { client, distributor, auditId, userEmail, userName } = req.body;
      const result = await requestAuthoritativeQuestionnaireEditAccess(client, distributor, auditId || 'eng-101', userEmail, userName);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Review Edit Access (Auditor)
  app.post('/api/questionnaire/edit-access-review', async (req, res) => {
    try {
      const { client, distributor, auditId, action, userEmail, userName } = req.body;
      const result = await reviewAuthoritativeQuestionnaireEditAccess(client, distributor, auditId || 'eng-101', action, userEmail, userName);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Customize Questionnaire (Auditor)
  app.post('/api/questionnaire/customize', async (req, res) => {
    try {
      const { client, distributor, auditId, customSections, userEmail, userName } = req.body;
      const result = await customizeAuthoritativeQuestionnaire(client, distributor, auditId || 'eng-101', customSections, userEmail, userName);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
`;

code = code.replace(
  "  // Save Auditor Notes & Risk Ratings",
  newRoutes + "\n  // Save Auditor Notes & Risk Ratings"
);

fs.writeFileSync('server.ts', code);
console.log('patched server.ts');
