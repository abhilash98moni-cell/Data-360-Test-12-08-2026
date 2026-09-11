const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/engagements={filteredEngagements\.length > 0 \? filteredEngagements : engagements}/g, 'engagements={filteredEngagements}');
content = content.replace(/findings={filteredFindings\.length > 0 \? filteredFindings : findings}/g, 'findings={filteredFindings}');

fs.writeFileSync('src/App.tsx', content);
