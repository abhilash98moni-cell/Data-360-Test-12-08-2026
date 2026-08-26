const fs = require('fs');
let code = fs.readFileSync('src/components/SamplingView.tsx', 'utf8');

// Rename renderPopulation to renderSelectSample
code = code.replace("const renderPopulation = () => (", "const renderSelectSample = () => (");
// We need to modify renderSelectSample to include the selection rationale textarea.
const selectHeaderMatch = "Population: {selectedPopulation?.fileName}\n          </h2>";
const rationaleArea = `
          {samplingMethod === 'Judgmental / Targeted' && (
            <div className="mt-4 max-w-2xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">Selection Rationale *</label>
              <textarea
                value={selectionRationale}
                onChange={e => setSelectionRationale(e.target.value)}
                placeholder="Explain why these transactions are being selected..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 min-h-[80px]"
              />
            </div>
          )}`;
code = code.replace(selectHeaderMatch, selectHeaderMatch + rationaleArea);

// Add the 3 new renders
const newRenders = `
  const renderOverview = () => {
    const totalRecords = populationTransactions.length;
    const totalValue = populationTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <button onClick={() => setView('dashboard')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Population Overview
          </h2>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setView('population_records')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
              View Population Records
           </button>
           <button onClick={() => setView('sampling_plan')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
              Create Sampling Plan
           </button>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 grid grid-cols-2 gap-8">
        <div className="space-y-4">
           <div>
              <label className="text-sm text-slate-400">Population File</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.fileName}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Distributor</label>
              <div className="font-medium text-slate-200">{selectedDistributor}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Population Type</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.type}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Source</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.source}</div>
           </div>
        </div>
        <div className="space-y-4">
           <div>
              <label className="text-sm text-slate-400">Audit Period</label>
              <div className="font-medium text-slate-200">{selectedPopulation?.period}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Total Records</label>
              <div className="font-medium text-slate-200">{totalRecords.toLocaleString()}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Total Population Value</label>
              <div className="font-medium text-slate-200">{formatCurrency(totalValue, currencyMode)}</div>
           </div>
           <div>
              <label className="text-sm text-slate-400">Status</label>
              <div className="font-medium text-emerald-400">Available for Sampling</div>
           </div>
        </div>
      </div>
    </div>
  )};

  const renderPopulationRecords = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <button onClick={() => setView('overview')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Population Records: {selectedPopulation?.fileName}
          </h2>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[600px] overflow-y-auto relative">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 z-10 bg-slate-950">
            <tr className="border-b border-slate-800">
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Vendor / Customer / Employee</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {populationTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                   No transaction records found in this population.
                </td>
              </tr>
            ) : null}
            {populationTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-slate-200">{tx.id}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.date}</td>
                <td className="py-3 px-4 text-sm text-slate-300">{tx.entity}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.desc}</td>
                <td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{tx.amount === null ? '—' : formatCurrency(tx.amount, currencyMode)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleGenerateSample = (method: string) => {
    let selectedTxs = [];
    if (method === 'Random') {
       if (randomSampleSize > populationTransactions.length) {
          alert('Sample size exceeds population size.');
          return;
       }
       // Random selection
       const shuffled = [...populationTransactions].sort(() => 0.5 - Math.random());
       selectedTxs = shuffled.slice(0, randomSampleSize);
    } else if (method === 'Systematic') {
       if (sysSampleSize > populationTransactions.length) {
          alert('Sample size exceeds population size.');
          return;
       }
       const interval = Math.floor(populationTransactions.length / sysSampleSize);
       let start = sysStart - 1;
       if (start < 0 || start >= interval) start = 0;
       
       for(let i = 0; i < sysSampleSize; i++) {
          const idx = start + i * interval;
          if (idx < populationTransactions.length) {
              selectedTxs.push(populationTransactions[idx]);
          }
       }
    } else if (method === 'Monetary / Value-Based') {
       const minAmt = parseFloat(monetaryMin) || 0;
       const topN = parseInt(monetaryTop, 10);
       
       let pool = [...populationTransactions];
       if (minAmt > 0) {
           pool = pool.filter(t => (t.amount || 0) >= minAmt);
       }
       if (topN > 0) {
           pool = pool.sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, topN);
       }
       selectedTxs = pool;
       if (selectedTxs.length === 0) {
          alert('No records matched the monetary criteria.');
          return;
       }
    }
    
    // Convert to testing transactions
    const newTxs = selectedTxs.map(tx => ({
        ...tx,
        reviewStatus: 'Pending',
        outcome: null
    }));
    setTestingTransactions(newTxs);
    
    // Also record in addedTxIds to prevent duplicates if they go back
    const updatedAddedIds = new Set(addedTxIds);
    newTxs.forEach(tx => updatedAddedIds.add(tx.id));
    setAddedTxIds(updatedAddedIds);
    
    setSamplingMethod(method as any);
    setView('testing_list');
  };

  const renderSamplingPlan = () => {
    const totalRecords = populationTransactions.length;
    const totalValue = populationTransactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <button onClick={() => setView('overview')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Sampling Plan
          </h2>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-medium text-slate-200 mb-4">Population Details</h3>
           <div className="space-y-4">
              <div>
                 <label className="text-xs text-slate-500 uppercase font-medium">Population File</label>
                 <div className="text-sm text-slate-300 mt-1">{selectedPopulation?.fileName}</div>
              </div>
              <div>
                 <label className="text-xs text-slate-500 uppercase font-medium">Population Size</label>
                 <div className="text-sm font-bold text-slate-200 mt-1">{totalRecords.toLocaleString()} transactions</div>
              </div>
              <div>
                 <label className="text-xs text-slate-500 uppercase font-medium">Population Value</label>
                 <div className="text-sm font-bold text-slate-200 mt-1">{formatCurrency(totalValue, currencyMode)}</div>
              </div>
           </div>
           
           <h3 className="text-lg font-medium text-slate-200 mb-4 mt-8">Sampling Method</h3>
           <div className="space-y-3">
             {['Judgmental / Targeted', 'Random', 'Systematic', 'Monetary / Value-Based'].map(method => (
               <label key={method} className={\`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors \${samplingMethod === method ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}\`}>
                  <input 
                     type="radio" 
                     name="samplingMethod" 
                     checked={samplingMethod === method}
                     onChange={() => setSamplingMethod(method as any)}
                     className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700" 
                  />
                  <span className="text-sm font-medium text-slate-200">{method}</span>
               </label>
             ))}
           </div>
        </div>
        
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-medium text-slate-200 mb-6">Methodology Configuration</h3>
           
           {samplingMethod === 'Judgmental / Targeted' && (
             <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-6">You will manually select targeted transactions from the full population view based on auditor judgment.</p>
                <button onClick={() => setView('select_sample')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                   Continue to Manual Selection
                </button>
             </div>
           )}
           
           {samplingMethod === 'Random' && (
             <div className="space-y-6 max-w-md">
                <p className="text-sm text-slate-400">The system will generate a statistically random sample from the actual population records.</p>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Sample Size</label>
                   <input 
                      type="number" 
                      value={randomSampleSize}
                      onChange={e => setRandomSampleSize(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                   />
                </div>
                <button onClick={() => handleGenerateSample('Random')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                   Generate Random Sample
                </button>
             </div>
           )}
           
           {samplingMethod === 'Systematic' && (
             <div className="space-y-6 max-w-md">
                <p className="text-sm text-slate-400">The system will select every Nth record starting from a random point.</p>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Desired Sample Size</label>
                   <input 
                      type="number" 
                      value={sysSampleSize}
                      onChange={e => setSysSampleSize(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white mb-4" 
                   />
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4">
                   <div className="text-sm text-slate-400">Sampling Interval:</div>
                   <div className="text-lg font-medium text-indigo-400">{Math.max(1, Math.floor(totalRecords / (sysSampleSize || 1)))}</div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Random Starting Point (Index)</label>
                   <input 
                      type="number" 
                      value={sysStart}
                      onChange={e => setSysStart(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                   />
                </div>
                <button onClick={() => handleGenerateSample('Systematic')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                   Generate Systematic Sample
                </button>
             </div>
           )}
           
           {samplingMethod === 'Monetary / Value-Based' && (
             <div className="space-y-6 max-w-md">
                <p className="text-sm text-slate-400">The system will select actual transactions based on their monetary values.</p>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Amount ({currencyMode})</label>
                   <input 
                      type="number" 
                      value={monetaryMin}
                      onChange={e => setMonetaryMin(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                   />
                </div>
                <div className="text-center text-sm text-slate-500">OR</div>
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Top Value Transactions (Count)</label>
                   <input 
                      type="number" 
                      value={monetaryTop}
                      onChange={e => setMonetaryTop(e.target.value)}
                      placeholder="e.g. 20"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                   />
                </div>
                <button onClick={() => handleGenerateSample('Monetary / Value-Based')} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors mt-4">
                   Generate Monetary Sample
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  )};
`;

code = code.replace("const renderSelectSample = () => (", newRenders + "\n  const renderSelectSample = () => (");

// Change dashboard view selection: replace "Population: {selectedPopulation?.fileName}" with the new views inside the return.
// We need to find the `return (` block at the bottom of the component
code = code.replace(
  "{view === 'population' && renderPopulation()}",
  "{view === 'overview' && renderOverview()}\n      {view === 'population_records' && renderPopulationRecords()}\n      {view === 'sampling_plan' && renderSamplingPlan()}\n      {view === 'select_sample' && renderSelectSample()}"
);

fs.writeFileSync('src/components/SamplingView.tsx', code);
