const fs = require('fs');
let content = fs.readFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', 'utf-8');
content = content.replace(/href=\{`\/api\/storage\/download\/\$\{att\.googleDriveFileId \|\| att\.id\}`\}/g, "href={`/api/storage/download/${att.googleDriveFileId || att.id}?fileName=${encodeURIComponent(att.name || 'document.pdf')}`}");
fs.writeFileSync('src/components/questionnaire/BusinessQuestionnaireView.tsx', content);
