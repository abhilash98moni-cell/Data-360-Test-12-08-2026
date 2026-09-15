const fs = require('fs');
let code = fs.readFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', 'utf-8');

code = code.replace(
  /import \{ \n  Calendar, CheckCircle2, ChevronRight, Clock, Search, ListTodo, AlertCircle, \n  ArrowRight, Activity, GitCommit, FileText, CheckSquare, Presentation, ShieldAlert,\n  Users, UserCheck, Check, SearchIcon, FileSpreadsheet, Hourglass\n\} from 'lucide-react';/,
  `import { 
  Calendar, CheckCircle2, ChevronRight, Clock, Search, ListTodo, AlertCircle, 
  ArrowRight, Activity, GitCommit, FileText, CheckSquare, Presentation, ShieldAlert,
  Users, UserCheck, Check, SearchIcon, FileSpreadsheet, Hourglass, Plus
} from 'lucide-react';`
);

code = code.replace(
  /if \(search && !m\.eng\.distributorName \|\| eng\.clientName\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) && !m\.eng\.code\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\) \{/,
  `const distName = m.eng.distributorName || m.eng.clientName;
    if (search && !distName.toLowerCase().includes(search.toLowerCase()) && !m.eng.code.toLowerCase().includes(search.toLowerCase())) {`
);

code = code.replace(
  /await fetch\(\`\/api\/engagement-timeline\?auditId=\\?\$\{eng\.id\}\&distributorName=\\?\$\{encodeURIComponent\(eng\.distributorName \|\| eng\.clientName\)\}\&auditStartDate=\\?\$\{eng\.startDate\}\`/,
  `await fetch(\`/api/engagement-timeline?auditId=\${eng.id}&distributorName=\${encodeURIComponent(eng.distributorName || eng.clientName)}&auditStartDate=\${eng.startDate}\``
);

code = code.replace(
  /const distName = m\.eng\.distributorName \|\| m\.eng\.clientName;/,
  `const distName = m.eng.distributorName || m.eng.clientName;`
);

fs.writeFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', code);
console.log('Dashboard fixed successfully');
