import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, Filter, CheckCircle2, AlertTriangle, 
  FileText, Info, Save, X, Edit, ExternalLink, Database
} from 'lucide-react';
import { UserSession } from '../types';

interface SamplingViewProps {
  currencyMode?: string;
  selectedClient: string;
  selectedDistributor: string;
  selectedAuditFilter?: string;
  currentUser: UserSession | null;
  onFindingCreated?: (finding: any) => void;
}

const formatCurrency = (val: number | null, mode: string = 'INR') => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat(mode === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: mode }).format(val);
};

const TESTING_TEMPLATES: Record<string, {id: string, text: string}[]> = {
  'Sales Testing': [
    { id: 'A', text: 'Customer is an approved entity per the company customer master file.' },
    { id: 'B', text: 'Credit note/other incentive is not to/on behalf of an individual or government official.' },
    { id: 'C', text: 'GL account coding appropriately reflects the transaction.' },
    { id: 'D', text: 'Supporting documentation is in accordance with policy and includes required documentation.' },
    { id: 'E', text: 'Relevant approvals are noted.' },
    { id: 'F', text: 'Approvals were rendered prior to the transaction.' },
    { id: 'G', text: 'Transaction occurred after execution of contract/addendum.' },
    { id: 'H', text: 'Pricing is in accordance with the effective contract.' },
  ],
  'Employee Disbursement & Reimbursement': [
    { id: 'A', text: 'Expenditure is allowed per company policy / does not relate to prohibited items.' },
    { id: 'B', text: 'Payment/expenditure is not to/on behalf of a government official.' },
    { id: 'C', text: 'GL account coding appropriately reflects the nature of the expenditure.' },
    { id: 'D', text: 'Supporting documentation complies with company policy and includes required expense report, approval form and underlying receipts.' },
    { id: 'E', text: 'Supporting documentation/receipts do not contain generic/questionable line items.' },
    { id: 'F', text: 'Relevant approvals are noted in line with policy.' },
    { id: 'G', text: 'Expense reimbursement is mathematically accurate.' },
    { id: 'H', text: 'Description, business purpose, location and attendees/company information are properly documented.' },
  ],
  '3rd Party Disbursement': [
    { id: 'A', text: 'Expenditure is allowed per the Distributor\'s policy.' },
    { id: 'B', text: 'Payment/expenditure is not to/on behalf of an individual or government official.' },
    { id: 'C', text: 'At the time payment was made, the vendor is an approved entity per the distributor\'s approved vendor master file.' },
    { id: 'D', text: 'General ledger account coding appropriately reflects the nature of the transaction.' },
    { id: 'E', text: 'Supporting documentation is in accordance with the distributor\'s policy and/or includes the required supporting documents such as contract/purchase order, invoice, proof of acceptance/service, approval form and evidence of payment.' },
    { id: 'F', text: 'Relevant approvals noted for the transaction in line with policy.' },
    { id: 'G', text: 'Supporting documentation verifies that approvals were rendered prior to payment.' },
    { id: 'H', text: 'Invoice/supporting documentation does not contain generic or questionable line items.' },
    { id: 'I', text: 'Supporting documentation verifies that goods/services were rendered after execution of contract/addendum.' },
    { id: 'J', text: 'Pricing of goods/services is in accordance with the effective contract.' },
    { id: 'K', text: 'Supporting documentation verifies that goods/services were rendered prior to payment.' },
    { id: 'L', text: 'Payment method was proper.' },
  ]
};

