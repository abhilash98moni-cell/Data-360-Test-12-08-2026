const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const oldHeader = `      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-white">Sampling</h2>
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-emerald-400">{selectedDistributor}</span> | FY 2025–26
        </p>
      </div>`;

const newHeader = `      <div className="flex flex-col gap-1 mb-4 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Sampling</h2>
        <p className="text-sm text-slate-400"><strong className="text-slate-300">Distributor:</strong> <span className="font-semibold text-emerald-400">{selectedDistributor}</span></p>
        <p className="text-sm text-slate-400"><strong className="text-slate-300">Audit Period:</strong> FY 2025–26</p>
        <p className="text-sm text-slate-400"><strong className="text-slate-300">Engagement:</strong> ENG-2025-001</p>
      </div>`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/SamplingView.tsx', code);
