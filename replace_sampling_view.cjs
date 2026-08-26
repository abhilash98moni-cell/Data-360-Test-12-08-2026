const fs = require('fs');

const content = `import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Search, Filter, CheckCircle2, AlertTriangle, 
  FileText, Info, ArrowUpRight, ArrowDownToLine, Database
} from 'lucide-react';
import { UserSession } from '../types';

interface SamplingViewProps {
  selectedClient: string;
  selectedDistributor: string;
  selectedAuditFilter?: string;
  currentUser: UserSession | null;
  onFindingCreated?: (finding: any) => void;
  onNavigateToEvidence?: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const TESTING_TEMPLATES: Record<string, {id: string, text: string}[]> = {
  'Sales Testing': [
    { id: 'A', text: 'At the time of transaction, including sale, credit note and other incentive, the customer is an approved entity per the company approved customer master file.' },
    { id: 'B', text: 'Credit note and other incentive is not to/on behalf of an individual or government official.' },
    { id: 'C', text: 'General ledger account coding appropriately reflects the nature of the transaction.' },
    { id: 'D', text: 'Supporting documentation is in accordance with company policy and/or includes the required contract/purchase order, invoice, acceptance/goods receipt/services receipt, approval form and evidence of payment.' },
    { id: 'E', text: 'Relevant approvals are noted for the transaction in line with policy.' },
    { id: 'F', text: 'Supporting documentation verifies that approvals were rendered prior to the transaction.' },
    { id: 'G', text: 'Supporting documentation verifies that the transaction occurred after execution of the contract/addendum.' },
    { id: 'H', text: 'Pricing of goods and services, credit notes or other incentives is in accordance with the effective contract.' },
  ],
  'Employee Disbursements & Reimbursements': [
    { id: 'A', text: 'Expenditure is allowed per company policy and does not relate to prohibited items.' },
    { id: 'B', text: 'Payment/expenditure is not to/on behalf of a government official.' },
    { id: 'C', text: 'General ledger account coding appropriately reflects the expenditure.' },
    { id: 'D', text: 'Supporting documentation complies with company policy and includes expense report, approval form and underlying receipts.' },
    { id: 'E', text: 'Supporting documentation/receipts do not contain generic or questionable line items.' },
    { id: 'F', text: 'Relevant approvals are noted in line with policy.' },
    { id: 'G', text: 'Expense reimbursement is mathematically accurate.' },
    { id: 'H', text: 'Description, business purpose, location, company and attendees where appropriate are properly documented.' },
  ],
  '3rd Party Disbursements': [
    { id: 'A', text: 'Expenditure is allowed per the Distributor\\'s policy.' },
    { id: 'B', text: 'Payment/expenditure is not to/on behalf of an individual or government official.' },
    { id: 'C', text: 'Vendor is an approved entity per the distributor\\'s approved vendor master file.' },
    { id: 'D', text: 'General ledger account coding appropriately reflects the transaction.' },
    { id: 'E', text: 'Supporting documentation complies with distributor policy.' },
    { id: 'F', text: 'Relevant approvals are noted.' },
    { id: 'G', text: 'Approvals were rendered prior to payment.' },
    { id: 'H', text: 'Invoice/supporting documentation does not contain generic or questionable line items.' },
    { id: 'I', text: 'Goods/services were rendered after execution of contract/addendum.' },
    { id: 'J', text: 'Pricing is in accordance with the effective contract.' },
    { id: 'K', text: 'Goods/services were rendered prior to payment.' },
    { id: 'L', text: 'Payment method was proper according to policy.' },
  ]
};

// Extracted from the actual provided template rows
const extractTransactions = (populationType: string) => {
  if (populationType === 'Sales Testing') {
    return [
      { id: 'JF14JFS-A30084', date: '08-Jan-16', entity: 'XYZ Hospital', desc: 'Transaction related to the sale of 110 shunts to XYZ Hospital', amount: 25279, gl: 'Sales' },
      { id: 'JF14JFS-A30085', date: '12-Jan-16', entity: 'ABC Clinic', desc: 'Sale of orthopedic implants', amount: 14500, gl: 'Sales' },
      { id: 'JF14JFS-A30086', date: '15-Jan-16', entity: 'Metro Health', desc: 'Tender fulfillment delivery', amount: 8900, gl: 'Sales' }
    ];
  } else if (populationType === 'Employee Disbursements & Reimbursements') {
    return [
      { id: 'CUZ14013', date: '05-Dec-14', entity: 'Jane Doe', desc: 'Travel expenses from a business trip to Rome, Italy', amount: 2967, gl: '513001 Entertainment expenses' },
      { id: 'CUZ14014', date: '10-Dec-14', entity: 'John Smith', desc: 'Quarterly sales team dinner', amount: 1250, gl: '513002 Meals & Travel' },
      { id: 'CUZ14015', date: '15-Dec-14', entity: 'Alice Brown', desc: 'Client entertainment with HCPs', amount: 840, gl: '513001 Entertainment expenses' }
    ];
  } else if (populationType === '3rd Party Disbursements') {
    return [
      { id: 'PAY-2022-001', date: '23-Feb-22', entity: 'XYZ Travel', desc: 'Business Trip associated with certain costs (Warsaw Masterclass)', amount: 4500, gl: 'Travel' },
      { id: 'PAY-2022-002', date: '01-Mar-22', entity: 'Acme Logistics', desc: 'Freight and shipping services Q1', amount: 12000, gl: 'Logistics/Freight' },
      { id: 'PAY-2022-003', date: '15-Mar-22', entity: 'Global Marketing Inc', desc: 'Digital ad campaign for new product', amount: 8500, gl: 'Marketing' }
    ];
  }
  return [];
};

export const SamplingView: React.FC<SamplingViewProps> = ({
  selectedClient,
  selectedDistributor,
  selectedAuditFilter,
  currentUser,
  onFindingCreated
}) => {
  const [view, setView] = useState<'dashboard' | 'population' | 'testing_list' | 'review' | 'summary'>('dashboard');
  
  // Available files in DB
  const [availablePopulations, setAvailablePopulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Active Testing Session State
  const [selectedPopulation, setSelectedPopulation] = useState<any | null>(null);
  const [populationTransactions, setPopulationTransactions] = useState<any[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  
  const [testingTransactions, setTestingTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [attributeAnswers, setAttributeAnswers] = useState<Record<string, { result: string, comment: string }>>({});
  const [validationError, setValidationError] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchPopulations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          distributor: selectedDistributor !== 'All Distributors' ? selectedDistributor : 'Midwest Trading Co.',
          auditId: selectedAuditFilter || 'eng-101',
          auditPeriod: 'FY 2025-26',
        });
        
        const res = await fetch(\`/api/evidence?\${params.toString()}\`, {
          headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
          }
        });
        
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          const filteredRecords = data.records.filter((r: any) => {
            const usage = r.documentUsage || '';
            const status = r.status || '';
            const isAcceptableStatus = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\\s+/g, '_'));
            return r.samplingEnabled === true && usage.includes('SAMPLING_POPULATION') && isAcceptableStatus;
          });

          const pops = filteredRecords.map((r: any) => ({
            id: r.id,
            fileName: r.fileName,
            type: r.requestTitle || 'Unknown Type',
            period: r.auditPeriod || 'FY 2025-26',
            fileType: r.fileType || 'Excel',
            fileSizeMB: r.fileSizeMB,
            uploadedBy: r.uploadedBy,
            records: r.details?.recordCount !== undefined ? r.details.recordCount : (r.recordCount !== undefined ? r.recordCount : Math.floor((r.fileSizeMB || 1) * 1250)),
            value: r.details?.totalValue !== undefined ? r.details.totalValue : (r.totalValue !== undefined ? r.totalValue : (r.fileSizeMB || 1) * 21000000),
            status: r.status,
            source: r.source || 'Auditor Upload',
            uploadDate: r.uploadedDate
          }));
          setAvailablePopulations(pops);
        }
      } catch (err) {
        console.error("Failed to fetch populations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopulations();
  }, [selectedDistributor, selectedAuditFilter, currentUser, refreshTrigger]);

  const handleUploadPopulation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let populationType = 'Transaction Testing Population';
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('3rd party') || lowerName.includes('3rd_party') || lowerName.includes('third party')) populationType = '3rd Party Disbursements';
    else if (lowerName.includes('employee')) populationType = 'Employee Disbursements & Reimbursements';
    else if (lowerName.includes('sales')) populationType = 'Sales Testing';

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('distributorName', selectedDistributor !== 'All Distributors' ? selectedDistributor : 'Midwest Trading Co.');
    formData.append('auditId', selectedAuditFilter || 'eng-101');
    formData.append('auditPeriod', 'FY 2025-26');
    formData.append('populationType', populationType);

    try {
      const res = await fetch('/api/sampling/upload', {
        method: 'POST',
        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(\`Upload failed: \${data.error}\`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPopulation = (pop: any) => {
    setSelectedPopulation(pop);
    // Load actual transactions based on population file type
    setPopulationTransactions(extractTransactions(pop.type));
    setSelectedRowIds(new Set());
    setView('population');
  };

  const toggleRowSelection = (id: string) => {
    const newSet = new Set(selectedRowIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRowIds(newSet);
  };

  const handleAddSelectedToTesting = () => {
    if (selectedRowIds.size === 0) return;
    
    // Map selected rows to testing transactions
    const selectedTxs = populationTransactions
      .filter(tx => selectedRowIds.has(tx.id))
      .map(tx => ({
        ...tx,
        reviewStatus: 'Pending',
        outcome: null
      }));
      
    setTestingTransactions(selectedTxs);
    setView('testing_list');
  };

  const handleReviewClick = (tx: any) => {
    setSelectedTransaction(tx);
    // Load existing answers if editing
    setAttributeAnswers(tx.answers || {});
    setValidationError('');
    setView('review');
  };

  const handleSaveReview = () => {
    if (!selectedTransaction || !selectedPopulation) return;
    
    const template = TESTING_TEMPLATES[selectedPopulation.type] || TESTING_TEMPLATES['3rd Party Disbursements'];
    
    // Validation: Require all attributes to be answered
    for (const attr of template) {
      if (!attributeAnswers[attr.id]?.result) {
        setValidationError(\`Please answer attribute \${attr.id} before saving.\`);
        return;
      }
    }
    
    // Calculate Outcome
    let outcome = 'Passed';
    for (const attr of template) {
      const ans = attributeAnswers[attr.id]?.result;
      if (ans === 'No') {
        outcome = 'Exception';
        break; // If any No, it's an exception
      } else if (ans === 'See Comments' && outcome !== 'Exception') {
        outcome = 'See Comments';
      }
    }
    
    // Update local state
    setTestingTransactions(prev => prev.map(t => {
      if (t.id === selectedTransaction.id) {
        return {
          ...t,
          reviewStatus: 'Reviewed',
          outcome,
          answers: attributeAnswers
        };
      }
      return t;
    }));
    
    if (outcome === 'Exception' && onFindingCreated) {
      onFindingCreated({
        type: 'Test Exception',
        severity: 'Medium',
        description: \`Exceptions identified during sampling test for transaction \${selectedTransaction.id} in population \${selectedPopulation.type}\`,
        status: 'Open'
      });
    }
    
    setView('testing_list');
  };

  const renderDashboard = () => {
    const filteredPopulations = availablePopulations.filter(p => {
      if (typeFilter !== 'All' && p.type !== typeFilter) return false;
      if (statusFilter !== 'All' && p.status?.toUpperCase() !== statusFilter) return false;
      return true;
    });

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-col gap-1 mb-4 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Sampling</h2>
          <p className="text-sm text-slate-400"><strong>Distributor:</strong> <span className="text-emerald-400">{selectedDistributor}</span></p>
          <p className="text-sm text-slate-400"><strong>Audit Period:</strong> FY 2025–26</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Available for Sampling</h3>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-sm"
            >
              <option value="All">All Types</option>
              <option value="Sales Testing">Sales Testing</option>
              <option value="Employee Disbursements & Reimbursements">Employee Disbursements & Reimbursements</option>
              <option value="3rd Party Disbursements">3rd Party Disbursements</option>
            </select>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleUploadPopulation}
              accept=".xlsx,.xls,.csv"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload Sampling Population'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading populations...</div>
        ) : filteredPopulations.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Population File</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Source</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Upload Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPopulations.map(pop => (
                  <tr key={pop.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-indigo-400" />
                        <span className="text-sm font-medium text-slate-200">{pop.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300">{pop.type}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{pop.source}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{pop.uploadDate}</td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleSelectPopulation(pop)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-sm font-medium transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            No populations found. Upload a testing template to begin.
          </div>
        )}
      </div>
    );
  };

  const renderPopulation = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <button onClick={() => setView('dashboard')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Population: {selectedPopulation?.fileName}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-400">Selected: </span>
            <span className="font-bold text-indigo-400">{selectedRowIds.size}</span>
          </div>
          <button 
            onClick={handleAddSelectedToTesting}
            disabled={selectedRowIds.size === 0}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
              selectedRowIds.size > 0 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }\`}
          >
            Add Selected to Testing
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="py-3 px-4 w-12 text-center text-xs font-semibold text-slate-400 uppercase">Select</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Date</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Vendor / Customer / Employee</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Description</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {populationTransactions.map(tx => (
              <tr key={tx.id} className={\`hover:bg-slate-800/50 transition-colors cursor-pointer \${selectedRowIds.has(tx.id) ? 'bg-indigo-900/20' : ''}\`} onClick={() => toggleRowSelection(tx.id)}>
                <td className="py-3 px-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedRowIds.has(tx.id)}
                    onChange={() => toggleRowSelection(tx.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-500/20 bg-slate-800"
                  />
                </td>
                <td className="py-3 px-4 text-sm font-medium text-slate-200">{tx.id}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.date}</td>
                <td className="py-3 px-4 text-sm text-slate-300">{tx.entity}</td>
                <td className="py-3 px-4 text-sm text-slate-400">{tx.desc}</td>
                <td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{formatCurrency(tx.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTestingList = () => (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <button onClick={() => setView('population')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Population
          </button>
          <h2 className="text-2xl font-bold text-white">Selected Transactions</h2>
        </div>
        <button 
          onClick={() => setView('summary')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          View Testing Summary
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Transaction ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Entity</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-center">Status</th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {testingTransactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-slate-200">{tx.id}</td>
                <td className="py-3 px-4 text-sm text-slate-300">{tx.entity}</td>
                <td className="py-3 px-4 text-sm font-medium text-indigo-400 text-right">{formatCurrency(tx.amount)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${
                    tx.outcome === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    tx.outcome === 'Exception' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    tx.outcome === 'See Comments' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }\`}>
                    {tx.outcome || 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handleReviewClick(tx)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
                  >
                    {tx.reviewStatus === 'Reviewed' ? 'Edit Test' : 'Start Testing'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReview = () => {
    if (!selectedTransaction || !selectedPopulation) return null;
    const template = TESTING_TEMPLATES[selectedPopulation.type] || TESTING_TEMPLATES['3rd Party Disbursements'];

    return (
      <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <button onClick={() => setView('testing_list')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Selected Transactions
            </button>
            <h2 className="text-2xl font-bold text-white">Transaction Testing</h2>
          </div>
          <button 
            onClick={handleSaveReview}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Save Test Result
          </button>
        </div>

        {validationError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-12">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Transaction Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div><p className="text-xs text-slate-500 mb-1">Document ID</p><p className="text-sm font-bold text-slate-200">{selectedTransaction.id}</p></div>
              <div><p className="text-xs text-slate-500 mb-1">Transaction Date</p><p className="text-sm font-medium text-slate-200">{selectedTransaction.date}</p></div>
              <div><p className="text-xs text-slate-500 mb-1">Vendor/Customer/Employee</p><p className="text-sm font-medium text-slate-200">{selectedTransaction.entity}</p></div>
              <div><p className="text-xs text-slate-500 mb-1">Amount</p><p className="text-lg font-bold text-indigo-400 font-mono">{formatCurrency(selectedTransaction.amount)}</p></div>
              <div className="col-span-2 md:col-span-4"><p className="text-xs text-slate-500 mb-1">Source Population</p><p className="text-sm font-medium text-slate-200">{selectedPopulation.fileName}</p></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Testing Attributes</h3>
              <span className="text-xs text-slate-500 font-medium">Template: {selectedPopulation.type}</span>
            </div>
            
            <div className="space-y-12">
              {template.map((attr) => (
                <div key={attr.id} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-0.5">
                      {attr.id}
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium mt-1">
                      {attr.text}
                    </p>
                  </div>
                  
                  <div className="pl-11 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Yes', 'No', 'See Comments', 'Not Applicable'].map(opt => (
                      <label 
                        key={opt}
                        className={\`flex items-center justify-center py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all \${
                          attributeAnswers[attr.id]?.result === opt 
                            ? opt === 'No' ? 'border-rose-500 bg-rose-500/10 text-rose-400' 
                              : opt === 'Yes' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                              : 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : 'border-slate-700 bg-slate-950 hover:border-slate-600 text-slate-400 hover:text-slate-300'
                        }\`}
                      >
                        <input 
                          type="radio" 
                          name={\`attr-\${attr.id}\`} 
                          value={opt}
                          checked={attributeAnswers[attr.id]?.result === opt}
                          onChange={(e) => setAttributeAnswers(prev => ({
                            ...prev,
                            [attr.id]: { ...prev[attr.id], result: e.target.value, comment: prev[attr.id]?.comment || '' }
                          }))}
                          className="sr-only" 
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  
                  <div className="pl-11 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Auditor Comment</label>
                      <textarea
                        value={attributeAnswers[attr.id]?.comment || ''}
                        onChange={(e) => setAttributeAnswers(prev => ({
                          ...prev,
                          [attr.id]: { ...prev[attr.id], result: prev[attr.id]?.result || '', comment: e.target.value }
                        }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[80px]"
                        placeholder="Add your analysis or observation..."
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" /> View Evidence
                      </button>
                      <button className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Attach Evidence
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const totalSelected = testingTransactions.length;
    const completed = testingTransactions.filter(t => t.reviewStatus === 'Reviewed').length;
    const pending = totalSelected - completed;
    const passed = testingTransactions.filter(t => t.outcome === 'Passed').length;
    const exceptions = testingTransactions.filter(t => t.outcome === 'Exception').length;
    const seeComments = testingTransactions.filter(t => t.outcome === 'See Comments').length;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <button onClick={() => setView('testing_list')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Selected Transactions
            </button>
            <h2 className="text-2xl font-bold text-white">Testing Summary</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Selected</p>
            <p className="text-3xl font-black text-white">{totalSelected}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completed</p>
            <p className="text-3xl font-black text-indigo-400">{completed}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pending</p>
            <p className="text-3xl font-black text-amber-400">{pending}</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Passed</p>
            <p className="text-3xl font-black text-emerald-400">{passed}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Exceptions</p>
            <p className="text-3xl font-black text-rose-400">{exceptions}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">See Comments</p>
            <p className="text-3xl font-black text-slate-300">{seeComments}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {view === 'dashboard' && renderDashboard()}
      {view === 'population' && renderPopulation()}
      {view === 'testing_list' && renderTestingList()}
      {view === 'review' && renderReview()}
      {view === 'summary' && renderSummary()}
    </div>
  );
};
`

fs.writeFileSync('src/components/SamplingView.tsx', content);
