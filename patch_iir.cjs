const fs = require('fs');
let content = fs.readFileSync('src/components/InitialInformationRequestView.tsx', 'utf-8');
content = content.replace(/`\/api\/storage\/preview\/\$\{encodeURIComponent\(selectedFileForPreview\.id \|\| selectedFileForPreview\.evidenceId\)\}`/g, "`/api/storage/preview/${encodeURIComponent(selectedFileForPreview.id || selectedFileForPreview.evidenceId)}?fileName=${encodeURIComponent(selectedFileForPreview.fileName || selectedFileForPreview.name || 'document.pdf')}`");
fs.writeFileSync('src/components/InitialInformationRequestView.tsx', content);