const EVIDENCE_FIELDS: Record<string, {id: string, label: string, type: string}[]> = {
  '3rd Party Disbursement': [
    { id: 'thirdPartyName', label: 'Third Party Name', type: 'text' },
    { id: 'transactionAmountUSD', label: 'Transaction Amount USD', type: 'text' },
    { id: 'approver', label: 'Approver', type: 'text' },
    { id: 'hasContract', label: 'Contract?', type: 'select' },
    { id: 'hasInvoice', label: 'Invoice?', type: 'select' },
    { id: 'hasProofOfService', label: 'Proof of Service?', type: 'select' },
    { id: 'hasPaymentSupport', label: 'Payment Support?', type: 'select' },
    { id: 'otherDocsProvided', label: 'Other Supporting Documents Provided', type: 'text' },
    { id: 'docsNotProvided', label: 'Supporting Documents Not Provided', type: 'text' },
  ],
  'Employee Disbursement & Reimbursement': [
    { id: 'employeeName', label: 'Employee Name', type: 'text' },
    { id: 'employeeTitle', label: 'Employee Title', type: 'text' },
    { id: 'transactionAmountUSD', label: 'Transaction Amount USD', type: 'text' },
    { id: 'hasExpenseReport', label: 'Expense Report?', type: 'select' },
    { id: 'hasReceipts', label: 'Underlying Receipts/Invoices?', type: 'select' },
    { id: 'approvals', label: 'Approvals/Approver Names?', type: 'text' },
    { id: 'otherDocsProvided', label: 'Other Supporting Documents Provided', type: 'text' },
    { id: 'docsNotProvided', label: 'Supporting Documents Not Provided', type: 'text' },
    { id: 'transactionOverview', label: 'Transaction Overview', type: 'text' },
  ],
  'Sales Testing': [
    { id: 'thirdPartyName', label: 'Third Party Name / Customer', type: 'text' },
    { id: 'transactionAmountUSD', label: 'Transaction Amount USD', type: 'text' },
    { id: 'hasContract', label: 'Contract and/or Purchase Order?', type: 'select' },
    { id: 'hasInvoice', label: 'Invoice?', type: 'select' },
    { id: 'hasGoodsReceipt', label: 'Goods/Service Receipt/Delivery Note?', type: 'select' },
    { id: 'approvals', label: 'Approvals / Approver?', type: 'text' },
    { id: 'otherDocsProvided', label: 'Other Supporting Documents Provided', type: 'text' },
    { id: 'docsNotProvided', label: 'Supporting Documents Not Provided', type: 'text' },
    { id: 'transactionOverview', label: 'Transaction Overview', type: 'text' },
  ]
};

