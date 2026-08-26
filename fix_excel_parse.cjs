const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const regex = /const parsedTxs = jsonData\.map\(\(row: any, index: number\) => \{[\s\S]*?\}\)\.filter\(Boolean\);/;

const replacement = `const parsedTxs = jsonData.map((row: any, index: number) => {
           const keys = Object.keys(row);
           if (keys.length === 0) return null;

           const findVal = (matchKeys: string[]) => {
               const key = keys.find(k => matchKeys.some(match => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(match.toLowerCase().replace(/[^a-z0-9]/g, ''))));
               return key && row[key] !== "" ? row[key] : '—';
           };
           
           let idVal = findVal(['transactionid', 'invoicenumber', 'invoiceno', 'documentid', 'refno', 'reference', 'id', 'slno', 'serialno']);
           let dateVal = findVal(['date', 'transactiondate', 'invoicedate', 'postingdate', 'time']);
           let entityVal = findVal(['vendor', 'customer', 'employee', 'party', 'entity', 'name', 'client', 'payee']);
           let descVal = findVal(['description', 'particulars', 'memo', 'notes', 'purpose', 'details', 'item', 'product']);
           let amountVal = findVal(['amount', 'total', 'value', 'netamount', 'price', 'cost']);

           // Fallback to exact column index mapping if no headers match at all
           // This prevents empty placeholder rows. We just display the actual data.
           if (idVal === '—' && keys[0]) idVal = row[keys[0]];
           if (dateVal === '—' && keys[1]) dateVal = row[keys[1]];
           if (entityVal === '—' && keys[2]) entityVal = row[keys[2]];
           if (descVal === '—' && keys[3]) descVal = row[keys[3]];
           if (amountVal === '—' && keys[4]) amountVal = row[keys[4]];

           if (amountVal === '—' || amountVal === '' || amountVal === null || amountVal === undefined) amountVal = null;
           
           let finalAmount = null;
           if (amountVal !== null && amountVal !== undefined) {
               if (typeof amountVal === 'string') {
                   finalAmount = parseFloat(amountVal.replace(/[^0-9.-]+/g, ""));
                   if (isNaN(finalAmount)) finalAmount = null;
               } else {
                   finalAmount = Number(amountVal);
                   if (isNaN(finalAmount)) finalAmount = null;
               }
           }
           
           // If the row is totally empty after mapping, skip it
           if (idVal === '—' && dateVal === '—' && entityVal === '—' && descVal === '—' && finalAmount === null) return null;
           
           let rawId = idVal !== '—' && idVal !== '' && idVal !== undefined ? String(idVal) : \`TXN-\${index + 1}\`;
           let uniqueId = rawId;
           let suffix = 1;
           while(idSet.has(uniqueId)) {
             uniqueId = \`\${rawId}-\${suffix}\`;
             suffix++;
           }
           idSet.add(uniqueId);
           
           return {
             id: uniqueId,
             date: dateVal !== '—' && dateVal !== undefined ? String(dateVal) : '—',
             entity: entityVal !== '—' && entityVal !== undefined ? String(entityVal) : '—',
             desc: descVal !== '—' && descVal !== undefined ? String(descVal) : '—',
             amount: finalAmount,
             originalRow: row
           };
        }).filter(Boolean);`;

if(code.match(regex)) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('src/components/SamplingView.tsx', code);
   console.log("Replaced successfully!");
} else {
   console.log("Regex didn't match.");
}
