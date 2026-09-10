const fs = require('fs');
let code = fs.readFileSync('src/components/RequiredDataQuestionnaire.tsx', 'utf-8');

// I need to reconstruct the question render block.
// To do this reliably, I'll extract the full mapping part and replace it.

let newCode = code;

// First, change the "Testing Classification" display in Header to not show it.
newCode = newCode.replace(
    /<div className="flex flex-col">\s*<span className="text-slate-500 font-bold uppercase tracking-wider text-\[10px\]">Testing Classification<\/span>\s*<span className="text-indigo-300 font-semibold">\{classification\}<\/span>\s*<\/div>/,
    ""
);

fs.writeFileSync('src/components/RequiredDataQuestionnaire.tsx', newCode);
