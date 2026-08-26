const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Undo the wrong replacement
code = code.replace(/<tbody className="divide-y divide-slate-800">\n            \{populationTransactions\.length === 0 \? \(\n              <tr>\n                <td colSpan=\{6\} className="py-12 text-center text-slate-400">\n                   No transaction records found in this population\.\n                <\/td>\n              <\/tr>\n            \) : null\}/, `<tbody className="divide-y divide-slate-800">`);

// Apply it to the right place
code = code.replace(/<tbody className="divide-y divide-slate-800">\n            \{populationTransactions\.map\(tx => \(/, `<tbody className="divide-y divide-slate-800">
            {populationTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                   No transaction records found in this population.
                </td>
              </tr>
            ) : null}
            {populationTransactions.map(tx => (`);

fs.writeFileSync('src/components/SamplingView.tsx', code);
