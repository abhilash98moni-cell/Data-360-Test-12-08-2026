const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf-8');

// 1. isDistributor
if (!code.includes('const isDistributor = currentUser?.role')) {
    code = code.replace(
        'onFindingCreated\n}) => {',
        "onFindingCreated\n}) => {\n  const isDistributor = currentUser?.role === 'Distributor';"
    );
}

// 2. formatCurrency (already defined above the component)

// 3. Update sheet_to_json to use raw: false
code = code.replace(
    /const jsonData = XLSX\.utils\.sheet_to_json\(worksheet, \{ defval: "" \}\);/g,
    'const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });'
);

// 4. Update the Table Headers for GL
code = code.replace(
    /<th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-\[10px\] text-right">Credit<\/th>\s*<th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-\[10px\] bg-slate-900">Testing Classification<\/th>/,
    '<th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Credit</th>\n            {!isDistributor && <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900">Testing Classification</th>}'
);

// 5. Update Table Body for GL
code = code.replace(
    /<td className="py-2 px-4 border-b border-slate-800\/50 bg-slate-900">\s*<select[\s\S]*?<\/select>\s*<\/td>/,
    `{!isDistributor && (
                  <td className="py-2 px-4 border-b border-slate-800/50 bg-slate-900">
                    <select 
                      value={sampleInfo ? sampleInfo.classification : ''}
                      onChange={(e) => handleClassify(rec, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Assign Test --</option>
                      <option value="Sales Testing">Sales Testing</option>
                      <option value="Employee Disbursement & Reimbursement">Employee Disbursement</option>
                      <option value="3rd Party Disbursement">3rd Party Disbursement</option>
                    </select>
                  </td>
                )}`
);

// 6. Hide sub-tabs for distributor (Testing Attributes)
code = code.replace(
    /<button \s*onClick={\(\) => setActiveSubTab\('Attributes'\)}[\s\S]*?<\/button>/,
    `{!isDistributor && (
             <button 
               onClick={() => setActiveSubTab('Attributes')}
               className={\`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${activeSubTab === 'Attributes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}\`}
             >
               <FileText className="w-4 h-4" /> Testing Attributes
             </button>
          )}`
);

// 7. Hide rendering the Attributes tab
code = code.replace(
    "{activeSubTab === 'Attributes' && renderAttributesTab()}",
    "{activeSubTab === 'Attributes' && !isDistributor && renderAttributesTab()}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
console.log('SamplingView patched successfully');
