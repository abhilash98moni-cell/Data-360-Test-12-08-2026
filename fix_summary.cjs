const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const regex = /\{exceptionTxs\.length > 0 && \([\s\S]*?\}\)/;

const newTable = `
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
             <div className="bg-slate-950/30 px-6 py-4 border-b border-slate-800">
               <h3 className="text-lg font-bold text-white">Tested Transactions</h3>
             </div>
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-950/50 border-b border-slate-800">
                   <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
                   <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase">Testing Result</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800">
                 {testingTransactions.map((tx, idx) => (
                   <tr key={tx.id || \`sum-\${idx}\`} className="hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => handleReviewClick(tx)}>
                     <td className="py-3 px-6 text-sm font-medium text-indigo-400 underline">{tx.id}</td>
                     <td className="py-3 px-6 text-sm font-medium text-slate-400 text-right">{tx.amount === null ? '—' : formatCurrency(tx.amount, currencyMode)}</td>
                     <td className={\`py-3 px-6 text-sm font-bold \${tx.outcome === 'Passed' ? 'text-emerald-500' : tx.outcome === 'Exception' ? 'text-rose-500' : 'text-amber-500'}\`}>{tx.outcome || 'Pending'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
`;

code = code.replace(regex, newTable);
fs.writeFileSync('src/components/SamplingView.tsx', code);
