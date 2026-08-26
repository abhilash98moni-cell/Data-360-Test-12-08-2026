const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

const stateAnchor = "const [validationError, setValidationError] = useState('');";
code = code.replace(stateAnchor, stateAnchor + "\n  const [populationError, setPopulationError] = useState('');");

const handleSelectAnchor = /const handleSelectPopulation = async \(pop: any\) => \{[\s\S]*?setView\('overview'\);\n  \};/;
const handleSelectReplacement = `const handleSelectPopulation = async (pop: any) => {
    setSelectedPopulation(pop);
    setLoading(true);
    setPopulationError('');
    try {
      if (!pop.googleDriveFileId && !pop.id) {
        throw new Error("No file ID found for this population.");
      }
      const fileIdToFetch = pop.googleDriveFileId || pop.id;
      
      const res = await fetch(\`/api/storage/download/\${fileIdToFetch}\`);
      if (!res.ok) throw new Error(\`Failed to download file \${pop.fileName}\`);
      
      const buffer = await res.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      let targetSheetName = workbook.SheetNames[0];
      const sheetMatch = workbook.SheetNames.find(n => n.toLowerCase().includes('data') || n.toLowerCase().includes('transaction') || n.toLowerCase().includes('sales') || n.toLowerCase().includes('register') || n.toLowerCase().includes('sheet1'));
      if (sheetMatch) targetSheetName = sheetMatch;
      
      const worksheet = workbook.Sheets[targetSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      let headerRowIndex = 0;
      let maxScore = -1;
      
      const keywords = ['id', 'no', 'number', 'date', 'amount', 'total', 'customer', 'vendor', 'employee', 'description', 'particulars'];
      
      rawData.forEach((row, idx) => {
         if (!row || !Array.isArray(row)) return;
         let score = 0;
         row.forEach(cell => {
             if (typeof cell === 'string') {
                 const lc = cell.toLowerCase().trim();
                 if (keywords.some(k => lc.includes(k))) score++;
             }
         });
         if (score > maxScore && score > 0) {
             maxScore = score;
             headerRowIndex = idx;
         }
      });
      
      const headers = rawData[headerRowIndex] || [];
      const jsonData = [];
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const rowArr = rawData[i];
          if (!rowArr || rowArr.length === 0) continue;
          if (rowArr.every(c => c === null || c === undefined || c === '')) continue;
          
          const rowObj = {};
          headers.forEach((h, colIdx) => {
              if (h && typeof h === 'string') {
                  rowObj[h] = rowArr[colIdx];
              } else {
                  rowObj[\`Column\${colIdx}\`] = rowArr[colIdx];
              }
          });
          jsonData.push(rowObj);
      }
      
      if (!jsonData || jsonData.length === 0) {
        setPopulationTransactions([]);
      } else {
        const parsedTxs = jsonData.map((row, index) => {
           const findVal = (keys) => {
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
                   finalAmount = parseFloat(amountVal.replace(/[^0-9.-]+/g, "")) || 0;
               } else {
                   finalAmount = Number(amountVal) || 0;
               }
           }
           
           return {
             id: idVal !== '—' ? String(idVal) : \`—\`,
             date: dateVal !== '—' ? String(dateVal) : '—',
             entity: entityVal !== '—' ? String(entityVal) : '—',
             desc: descVal !== '—' ? String(descVal) : '—',
             amount: amountVal === null ? null : finalAmount,
             originalRow: row
           };
        });
        setPopulationTransactions(parsedTxs);
      }
    } catch (err) {
      console.error("Error loading population transactions:", err);
      setPopulationError(err.message || "Failed to parse file.");
      setPopulationTransactions([]);
    } finally {
      setLoading(false);
      setSelectedRowIds(new Set());
      setView('overview');
    }
  };`;
  
code = code.replace(handleSelectAnchor, handleSelectReplacement);

fs.writeFileSync('src/components/SamplingView.tsx', code);
