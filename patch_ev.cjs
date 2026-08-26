const fs = require('fs');
let content = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');
content = content.replace(/href=\{`\/api\/storage\/preview\/\$\{selectedRecord\.googleDriveFileId \|\| selectedRecord\.id\}`\}/g, "href={`/api/storage/preview/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`}");
content = content.replace(/src=\{`\/api\/storage\/preview\/\$\{selectedRecord\.googleDriveFileId \|\| selectedRecord\.id\}`\}/g, "src={`/api/storage/preview/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`}");
content = content.replace(/href=\{`\/api\/storage\/download\/\$\{selectedRecord\.googleDriveFileId \|\| selectedRecord\.id\}`\}/g, "href={`/api/storage/download/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`}");
fs.writeFileSync('src/components/EvidenceManagementView.tsx', content);
