const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Add debug state
if (!code.includes('const [debugInfo, setDebugInfo]')) {
   code = code.replace("const [testingTransactions, setTestingTransactions] = useState<any[]>([]);", 
                       "const [testingTransactions, setTestingTransactions] = useState<any[]>([]);\n  const [debugInfo, setDebugInfo] = useState<any>(null);");
}

const handleSelectPop = `  const handleSelectPopulation = async (pop: any) => {
    setSelectedPopulation(pop);
    setLoading(true);
    setDebugInfo(null);
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
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // Make sure empty cells are at least empty strings
      
      console.log("RAW POPULATION DATA (first 5 rows):", jsonData.slice(0, 5));
      
      setDebugInfo({
         populationId: pop.id,
         fileId: fileIdToFetch,
         distributorId: selectedDistributor,
         fileName: pop.fileName,
         recordsRetrieved: jsonData.length,
         status: 'Success'
      });

      if (!jsonData || jsonData.length === 0) {
        setPopulationTransactions([]);
      } else {
        const idSet = new Set();
        const parsedTxs = jsonData.map((row: any, index: number) => {
           // Basic heuristic mapping for common column names
           const keys = Object.keys(row);
           
           // If the row is totally empty, we skip it or mark it
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
           if (amountVal === '—' || amountVal === '' || amountVal === null || amountVal === undefined) amountVal = null;
           
           // Fallbacks if mapping completely fails but we have data
           if (idVal === '—') {
             // Just take the first column as ID if available
             idVal = row[keys[0]] !== "" ? row[keys[0]] : '—';
           }
           if (descVal === '—' && keys.length > 0) {
             // Dump JSON to description so it's not totally empty
             descVal = JSON.stringify(row).substring(0, 100);
           }

           let finalAmount = 0;
           if (amountVal !== null && amountVal !== undefined) {
               if (typeof amountVal === 'string') {
                   finalAmount = parseFloat(amountVal.replace(/[^0-9.-]+/g, "")) || 0;
               } else {
                   finalAmount = Number(amountVal) || 0;
               }
           }
           
           // We do NOT use [Row X] as fallback anymore to avoid fake placeholders.
           // If it's truly empty, we skip.
           if (idVal === '—' && dateVal === '—' && entityVal === '—' && amountVal === null) return null;
           
           let rawId = idVal !== '—' && idVal !== '' ? String(idVal) : \`UNKNOWN-\${index}\`;
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
        }).filter(Boolean); // Remove nulls
        
        setPopulationTransactions(parsedTxs);
      }
    } catch (err: any) {
      console.error("Error loading population transactions:", err);
      setDebugInfo({
         populationId: pop.id,
         fileId: pop.googleDriveFileId || pop.id,
         distributorId: selectedDistributor,
         fileName: pop.fileName,
         recordsRetrieved: 0,
         status: 'Error: ' + err.message
      });
      setPopulationTransactions([]);
    } finally {
      setLoading(false);
      setSelectedRowIds(new Set());
      setView('select_sample');
    }
  };`;

// replace old handleSelectPopulation
const oldHandleSelectPopRegex = /const handleSelectPopulation = async \([\s\S]*?const toggleRowSelection = /;
code = code.replace(oldHandleSelectPopRegex, handleSelectPop + "\n\n  const toggleRowSelection = ");

// Inject debug UI into renderSelectSample
const debugUI = `      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <button onClick={() => setView('dashboard')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Populations
          </button>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Select Sample Transactions</h2>
          <p className="text-sm text-slate-400 mt-1">{selectedPopulation?.fileName}</p>
        </div>
        <div>
          <button 
            onClick={() => handleAddSelectedToTesting()}
            disabled={selectedRowIds.size === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add Selected to Testing ({selectedRowIds.size})
          </button>
        </div>
      </div>
      
      {debugInfo && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 text-xs text-slate-300 font-mono">
          <h4 className="text-indigo-400 font-bold mb-2 uppercase">Data Source Debug</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-slate-500">Population ID:</span> {debugInfo.populationId}</div>
            <div><span className="text-slate-500">Evidence/File ID:</span> {debugInfo.fileId}</div>
            <div><span className="text-slate-500">Distributor ID:</span> {debugInfo.distributorId}</div>
            <div><span className="text-slate-500">File Name:</span> {debugInfo.fileName}</div>
            <div><span className="text-slate-500">Records Retrieved:</span> <span className="text-emerald-400 font-bold">{debugInfo.recordsRetrieved}</span></div>
            <div><span className="text-slate-500">Processing Status:</span> {debugInfo.status}</div>
          </div>
        </div>
      )}
`;

const oldHeaderRegex = /<div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">[\s\S]*?<\/div>\n      <\/div>/;

code = code.replace(oldHeaderRegex, debugUI);

// Handle empty state gracefully
const tableRegex = /<tbody className="divide-y divide-slate-800">[\s\S]*?<\/tbody>/;
const newTableBody = `<tbody className="divide-y divide-slate-800">
            {populationTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  {debugInfo?.status.startsWith('Error') 
                    ? "Unable to load transaction records from this file." 
                    : "No transaction records found in this population."}
                </td>
              </tr>
            ) : (
              populationTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox"
                      checked={selectedRowIds.has(tx.id)}
                      onChange={() => toggleRowSelection(tx.id)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-950"
                    />
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-200">{tx.id}</td>
                  <td className="py-3 px-4 text-sm text-slate-400">{tx.date}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">{tx.entity}</td>
                  <td className="py-3 px-4 text-sm text-slate-400">{tx.desc}</td>
                  <td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{tx.amount === null ? '—' : formatCurrency(tx.amount, currencyMode)}</td>
                </tr>
              ))
            )}
          </tbody>`;
code = code.replace(tableRegex, newTableBody);

fs.writeFileSync('src/components/SamplingView.tsx', code);
