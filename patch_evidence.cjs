const fs = require('fs');
let code = fs.readFileSync('src/components/EvidenceManagementView.tsx', 'utf-8');

// 1. Add SamplingView import
if (!code.includes("import { SamplingView }")) {
    code = code.replace(
        "import { Database, FolderArchive,",
        "import { SamplingView } from './SamplingView';\nimport { Database, FolderArchive,"
    );
}

// 2. Change evidenceMode state definition
code = code.replace(
    /const \[evidenceMode, setEvidenceMode\] = useState\<'All Evidence' \| 'Sampling Eligible'\>\(defaultMode\);/,
    "const [evidenceMode, setEvidenceMode] = useState<'All Evidence' | 'Sampling'>(defaultMode === 'Sampling Eligible' ? 'Sampling' : (defaultMode as 'All Evidence' | 'Sampling'));"
);

// 3. Update the Evidence Mode Tabs JSX
code = code.replace(
    /\{\/\* Evidence Mode Tabs \*\/\}\s*<div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 max-w-\[600px\] mx-auto sm:mx-0">\s*<\/div>/,
    `{/* Evidence Mode Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 max-w-[600px] mx-auto sm:mx-0">
          <button
            onClick={() => setEvidenceMode('All Evidence')}
            className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${evidenceMode === 'All Evidence' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}\`}
          >
            <FolderArchive className="w-4 h-4" /> All Evidence
          </button>
          <button
            onClick={() => setEvidenceMode('Sampling')}
            className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 \${evidenceMode === 'Sampling' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}\`}
          >
            <Database className="w-4 h-4" /> Sampling
          </button>
        </div>`
);

// 4. In EvidenceManagementView, wrap the Evidence table and metrics inside a conditional for 'All Evidence'
// and render SamplingView when 'Sampling'.
// I'll look for `<div className="grid grid-cols-2 md:grid-cols-5 gap-3">` which is Metrics
code = code.replace(
    /\{\/\* Metrics & Analytics Dashboard Bar \*\/\}/,
    `{evidenceMode === 'Sampling' ? (
        <SamplingView
          currentUser={currentUser}
          selectedClient={selectedClient}
          selectedDistributor={selectedDistributor}
          selectedAuditFilter={selectedAuditFilter}
        />
      ) : (
      <>
      {/* Metrics & Analytics Dashboard Bar */}`
);

code = code.replace(
    /(\s*)<\/div>\s*<\/div>\s*<\/div>\s*\);\s*};\s*$/,
    `$1    </>\n      )}
      </div>
    </div>
  </div>
  );
};`
);

fs.writeFileSync('src/components/EvidenceManagementView.tsx', code);
console.log('EvidenceManagementView patched successfully');
