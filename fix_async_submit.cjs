const fs = require('fs');
let content = fs.readFileSync('src/components/NewAuditModal.tsx', 'utf8');
content = content.replace('const handleSubmit = (e: React.FormEvent) => {', 'const handleSubmit = async (e: React.FormEvent) => {');
fs.writeFileSync('src/components/NewAuditModal.tsx', content);
