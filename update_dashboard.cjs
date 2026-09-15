const fs = require('fs');
let code = fs.readFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', 'utf-8');

// 1. Remove the <select> block
code = code.replace(/<div className="relative">\s*<select[\s\S]*?<\/select>\s*<ChevronRight[\s\S]*?<\/div>/, '');

// 2. Remove the {!selectedEngId ? ( ... ) : ( ... )} logic
// We need to carefully replace the exact parts.
// First, find `{!selectedEngId ? (` and replace with `<div>`
code = code.replace('{!selectedEngId ? (', '<div>');

// Find `) : (` which is the else branch for selectedEngId
// I'll replace `) : (` with `</div>\n\n      {selectedEngId && (`
code = code.replace(/\) : \(\s*\/\* DETAILED DISTRIBUTOR VIEW \*\//, '</div>\n\n      {selectedEngId && (\n        /* DETAILED DISTRIBUTOR VIEW */');

// Then I need to add an effect to auto-select the first engagement if null
const autoSelectEffect = `
  useEffect(() => {
    if (engagements.length > 0 && !selectedEngId) {
      setSelectedEngId(engagements[0].id);
    }
  }, [engagements, selectedEngId]);
`;
// Insert it after `const [selectedStage, setSelectedStage] = useState<any | null>(null);`
code = code.replace('const [selectedStage, setSelectedStage] = useState<any | null>(null);', 'const [selectedStage, setSelectedStage] = useState<any | null>(null);\n' + autoSelectEffect);

fs.writeFileSync('src/components/ExecutiveAuditTimelineDashboard.tsx', code);
