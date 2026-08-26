const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Fix 1: Filter out templates
const filterMatch = "const isAcceptableStatus = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\\s+/g, '_'));";
const filterReplace = "const isAcceptableStatus = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\\s+/g, '_'));\n            const isTemplate = (r.fileName || '').toLowerCase().includes('template') || (r.fileName || '').toLowerCase().includes('questionnaire');\n            if (isTemplate) return false;";
code = code.replace(filterMatch, filterReplace);

// Fix 2: Do not generate TX-1
code = code.replace(/let rawId = idVal !== '—' \? String\(idVal\) : `TX-\$\{index \+ 1\}`;/g, "let rawId = idVal !== '—' ? String(idVal) : `[Row ${index + 2}]`;");

fs.writeFileSync('src/components/SamplingView.tsx', code);
