const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// The replacement I ran earlier might not have caught the one in renderSelectSample if I ran it before creating renderSelectSample
// Wait, I ran patch_amount2.cjs which globally replaced formatCurrency... but wait, I generated new views after patch_amount2.cjs.
// So let's run patch_amount2.cjs logic again just to be safe.
code = code.replace(/<td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">\{tx.amount === null \? '—' : formatCurrency\(tx.amount, currencyMode\)\}<\/td>/g, '___TEMP___');
code = code.replace(/<td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">\{formatCurrency\(tx.amount, currencyMode\)\}<\/td>/g, '<td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{tx.amount === null ? \'—\' : formatCurrency(tx.amount, currencyMode)}</td>');
code = code.replace(/___TEMP___/g, '<td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{tx.amount === null ? \'—\' : formatCurrency(tx.amount, currencyMode)}</td>');

fs.writeFileSync('src/components/SamplingView.tsx', code);
