const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const replacement = `
      if (!jsonData || jsonData.length === 0) {
        setPopulationTransactions([]);
      } else {
        const idSet = new Set();
        const parsedTxs = jsonData.map((row: any, index: number) => {
           // Basic heuristic mapping for common column names
           const findVal = (keys: string[]) => {
               const key = Object.keys(row).find(k => keys.some(match => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(match.toLowerCase().replace(/[^a-z0-9]/g, ''))));
               return key ? row[key] : '—';
           };
           
           const idVal = findVal(['transactionid', 'invoicenumber', 'invoiceno', 'documentid', 'refno', 'reference', 'id']);
           const dateVal = findVal(['date', 'transactiondate', 'invoicedate', 'postingdate']);
           const entityVal = findVal(['vendor', 'customer', 'employee', 'party', 'entity', 'name']);
           const descVal = findVal(['description', 'particulars', 'memo', 'notes', 'purpose']);
           
           let amountVal = findVal(['amount', 'total', 'value', 'netamount']);
           if (amountVal === '—') amountVal = null;
           
           let finalAmount = 0;
           if (amountVal !== null && amountVal !== undefined) {
               if (typeof amountVal === 'string') {
                   // parse string, remove currency symbols
                   finalAmount = parseFloat(amountVal.replace(/[^0-9.-]+/g, "")) || 0;
               } else {
                   finalAmount = Number(amountVal) || 0;
               }
           }
           
           let rawId = idVal !== '—' ? String(idVal) : \`TX-\${index + 1}\`;
           let uniqueId = rawId;
           let suffix = 1;
           while(idSet.has(uniqueId)) {
             uniqueId = \`\${rawId}-\${suffix}\`;
             suffix++;
           }
           idSet.add(uniqueId);
           
           return {
             id: uniqueId,
             date: dateVal !== '—' ? String(dateVal) : '—',
             entity: entityVal !== '—' ? String(entityVal) : '—',
             desc: descVal !== '—' ? String(descVal) : '—',
             amount: amountVal === null ? null : finalAmount,
             originalRow: row
           };
        });
        setPopulationTransactions(parsedTxs);
`;

const regex = /if \(!jsonData \|\| jsonData\.length === 0\) \{[\s\S]*?setPopulationTransactions\(parsedTxs\);/;
code = code.replace(regex, replacement.trim());

fs.writeFileSync('src/components/SamplingView.tsx', code);
