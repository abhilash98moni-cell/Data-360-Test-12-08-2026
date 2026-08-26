const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

code = code.replace("id: uniqueId,", "id: uniqueId, displayId: idVal !== '—' && idVal !== undefined ? String(idVal) : '—',");
code = code.replace(/<td className="py-3 px-4 font-medium text-slate-200">\\s*\{tx\.id\}\\s*<\/td>/, '<td className="py-3 px-4 font-medium text-slate-200">{tx.displayId || tx.id}</td>');

// There are multiple table renders.
code = code.replace(/{tx\.id}/g, '{tx.displayId || tx.id}');
// Revert the ones that shouldn't be changed (like keys or sets)
code = code.replace(/key=\{tx\.displayId \|\| tx\.id\}/g, 'key={tx.id}');
code = code.replace(/addedTxIds\.has\(tx\.displayId \|\| tx\.id\)/g, 'addedTxIds.has(tx.id)');
code = code.replace(/selectedRowIds\.has\(tx\.displayId \|\| tx\.id\)/g, 'selectedRowIds.has(tx.id)');
code = code.replace(/toggleRowSelection\(tx\.displayId \|\| tx\.id\)/g, 'toggleRowSelection(tx.id)');
code = code.replace(/setTestingTransactions\(prev => prev\.filter\(t => t\.id !== \(tx\.displayId \|\| tx\.id\)\)\)/g, 'setTestingTransactions(prev => prev.filter(t => t.id !== tx.id))');

fs.writeFileSync('src/components/SamplingView.tsx', code);
