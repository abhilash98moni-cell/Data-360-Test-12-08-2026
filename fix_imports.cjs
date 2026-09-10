const fs = require('fs');

let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');

// Add Database to lucide-react imports
if (!code.includes('Database,')) {
    code = code.replace(
        '  FolderArchive,',
        '  FolderArchive,\n  Database,'
    );
}

// Add SamplingView import
if (!code.includes('import SamplingView')) {
    code = code.replace(
        "import { EvidenceRecord, UserSession } from '../types';",
        "import { EvidenceRecord, UserSession } from '../types';\nimport SamplingView from './SamplingView';"
    );
}

fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
