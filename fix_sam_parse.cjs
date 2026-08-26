const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const regex = /let amountVal = findVal\(\['amount', 'total', 'value', 'netamount'\]\);\s*if \(amountVal === '—'\) amountVal = null;/;
const replacement = `let amountVal = findVal(['amount', 'total', 'value', 'netamount']);
           if (amountVal === '—' || amountVal === '' || amountVal === null || amountVal === undefined) amountVal = null;`;
code = code.replace(regex, replacement);

const regex2 = /let rawId = idVal !== '—' \? String\(idVal\) : `\[Row \$\{index \+ 2\}\]`;/;
const replacement2 = `let rawId = idVal !== '—' && idVal !== '' ? String(idVal) : \`[Row \${index + 2}]\`;`;
code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/SamplingView.tsx', code);