export const SamplingView: React.FC<SamplingViewProps> = ({
  selectedClient,
  selectedDistributor,
  selectedAuditFilter,
  currentUser,
  currencyMode = 'INR'
}) => {
  const [activeTab, setActiveTab] = useState<'GL' | '3PD' | 'EMP' | 'SALES'>('GL');
  
  const [availablePopulations, setAvailablePopulations] = useState<any[]>([]);
  const [selectedPopulation, setSelectedPopulation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [populationRecords, setPopulationRecords] = useState<any[]>([]);
  const [assignedSamples, setAssignedSamples] = useState<any[]>([]);
  
  const [reviewRecord, setReviewRecord] = useState<any | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, { result: string, comment: string }>>({});
  const [reviewFields, setReviewFields] = useState<Record<string, string>>({});
  const [reviewException, setReviewException] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Available Populations
  useEffect(() => {
    const fetchPopulations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const res = await fetch(`/api/evidence?${params.toString()}`, {
          headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
          }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          const filtered = data.records.filter((r: any) => {
            const usage = r.documentUsage || '';
            const status = r.status || '';
            const isAcceptable = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\s+/g, '_'));
            const isTemplate = (r.fileName || '').toLowerCase().includes('template') || (r.fileName || '').toLowerCase().includes('questionnaire');
            if (isTemplate) return false;
            const hasSamplingUsage = Array.isArray(usage) ? usage.includes('SAMPLING_POPULATION') : usage.includes('SAMPLING_POPULATION');
            return (r.samplingEnabled === true || String(r.samplingEnabled) === 'true') && hasSamplingUsage && isAcceptable;
          });
          setAvailablePopulations(filtered);
          if (filtered.length > 0 && !selectedPopulation) {
            handleSelectPopulation(filtered[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch populations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopulations();
  }, [selectedDistributor, selectedAuditFilter]);

  const fetchAssignedSamples = async () => {
    try {
      const res = await fetch(`/api/sampling/transactions?distributorId=${encodeURIComponent(selectedDistributor)}&auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const data = await res.json();
      if (data.success) {
        setAssignedSamples(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch assigned samples", err);
    }
  };

  useEffect(() => {
    if (selectedDistributor) {
      fetchAssignedSamples();
    }
  }, [selectedDistributor, selectedAuditFilter]);

  const handleSelectPopulation = async (targetFile: any) => {
    setSelectedPopulation(targetFile);
    setLoading(true);
    try {
      const fileIdToFetch = targetFile.googleDriveFileId || targetFile.id;
      const res = await fetch(`/api/storage/download/${fileIdToFetch}?fileName=${encodeURIComponent(targetFile.fileName)}`);
      if (!res.ok) throw new Error(`Failed to download file ${targetFile.fileName}`);
      
      const buffer = await res.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (!jsonData || jsonData.length === 0) {
        setPopulationRecords([]);
      } else {
        const parsedRecords = jsonData.map((row: any, index: number) => {
           const keys = Object.keys(row);
           if (keys.length === 0) return null;
           const findVal = (matchKeys: string[]) => {
               const key = keys.find(k => matchKeys.some(match => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(match.toLowerCase().replace(/[^a-z0-9]/g, ''))));
               return key && row[key] !== "" ? row[key] : '—';
           };
           
           let dateVal = findVal(['date', 'transactiondate', 'invoicedate', 'postingdate', 'time']);
           let voucherNoVal = findVal(['voucherno', 'referenceno', 'transactionid', 'invoicenumber', 'invoiceno', 'documentid', 'refno', 'reference', 'id', 'slno']);
           let accountNumVal = findVal(['accountnumber', 'accountno', 'glaccount', 'account']);
           let accountDescVal = findVal(['accountdescription', 'accountname', 'glname']);
           let descVal = findVal(['description', 'particulars', 'memo', 'notes', 'purpose', 'details', 'item', 'product', 'vendor', 'customer', 'employee', 'payee']);
           let narrationVal = findVal(['narration', 'remarks', 'comment']);
           let debitVal = findVal(['debit', 'dr']);
           let creditVal = findVal(['credit', 'cr']);
           let balanceVal = findVal(['balance', 'bal']);
           
           const parseAmount = (val: any) => {
               if (val === '—' || val === '' || val === null || val === undefined) return null;
               if (typeof val === 'string') {
                   const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ""));
                   return isNaN(parsed) ? null : parsed;
               }
               const num = Number(val);
               return isNaN(num) ? null : num;
           };
           const debit = parseAmount(debitVal);
           const credit = parseAmount(creditVal);
           const balance = parseAmount(balanceVal);
           
           let idVal = voucherNoVal !== '—' && voucherNoVal !== undefined ? String(voucherNoVal) : `RECORD-${index + 1}`;
           if (idVal === '—') idVal = `RECORD-${index + 1}`;
           
           return {
             id: idVal,
             date: dateVal !== '—' ? String(dateVal) : '—',
             voucherNo: voucherNoVal !== '—' ? String(voucherNoVal) : '—',
             accountNumber: accountNumVal !== '—' ? String(accountNumVal) : '—',
             accountDescription: accountDescVal !== '—' ? String(accountDescVal) : '—',
             description: descVal !== '—' ? String(descVal) : '—',
             narration: narrationVal !== '—' ? String(narrationVal) : '—',
             debit: debit,
             credit: credit,
             balance: balance,
             originalRow: row
           };
        }).filter(Boolean);
        setPopulationRecords(parsedRecords);
      }
    } catch (err: any) {
      console.error("Error loading population:", err);
      setPopulationRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async (record: any, newClassification: string) => {
    const isClearing = newClassification === 'Not Selected' || newClassification === 'N/A';
    
    let refPrefix = '';
    if (newClassification === '3rd Party Disbursement') refPrefix = '3PD';
    if (newClassification === 'Employee Disbursement & Reimbursement') refPrefix = 'EMP';
    if (newClassification === 'Sales Testing') refPrefix = 'SAL';
    
    const newRef = isClearing ? '' : `${refPrefix}-${record.id}`;
    
    const payload = {
       sampleId: record.id,
       distributorId: selectedDistributor,
       auditId: selectedAuditFilter || 'eng-101',
       fileId: selectedPopulation?.id || 'unknown',
       testingClassification: newClassification,
       testingStatus: isClearing ? 'Pending Classification' : 'Assigned',
       testingReference: newRef,
       originalRow: record.originalRow,
       date: record.date,
       voucherNo: record.voucherNo,
       accountNumber: record.accountNumber,
       accountDescription: record.accountDescription,
       description: record.description,
       narration: record.narration,
       debit: record.debit,
       credit: record.credit,
       balance: record.balance
    };
    
    try {
      const res = await fetch('/api/sampling/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchAssignedSamples();
      }
    } catch (err) {
      console.error("Failed to classify record", err);
    }
  };

  const mergedRecords = useMemo(() => {
    return populationRecords.map(pop => {
      const dbSample = assignedSamples.find(s => s.sampleId === pop.id);
      if (dbSample) {
        return { ...pop, ...dbSample, isAssigned: true };
      }
      return { 
        ...pop, 
        testingClassification: 'Not Selected', 
        testingStatus: 'Pending Classification',
        testingReference: '',
        isAssigned: false 
      };
    }).filter(rec => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (rec.voucherNo || '').toLowerCase().includes(q) ||
            (rec.description || '').toLowerCase().includes(q) ||
            (rec.testingReference || '').toLowerCase().includes(q)
        );
    });
  }, [populationRecords, assignedSamples, searchQuery]);

  const openReviewModal = (record: any) => {
    setReviewRecord(record);
    setReviewAnswers(record.attributeResults || {});
    setReviewFields(record.evidenceFields || {
       thirdPartyName: record.description || '',
       employeeName: record.description || '',
       transactionAmountUSD: (record.debit || record.credit || 0).toString()
    });
    setReviewException(record.exceptions || '');
    setSaveSuccess(false);
  };

  const handleSaveReview = async () => {
    if (!reviewRecord) return;
    setIsSaving(true);
    
    // Calculate overall result
    let overall = 'Tested';
    if (reviewException) overall = 'Exception';
    else {
       const template = TESTING_TEMPLATES[reviewRecord.testingClassification] || [];
       for (const attr of template) {
         if (reviewAnswers[attr.id]?.result === 'No') overall = 'Exception';
       }
    }
    
    const payload = {
       ...reviewRecord,
       testingStatus: overall,
       overallResult: overall,
       attributeResults: reviewAnswers,
       evidenceFields: reviewFields,
       exceptions: reviewException
    };
    
    try {
      const res = await fetch('/api/sampling/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSaveSuccess(true);
        await fetchAssignedSamples();
        setTimeout(() => {
           setReviewRecord(null);
           setSaveSuccess(false);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to save review", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Sub-Tab Rendering logic
  const renderGLTab = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
      <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
        <thead>
          <tr className="bg-slate-950/50 border-b border-slate-800">
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Voucher No</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Account</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Description</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Debit</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Credit</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900">Testing Classification</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900">Status</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {mergedRecords.length === 0 ? (
            <tr><td colSpan={9} className="py-12 text-center text-slate-400">No records found.</td></tr>
          ) : (
            mergedRecords.map((rec, i) => (
              <tr key={rec.id + i} className="hover:bg-slate-800/30 transition-colors group">
                <td className="py-2 px-4 text-slate-300">{rec.date}</td>
                <td className="py-2 px-4 font-medium text-slate-200">{rec.voucherNo}</td>
                <td className="py-2 px-4 text-slate-400 truncate max-w-[150px]" title={rec.accountDescription}>{rec.accountDescription !== '—' ? rec.accountDescription : rec.accountNumber}</td>
                <td className="py-2 px-4 text-slate-400 truncate max-w-[200px]" title={rec.description}>{rec.description}</td>
                <td className="py-2 px-4 text-emerald-400/90 font-medium text-right">{formatCurrency(rec.debit, currencyMode)}</td>
                <td className="py-2 px-4 text-rose-400/90 font-medium text-right">{formatCurrency(rec.credit, currencyMode)}</td>
                
                {/* Application Controlled Fields */}
                <td className="py-2 px-4 bg-slate-900/40">
                  <select 
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 w-48 focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={rec.testingClassification}
                    onChange={(e) => handleClassify(rec, e.target.value)}
                  >
                    <option value="Not Selected">Not Selected</option>
                    <option value="3rd Party Disbursement">3rd Party Disbursement</option>
                    <option value="Employee Disbursement & Reimbursement">Employee Disbursement & Reimbursement</option>
                    <option value="Sales Testing">Sales Testing</option>
                    <option value="N/A">N/A</option>
                  </select>
                </td>
                <td className="py-2 px-4 bg-slate-900/40">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                    ${rec.testingStatus === 'Pending Classification' ? 'bg-slate-800 text-slate-400' : 
                      rec.testingStatus === 'Assigned' ? 'bg-blue-500/20 text-blue-400' : 
                      rec.testingStatus === 'Tested' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-rose-500/20 text-rose-400'}`}>
                    {rec.testingStatus}
                  </span>
                </td>
                <td className="py-2 px-4 bg-slate-900/40 font-mono text-xs text-indigo-300">
                  {rec.testingReference}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTestingTab = (classification: string) => {
    const records = mergedRecords.filter(r => r.testingClassification === classification);
    
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
        <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
          <thead>
            <tr className="bg-slate-950/50 border-b border-slate-800">
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">No</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Document ID</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Transaction Date</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">GL Description</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Amount Local</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-center">Testing Status</th>
              <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {records.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400">No samples assigned to this category.</td></tr>
            ) : (
              records.map((rec, i) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-4 font-medium text-indigo-300">{rec.testingReference}</td>
                  <td className="py-3 px-4 text-slate-300">{rec.date}</td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[250px]" title={rec.description}>{rec.description}</td>
                  <td className="py-3 px-4 font-medium text-slate-200 text-right">{formatCurrency(rec.debit || rec.credit, currencyMode)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                      ${rec.testingStatus === 'Assigned' ? 'bg-blue-500/20 text-blue-400' : 
                        rec.testingStatus === 'Tested' ? 'bg-emerald-500/20 text-emerald-400' : 
                        'bg-rose-500/20 text-rose-400'}`}>
                      {rec.testingStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => openReviewModal(rec)}
                      className="text-xs font-bold bg-slate-800 hover:bg-indigo-600 text-white px-3 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReviewModal = () => {
    if (!reviewRecord) return null;
    const template = TESTING_TEMPLATES[reviewRecord.testingClassification] || [];
    const evidenceFields = EVIDENCE_FIELDS[reviewRecord.testingClassification] || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                  {reviewRecord.testingClassification}
                </span>
                <span className="font-mono text-sm text-slate-400">{reviewRecord.testingReference}</span>
              </div>
              <h2 className="text-xl font-bold text-white">Sample Testing & Attributes</h2>
            </div>
            <button onClick={() => setReviewRecord(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* GL Context */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Source GL Information
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Date</div><div className="text-sm text-slate-200">{reviewRecord.date}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Voucher No</div><div className="text-sm text-slate-200">{reviewRecord.voucherNo}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Account</div><div className="text-sm text-slate-200">{reviewRecord.accountDescription !== '—' ? reviewRecord.accountDescription : reviewRecord.accountNumber}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Amount Local</div><div className="text-sm font-medium text-emerald-400">{formatCurrency(reviewRecord.debit || reviewRecord.credit, currencyMode)}</div></div>
                <div className="col-span-4"><div className="text-[10px] text-slate-500 uppercase tracking-wider">Description / Narration</div><div className="text-sm text-slate-300">{reviewRecord.description} {reviewRecord.narration !== '—' ? `- ${reviewRecord.narration}` : ''}</div></div>
              </div>
            </div>

            {/* Evidence & Supporting Documents */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Transaction Evidence & Support
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {evidenceFields.map(f => (
                  <div key={f.id} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">{f.label}</label>
                    {f.type === 'select' ? (
                      <select 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        value={reviewFields[f.id] || ''}
                        onChange={e => setReviewFields({...reviewFields, [f.id]: e.target.value})}
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="N/A">N/A</option>
                      </select>
                    ) : (
                      <input 
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        value={reviewFields[f.id] || ''}
                        onChange={e => setReviewFields({...reviewFields, [f.id]: e.target.value})}
                        placeholder={f.label}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attributes Testing */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" /> Attribute Testing
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/50">
                {template.map(attr => (
                  <div key={attr.id} className="p-4 flex flex-col md:flex-row gap-6 hover:bg-slate-900/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">{attr.id}</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{attr.text}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 md:w-64 shrink-0">
                      <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 h-9">
                        {['Yes', 'No', 'N/A', 'See Comments'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: opt }})}
                            className={`flex-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors
                              ${reviewAnswers[attr.id]?.result === opt 
                                ? (opt === 'No' || opt === 'See Comments' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400')
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text"
                        placeholder="Add comment..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        value={reviewAnswers[attr.id]?.comment || ''}
                        onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], comment: e.target.value }})}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exceptions */}
            <div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Exceptions & Overall Comments
              </h3>
              <textarea 
                className="w-full h-24 bg-slate-950 border border-rose-900/50 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
                placeholder="Document any exceptions, control failures, or additional findings here..."
                value={reviewException}
                onChange={e => setReviewException(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {saveSuccess ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved successfully</span>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setReviewRecord(null)}
                className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveReview}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Test Results</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0F19]">
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Sampling & Testing</h1>
            <p className="text-slate-400 mt-2">Steps 2-4: General Ledger Analysis & Transaction Testing</p>
          </div>
        </div>

        {/* Population Selector (only show if none selected or multiple available) */}
        <div className="mb-8 flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 block">Active Population (GL File)</label>
            {loading ? (
               <div className="text-sm text-slate-300">Loading populations...</div>
            ) : availablePopulations.length > 0 ? (
               <select 
                 className="bg-transparent border-none text-sm font-bold text-white focus:outline-none focus:ring-0 cursor-pointer p-0 appearance-none"
                 value={selectedPopulation?.id || ''}
                 onChange={(e) => {
                   const pop = availablePopulations.find(p => p.id === e.target.value);
                   if (pop) handleSelectPopulation(pop);
                 }}
               >
                 {availablePopulations.map(p => (
                   <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.fileName}</option>
                 ))}
               </select>
            ) : (
               <div className="text-sm text-rose-400">No active GL population found. Please complete Step 1 (Upload GL).</div>
            )}
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search references, description..."
              className="w-64 bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: 'GL', label: 'General Ledger - Sample' },
            { id: '3PD', label: '3rd Party Disbursement' },
            { id: 'EMP', label: 'Employee Disbursement & Reimbursement' },
            { id: 'SALES', label: 'Sales Testing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'}`}
            >
              {tab.label}
              {tab.id !== 'GL' && (
                <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full ml-1">
                  {tab.id === '3PD' ? assignedSamples.filter(s => s.testingClassification === '3rd Party Disbursement').length :
                   tab.id === 'EMP' ? assignedSamples.filter(s => s.testingClassification === 'Employee Disbursement & Reimbursement').length :
                   assignedSamples.filter(s => s.testingClassification === 'Sales Testing').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4">
        {activeTab === 'GL' && renderGLTab()}
        {activeTab === '3PD' && renderTestingTab('3rd Party Disbursement')}
        {activeTab === 'EMP' && renderTestingTab('Employee Disbursement & Reimbursement')}
        {activeTab === 'SALES' && renderTestingTab('Sales Testing')}
      </div>

      {renderReviewModal()}
    </div>
  );
};
