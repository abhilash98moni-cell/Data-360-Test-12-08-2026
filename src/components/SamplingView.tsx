import React, { useState, useEffect, useMemo } from 'react';
import { Plus,  
  ArrowLeft, Search, Filter, CheckCircle2, AlertTriangle, 
  FileText, Info, Save, X, Edit, ExternalLink, Database, ShieldCheck,
  ChevronDown, ChevronUp, Eye, Download, FileSpreadsheet, ImageIcon,
  Paperclip, MessageSquare, HelpCircle, CheckCircle, Clock, File, Send,
  FileCheck
 } from 'lucide-react';
import { UserSession } from '../types';
import { CurrencyMode, formatFinancialAmount } from '../utils/currencyFormatter';
import { RequiredDataQuestionnaire } from './RequiredDataQuestionnaire';

interface SamplingViewProps {
  isEvidenceManagementMode?: boolean;
  currencyMode?: string;
  selectedClient: string;
  selectedDistributor: string;
  selectedAuditFilter?: string;
  currentUser: UserSession | null;
  onFindingCreated?: (finding: any) => void;
  onNavigateToUpload?: () => void;
  targetVoucherNo?: string | null;
}

const formatCurrency = (val: number | null | undefined, mode: string = 'INR') => {
  return formatFinancialAmount(val, mode === 'USD' ? 'USD' : 'INR');
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
  isEvidenceManagementMode = false,
  selectedClient,
  selectedDistributor,
  selectedAuditFilter,
  currentUser,
  currencyMode = 'INR',
  onNavigateToUpload,
  targetVoucherNo
}) => {
  const isDistributor = currentUser?.role === 'Distributor';
  const [openClassificationId, setOpenClassificationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'GL' | '3PD' | 'EMP' | 'SALES'>('GL');

  const [availablePopulations, setAvailablePopulations] = useState<any[]>([]);
  const [selectedPopulation, setSelectedPopulation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [populationRecords, setPopulationRecords] = useState<any[]>([]);
  const [assignedSamples, setAssignedSamples] = useState<any[]>([]);
  const [classificationChanges, setClassificationChanges] = useState<Record<string, string[]>>({});
  const [isSavingClassifications, setIsSavingClassifications] = useState(false);
  const [classificationSaveSuccess, setClassificationSaveSuccess] = useState(false);
  const [classificationSaveError, setClassificationSaveError] = useState<string | null>(null);
  
  const [reviewRecord, setReviewRecord] = useState<any | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, { result: string, comment: string }>>({});
  const [reviewFields, setReviewFields] = useState<Record<string, string>>({});
  const [reviewException, setReviewException] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, any>>({});
  const [questionnaireQuestions, setQuestionnaireQuestions] = useState<any[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [fullModalRecord, setFullModalRecord] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon className="h-4 w-4 text-amber-400" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="h-4 w-4 text-rose-400" />;
    }
    return <File className="h-4 w-4 text-indigo-400" />;
  };

  const handleDownloadDoc = (doc: any) => {
    const link = document.createElement('a');
    link.href = doc.url || doc.dataUrl || '#';
    link.download = doc.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchQuestionnaireResponses = async () => {
    try {
      const headers = { 'x-user-email': currentUser?.email || '' };
      const [resResp, resQuestions] = await Promise.all([
        fetch(`/api/sampling/required-data/responses?auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}&distributorId=${encodeURIComponent(selectedDistributor)}`, { headers }),
        fetch(`/api/sampling/required-data/questions?auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}&distributorId=${encodeURIComponent(selectedDistributor)}`, { headers })
      ]);

      if (resResp.ok) {
        const data = await resResp.json();
        if (data.success && Array.isArray(data.responses)) {
          const map: Record<string, any> = {};
          data.responses.forEach((r: any) => {
            const sId = String(r.sample_id || '').toLowerCase();
            const vNo = String(r.voucher_no || r.voucherNo || '').toLowerCase();
            if (sId) map[sId] = r;
            if (vNo) map[vNo] = r;
          });
          setQuestionnaireResponses(map);
        }
      }

      if (resQuestions.ok) {
        const qData = await resQuestions.json();
        if (qData.success && Array.isArray(qData.questions)) {
          setQuestionnaireQuestions(qData.questions);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch questionnaire responses & questions', err);
    }
  };

  const fetchCustomQuestions = async () => {
      try {
        const params = new URLSearchParams({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const res = await fetch(`/api/sampling/questions?${params.toString()}`, {
          headers: {
            'x-user-email': currentUser?.email || '',
            'x-user-role': currentUser?.role || '',
            'x-user-organization': currentUser?.organization || ''
          }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.questions)) {
          const formatted = data.questions.map((q: any) => ({
             id: q.question_id,
             text: q.question_text,
             contextClass: q.testing_classification,
             type: q.question_type,
             required: q.required,
             options: q.options || [],
             conditionalRules: q.conditional_rules || [],
             attributeCode: q.attribute_code,
             scope: q.scope || 'classification',
             sampleId: q.sample_id,
             dbId: q.dbId
          }));
          setCustomQuestions(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch custom questions", err);
      }
  };

  // Fetch custom questions on load
  useEffect(() => {
    if (selectedDistributor) {
       fetchCustomQuestions();
    }
  }, [selectedDistributor, selectedAuditFilter]);

  // Fetch Available Populations and Restore Active Sampling State
  const fetchSamplingWorkspace = async () => {
    setLoading(true);
    try {
      // 1. Fetch available populations from /api/sampling/populations
      let populationsList: any[] = [];
      try {
        const popRes = await fetch(`/api/sampling/populations?distributorId=${encodeURIComponent(selectedDistributor)}&auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}&client=${encodeURIComponent(selectedClient || 'Apex Electronics Corp')}`, {
          headers: {
            'x-user-email': currentUser?.email || 'auditor@data360.io',
            'x-user-role': currentUser?.role || 'Auditor',
            'x-user-organization': currentUser?.organization || 'Apex Audit Practice (AA)'
          }
        });
        if (popRes.ok) {
          const popData = await popRes.json();
          if (popData.success && Array.isArray(popData.populations)) {
            populationsList = popData.populations;
          }
        }
      } catch (err) {
        console.warn("Populations endpoint fallback", err);
      }

      // Fallback to /api/evidence if needed
      if (populationsList.length === 0) {
        const params = new URLSearchParams({
          distributor: selectedDistributor,
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
        });
        const res = await fetch(`/api/evidence?${params.toString()}`, {
          headers: {
            'x-user-email': currentUser?.email || 'auditor@data360.io',
            'x-user-role': currentUser?.role || 'Auditor',
            'x-user-organization': currentUser?.organization || 'Apex Audit Practice (AA)'
          }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          populationsList = data.records.filter((r: any) => {
            const usage = r.documentUsage || '';
            const status = r.status || '';
            const isAcceptable = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\s+/g, '_'));
            const hasSamplingUsage = Array.isArray(usage) ? usage.includes('SAMPLING_POPULATION') : usage.includes('SAMPLING_POPULATION');
            return (r.samplingEnabled === true || String(r.samplingEnabled) === 'true') && hasSamplingUsage && isAcceptable;
          });
        }
      }

      setAvailablePopulations(populationsList);

      // 2. Fetch saved sampling state from database
      let activePopId: string | null = null;
      try {
        const stateRes = await fetch(`/api/sampling/state?distributorId=${encodeURIComponent(selectedDistributor)}&auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}&client=${encodeURIComponent(selectedClient || 'Apex Electronics Corp')}`, {
          headers: { 'x-user-email': currentUser?.email || '' }
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData.success && stateData.state?.activePopulationId) {
            activePopId = stateData.state.activePopulationId;
          }
        }
      } catch (e) {
        console.warn("Could not load state from backend", e);
      }

      if (populationsList.length > 0) {
        let target: any = null;
        if (activePopId) {
          target = populationsList.find((p: any) => p.googleDriveFileId === activePopId || p.id === activePopId || p.fileName === activePopId);
        }
        if (!target) {
          target = populationsList[0];
        }
        setSelectedPopulation(target);
        await loadPopulationRecords(target, false);
      } else {
        setSelectedPopulation(null);
        setPopulationRecords([]);
      }

      // 3. Fetch assigned sample transactions and review states
      await fetchAssignedSamples();
      await fetchQuestionnaireResponses();
    } catch (err) {
      console.error("Failed to fetch sampling workspace", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamplingWorkspace();
  }, [selectedDistributor, selectedAuditFilter, selectedClient]);

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

  const loadPopulationRecords = async (targetFile: any, shouldPersistBackend: boolean = false) => {
    if (!targetFile) return;
    setSelectedPopulation(targetFile);
    
    const targetFileId = targetFile.googleDriveFileId || targetFile.id;

    if (shouldPersistBackend) {
      // Save active state to backend asynchronously
      fetch('/api/sampling/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser?.email || '' },
        body: JSON.stringify({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
          clientName: selectedClient || 'Apex Electronics Corp',
          activePopulationId: targetFileId,
          activePopulationName: targetFile.fileName
        })
      }).catch(e => console.warn('Could not persist sampling state', e));
    }

    setLoading(true);
    try {
      // 1. Try instant retrieval of pre-parsed records from backend
      try {
        const recordsRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(targetFileId)}&distributorId=${encodeURIComponent(selectedDistributor)}&auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}`, {
          headers: { 'x-user-email': currentUser?.email || '' }
        });
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          if (recordsData.success && Array.isArray(recordsData.records) && recordsData.records.length > 0) {
            setPopulationRecords(recordsData.records);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('API population records fetch failed, falling back to direct parse', e);
      }

      // 2. Fallback to direct download & client parse
      const res = await fetch(`/api/storage/download/${targetFileId}?fileName=${encodeURIComponent(targetFile.fileName)}`);
      if (!res.ok) throw new Error(`Failed to download file ${targetFile.fileName}`);
      
      const buffer = await res.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      
      if (!jsonData || jsonData.length === 0) {
        setPopulationRecords([]);
      } else {
        let mapping: any = {};
        if (typeof targetFile.glMapping === 'string') {
           try { mapping = JSON.parse(targetFile.glMapping); } catch(e) {}
        } else if (typeof targetFile.mappedData === 'string') {
           try { mapping = JSON.parse(targetFile.mappedData); } catch(e) {}
        } else {
           mapping = targetFile.glMapping || targetFile.mappedData || {};
        }

        const keys = Object.keys(jsonData[0] || {});
        
        const parseGLAmount = (val: any): number => {
          if (val === null || val === undefined || val === '' || val === '—' || val === '-') return 0;
          if (typeof val === 'number') return isNaN(val) ? 0 : val;
          let s = String(val).trim();
          if (!s || s === '—' || s === '-') return 0;
          let isNegative = false;
          if (s.startsWith('(') && s.endsWith(')')) {
            isNegative = true;
            s = s.slice(1, -1).trim();
          } else if (s.startsWith('-')) {
            isNegative = true;
            s = s.slice(1).trim();
          } else if (s.endsWith('-')) {
            isNegative = true;
            s = s.slice(0, -1).trim();
          } else if (s.toLowerCase().endsWith('cr')) {
            s = s.slice(0, -2).trim();
          } else if (s.toLowerCase().endsWith('dr')) {
            s = s.slice(0, -2).trim();
          }
          s = s.replace(/[^0-9.]/g, '');
          const num = parseFloat(s);
          if (isNaN(num)) return 0;
          return isNegative ? -num : num;
        };

        const detectCol = (exactCandidates: string[], partialCandidates: string[] = []) => {
          for (const h of keys) {
            const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const cand of exactCandidates) {
              if (clean === cand) return h;
            }
          }
          for (const h of keys) {
            const words = h.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
            for (const cand of exactCandidates) {
              if (words.includes(cand)) return h;
            }
          }
          for (const h of keys) {
            const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const cand of partialCandidates) {
              if (clean.includes(cand)) return h;
            }
          }
          return '';
        };

        const findVal = (row: any, colName: string) => {
          if (!colName) return '';
          if (row[colName] !== undefined && row[colName] !== null) {
            const s = String(row[colName]).trim();
            if (s !== '' && s !== 'null' && s !== 'undefined') return s;
          }
          const cleanTarget = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
          if (matchKey && row[matchKey] !== undefined && row[matchKey] !== null) {
            const s = String(row[matchKey]).trim();
            if (s !== '' && s !== 'null' && s !== 'undefined') return s;
          }
          return '';
        };

        const findNumVal = (row: any, colName: string) => {
          if (!colName) return 0;
          let raw = row[colName];
          if (raw === undefined || raw === null || raw === '') {
            const cleanTarget = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const matchKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanTarget);
            if (matchKey) raw = row[matchKey];
          }
          return parseGLAmount(raw);
        };

        const finalMap = {
          date: mapping.date || detectCol(['date', 'txndate', 'transactiondate', 'invoicedate', 'postingdate', 'docdate', 'entrydate']) || keys[0] || '',
          voucherNo: mapping.voucherNo || detectCol(['voucherno', 'vouchernum', 'voucher', 'referenceno', 'refno', 'ref', 'documentno', 'docno', 'invoiceno', 'invoicenumber', 'id', 'txnid']),
          accountNumber: mapping.accountNumber || detectCol(['accountnumber', 'accountno', 'accountnum', 'accno', 'accnum', 'acctno', 'acctnum', 'glaccount', 'glcode', 'accountcode', 'account']),
          accountDescription: mapping.accountDescription || detectCol(['accountdescription', 'accountdesc', 'accountname', 'accounttitle', 'headofaccount', 'ledgername', 'ledger', 'glname']),
          description: mapping.description || detectCol(['description', 'transactiondescription', 'particulars', 'narration', 'memo', 'details', 'remarks', 'purpose', 'lineitem']),
          narration: mapping.narration || detectCol(['narration', 'remarks', 'comment', 'comments', 'notes']),
          debit: mapping.debit || detectCol(['debit', 'debitamount', 'debits', 'debitamt', 'dramount', 'dramt', 'dr']),
          credit: mapping.credit || detectCol(['credit', 'creditamount', 'credits', 'creditamt', 'cramount', 'cramt', 'cr']),
          balance: mapping.balance || detectCol(['balance', 'closingbalance', 'runningbalance', 'netamount', 'netbalance', 'bal', 'closingbal', 'balanceamount'])
        };

        const parsedRecords = jsonData.map((row: any, index: number) => {
          const dateVal = findVal(row, finalMap.date) || '—';
          const voucherNoVal = findVal(row, finalMap.voucherNo) || `TX-${1000 + index + 1}`;
          const accountNumVal = findVal(row, finalMap.accountNumber);
          const accountDescVal = findVal(row, finalMap.accountDescription);
          const descVal = findVal(row, finalMap.description) || findVal(row, finalMap.narration) || `Transaction #${index + 1}`;
          const narrationVal = findVal(row, finalMap.narration);
          const debit = findNumVal(row, finalMap.debit);
          const credit = findNumVal(row, finalMap.credit);
          let balance = findNumVal(row, finalMap.balance);
          
          if (!finalMap.balance && balance === 0) {
            balance = debit - credit;
          }

          const finalAccNum = accountNumVal || '—';
          const finalAccDesc = accountDescVal || (accountNumVal ? `Account ${accountNumVal}` : '—');
          
          return {
            id: voucherNoVal !== '—' && voucherNoVal ? String(voucherNoVal) : `RECORD-${index + 1}`,
            sampleId: voucherNoVal !== '—' && voucherNoVal ? String(voucherNoVal) : `RECORD-${index + 1}`,
            originalRow: index + 2,
            date: dateVal,
            voucherNo: voucherNoVal,
            accountNumber: finalAccNum,
            accountDescription: finalAccDesc,
            description: descVal,
            narration: narrationVal || '—',
            debit: debit,
            credit: credit,
            balance: balance,
            testingClassification: [],
            testingStatus: 'Pending Classification',
            testingReference: ''
          };
        });
        setPopulationRecords(parsedRecords);
      }
    } catch (err: any) {
      console.error("Error loading population:", err);
      setPopulationRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPopulation = async (targetFile: any) => {
    await loadPopulationRecords(targetFile, true);
  };

  const handleClassificationToggle = (rec: any, opt: string) => {
    const current = classificationChanges[rec.id] !== undefined
      ? classificationChanges[rec.id]
      : (Array.isArray(rec.testingClassification) ? rec.testingClassification : []);
    
    let next: string[] = [];
    if (opt === 'N/A') {
      next = current.includes('N/A') ? [] : ['N/A'];
    } else {
      const withoutNA = current.filter(c => c !== 'N/A' && c !== 'Not Selected' && c !== 'Pending Classification');
      if (withoutNA.includes(opt)) {
        next = withoutNA.filter(c => c !== opt);
      } else {
        next = [...withoutNA, opt];
      }
    }

    setClassificationChanges(prev => ({
      ...prev,
      [rec.id]: next
    }));
    setClassificationSaveSuccess(false);
    setClassificationSaveError(null);
  };

  const handleClearClassification = (rec: any) => {
    setClassificationChanges(prev => ({
      ...prev,
      [rec.id]: []
    }));
    setClassificationSaveSuccess(false);
    setClassificationSaveError(null);
  };

  const handleSaveAllClassifications = async () => {
    const changedIds = Object.keys(classificationChanges);
    if (changedIds.length === 0) return;

    setIsSavingClassifications(true);
    setClassificationSaveSuccess(false);
    setClassificationSaveError(null);

    const transactionsToSave = changedIds.map(id => {
      const record = populationRecords.find(r => r.id === id) || mergedRecords.find(r => r.id === id) || {};
      const newClassifications = classificationChanges[id] || [];
      const isClearing = newClassifications.length === 0;
      const isNA = newClassifications.includes('N/A');

      let refPrefix = '';
      if (!isClearing && !isNA && newClassifications.length > 0) {
        const first = newClassifications[0];
        if (first === '3rd Party Disbursement') refPrefix = '3PD';
        else if (first === 'Employee Disbursement & Reimbursement') refPrefix = 'EMP';
        else if (first === 'Sales Testing') refPrefix = 'SAL';
      }

      const existingSample = assignedSamples.find(s => 
        s.sampleId === id || 
        (s.voucherNo && record.voucherNo && s.voucherNo !== '—' && s.voucherNo === record.voucherNo)
      );
      const newRef = (isClearing || isNA) ? '' : (existingSample?.testingReference || `${refPrefix}-${record.voucherNo !== '—' && record.voucherNo ? record.voucherNo : id}`);

      return {
        sampleId: id,
        distributorId: selectedDistributor,
        auditId: selectedAuditFilter || 'eng-101',
        fileId: selectedPopulation?.id || selectedPopulation?.googleDriveFileId || 'unknown',
        testingClassification: newClassifications,
        testingStatus: isClearing ? 'Pending Classification' : (isNA ? 'N/A' : (existingSample?.testingStatus && existingSample.testingStatus !== 'Pending Classification' ? existingSample.testingStatus : 'Assigned')),
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
        balance: record.balance,
        attributeResults: existingSample?.attributeResults || {},
        evidenceFields: existingSample?.evidenceFields || {},
        exceptions: existingSample?.exceptions || ''
      };
    });

    try {
      const res = await fetch('/api/sampling/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify({ 
          transactions: transactionsToSave,
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
          clientName: selectedClient || 'Apex Electronics Corp',
          activePopulationId: selectedPopulation?.googleDriveFileId || selectedPopulation?.id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClassificationChanges({});
        setClassificationSaveSuccess(true);
        await fetchAssignedSamples();
        setTimeout(() => {
          setClassificationSaveSuccess(false);
        }, 4000);
      } else {
        setClassificationSaveError(data.error || 'Failed to save classifications');
      }
    } catch (err: any) {
      console.error("Failed to save classifications", err);
      setClassificationSaveError(err.message || 'Failed to save classifications');
    } finally {
      setIsSavingClassifications(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (openClassificationId) setOpenClassificationId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openClassificationId]);

  const mergedRecords = useMemo(() => {
    return populationRecords.map(pop => {
      const dbSample = assignedSamples.find(s => 
        s.sampleId === pop.id || 
        s.id === pop.id ||
        (s.voucherNo && pop.voucherNo && s.voucherNo !== '—' && s.voucherNo === pop.voucherNo)
      );

      let currentClassifications: string[] = [];
      if (classificationChanges[pop.id] !== undefined) {
        currentClassifications = classificationChanges[pop.id];
      } else if (dbSample) {
        let tc = dbSample.testingClassification;
        if (Array.isArray(tc)) {
          currentClassifications = tc;
        } else if (typeof tc === 'string') {
          if (tc === 'Not Selected' || tc === '' || tc === 'Pending Classification') {
            currentClassifications = [];
          } else {
            currentClassifications = [tc];
          }
        }
      } else if (pop.testingClassification) {
        let tc = pop.testingClassification;
        if (Array.isArray(tc)) {
          currentClassifications = tc;
        } else if (typeof tc === 'string' && tc && tc !== 'Not Selected' && tc !== 'Pending Classification') {
          currentClassifications = [tc];
        }
      }

      const cleanClassifications = currentClassifications.filter(c => c && c !== 'Not Selected' && c !== 'Pending Classification');
      const isNA = cleanClassifications.includes('N/A');
      const isAssigned = cleanClassifications.length > 0 && !isNA;

      let testingStatus = pop.testingStatus || 'Pending Classification';
      let testingReference = pop.testingReference || '';

      if (dbSample) {
        testingStatus = dbSample.testingStatus || (isNA ? 'N/A' : isAssigned ? 'Assigned' : 'Pending Classification');
        testingReference = dbSample.testingReference || '';
      } else if (isNA) {
        testingStatus = 'N/A';
      } else if (isAssigned) {
        testingStatus = 'Assigned';
      }

      if (!testingReference && isAssigned) {
        const prefix = cleanClassifications[0] === '3rd Party Disbursement' ? '3PD' : cleanClassifications[0] === 'Employee Disbursement & Reimbursement' ? 'EMP' : 'SAL';
        testingReference = `${prefix}-${pop.voucherNo && pop.voucherNo !== '—' ? pop.voucherNo : pop.id}`;
      }

      const cleanKey1 = String(pop.id || '').toLowerCase();
      const cleanKey2 = String(pop.voucherNo || '').toLowerCase();
      const cleanKey3 = String(dbSample?.sampleId || dbSample?.id || '').toLowerCase();
      const qResp = questionnaireResponses[cleanKey1] || questionnaireResponses[cleanKey2] || questionnaireResponses[cleanKey3];
      const qStatus = qResp?.status;
      const isAccepted = qStatus === 'Accepted' || 
                         qStatus === 'Completed' || 
                         testingStatus === 'Tested';

      return {
        ...pop,
        ...(dbSample || {}),
        // Ensure authoritative transaction fields from pop are never overwritten by empty fields from dbSample
        date: pop.date || dbSample?.date || '—',
        voucherNo: pop.voucherNo || dbSample?.voucherNo || '—',
        accountNumber: (pop.accountNumber && pop.accountNumber !== '—') ? pop.accountNumber : (dbSample?.accountNumber || pop.accountNumber || '—'),
        accountDescription: (pop.accountDescription && pop.accountDescription !== '—') ? pop.accountDescription : (dbSample?.accountDescription || pop.accountDescription || '—'),
        description: (pop.description && pop.description !== '—') ? pop.description : (dbSample?.description || pop.description || '—'),
        narration: (pop.narration && pop.narration !== '—') ? pop.narration : (dbSample?.narration || pop.narration || '—'),
        debit: typeof pop.debit === 'number' && !isNaN(pop.debit) ? pop.debit : (Number(dbSample?.debit) || 0),
        credit: typeof pop.credit === 'number' && !isNaN(pop.credit) ? pop.credit : (Number(dbSample?.credit) || 0),
        balance: typeof pop.balance === 'number' && !isNaN(pop.balance) ? pop.balance : (Number(dbSample?.balance) || 0),
        testingClassification: cleanClassifications,
        testingStatus,
        testingReference,
        isAssigned,
        isAccepted,
        questionnaireStatus: qStatus || 'Accepted',
        questionnaireResponse: qResp
      };
    }).filter(rec => rec.isAccepted).filter(rec => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (rec.voucherNo || '').toLowerCase().includes(q) ||
            (rec.description || '').toLowerCase().includes(q) ||
            (rec.testingReference || '').toLowerCase().includes(q) ||
            (rec.accountNumber || '').toLowerCase().includes(q) ||
            (rec.accountDescription || '').toLowerCase().includes(q)
        );
    });
  }, [populationRecords, assignedSamples, classificationChanges, questionnaireResponses, searchQuery]);

  const totalGLDebit = useMemo(() => mergedRecords.reduce((sum, r) => sum + (Number(r.debit) || 0), 0), [mergedRecords]);
  const totalGLCredit = useMemo(() => mergedRecords.reduce((sum, r) => sum + (Number(r.credit) || 0), 0), [mergedRecords]);
  const totalGLBalance = useMemo(() => totalGLDebit - totalGLCredit, [totalGLDebit, totalGLCredit]);

  const openReviewModal = (record: any, classificationContext?: string) => {
    setReviewRecord({ ...record, _activeClassificationContext: classificationContext || (Array.isArray(record.testingClassification) ? record.testingClassification[0] : record.testingClassification) });
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
       const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
       const relevantCustomQuestions = customQuestions.filter(q => 
          q.contextClass === contextClass && 
          (!q.scope || q.scope === 'classification' || (q.scope === 'sample' && q.sampleId === reviewRecord.id))
       );
       const template = [...(TESTING_TEMPLATES[contextClass] || []), ...relevantCustomQuestions];
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
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || ''
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

  const getQuestionsForRecord = (rec: any) => {
    const sId = String(rec.sampleId || rec.id || '').toLowerCase();
    const vNo = String(rec.voucherNo || '').toLowerCase();
    const classifications: string[] = Array.isArray(rec.testingClassification)
      ? rec.testingClassification
      : [rec.testingClassification].filter(Boolean);

    // Filter questions that match this sample
    let matched = questionnaireQuestions.filter((q: any) => {
      const qSample = String(q.sample_id || '').toLowerCase();
      const qVoucher = String(q.voucher_no || '').toLowerCase();
      if (qSample && (qSample === sId || qSample === vNo)) return true;
      if (qVoucher && (qVoucher === vNo || qVoucher === sId)) return true;
      if (q.scope === 'sample' && !qSample && !qVoucher) return false;
      if (q.scope === 'classification' && q.contextClass && classifications.includes(q.contextClass)) return true;
      if (q.scope === 'all' || !q.scope) return true;
      return false;
    });

    // Also include any questions that have responses recorded
    const itemResponses = rec.questionnaireResponse?.itemResponses || {};
    Object.keys(itemResponses).forEach((qKey) => {
      const alreadyHas = matched.some(m => String(m.id || m.question_id) === String(qKey) || String(m.question_text) === String(qKey));
      if (!alreadyHas) {
        matched.push({
          id: qKey,
          question_id: qKey,
          question_text: qKey,
          scope: 'sample',
          required: true
        });
      }
    });

    return matched;
  };

  const renderAcceptedQuestionnaireDetails = (rec: any) => {
    const qResp = rec.questionnaireResponse;
    const questions = getQuestionsForRecord(rec);
    const itemResponses = qResp?.itemResponses || {};
    const generalFiles: any[] = Array.isArray(qResp?.uploadedFiles) ? qResp.uploadedFiles : [];
    const generalRemarks = qResp?.notes || qResp?.distributorRemarks || '';
    const history: any[] = Array.isArray(qResp?.clarificationHistory) ? qResp.clarificationHistory : [];
    const auditorEmail = qResp?.auditorEmail || 'auditor@data360.io';
    const decisionDate = qResp?.auditorDecisionAt || qResp?.updated_at;

    let totalDocsCount = generalFiles.length;
    Object.values(itemResponses).forEach((item: any) => {
      if (Array.isArray(item?.files)) totalDocsCount += item.files.length;
    });

    return (
      <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-6 text-left">
        {/* Header bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Accepted Evidence
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                Final Review Only • Read-Only
              </span>
              <span className="font-mono text-xs text-indigo-400 font-semibold">
                {rec.testingReference || rec.voucherNo || rec.id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Reviewed &amp; accepted by <strong className="text-slate-200">{auditorEmail}</strong>
              {decisionDate && <span> • {new Date(decisionDate).toLocaleString()}</span>}
              {totalDocsCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">
                  {totalDocsCount} document{totalDocsCount === 1 ? '' : 's'} attached
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFullModalRecord(rec)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Questionnaire Modal</span>
            </button>
            <button
              type="button"
              onClick={() => toggleRowExpand(rec.id)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
            >
              Close Details
            </button>
          </div>
        </div>

        {/* Persisted Questions & Distributor Responses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Persisted Questionnaire &amp; Distributor Responses ({questions.length})
            </h4>
          </div>

          {questions.length === 0 ? (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
              No specific questionnaire items recorded for this sample.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q: any, idx: number) => {
                const qKey = String(q.id || q.question_id || q.question_text);
                const resp = itemResponses[qKey] || itemResponses[q.question_text] || itemResponses[q.id];
                const itemDocs: any[] = Array.isArray(resp?.files) ? resp.files : [];
                const itemRemarks = resp?.remarks;
                const itemDecision = resp?.reviewStatus || 'Accepted';
                const itemAuditor = resp?.auditorEmail || auditorEmail;
                const itemDecisionDate = resp?.auditorDecisionAt || decisionDate;

                return (
                  <div key={qKey + idx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors">
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-100 leading-snug">
                            {q.question_text || q.text || qKey}
                            {q.required && <span className="text-rose-400 ml-1 font-bold">*</span>}
                          </p>
                          {q.help_text && (
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 italic">
                              <Info className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{q.help_text}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Auditor Item Decision Badge */}
                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{itemDecision}</span>
                      </div>
                    </div>

                    {/* Distributor Response Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-indigo-400" /> Distributor Response:
                        </label>
                        <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 min-h-[38px] leading-relaxed">
                          {resp?.answer ? (
                            <span className="font-medium text-slate-100">{resp.answer}</span>
                          ) : (
                            <span className="text-slate-500 italic">No answer provided.</span>
                          )}
                        </div>
                      </div>

                      {/* Distributor Remarks */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <span>Distributor Remarks / Clarifications:</span>
                        </label>
                        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 min-h-[38px] leading-relaxed">
                          {itemRemarks ? (
                            <span>{itemRemarks}</span>
                          ) : (
                            <span className="text-slate-500 italic">No item remarks.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Uploaded Documents for this item */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-emerald-400" />
                        Uploaded Documents ({itemDocs.length}):
                      </label>
                      {itemDocs.length === 0 ? (
                        <div className="p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-lg text-xs text-slate-500 italic">
                          No evidence files attached to this question.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {itemDocs.map((doc: any) => (
                            <div key={doc.id || doc.name} className="p-2.5 bg-slate-900 border border-slate-700/80 rounded-lg flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getFileIcon(doc.name)}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-200 truncate" title={doc.name}>
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500">{doc.size || 'Attached'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(doc)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Review Decision Info */}
                    <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted by {itemAuditor}</span>
                      </div>
                      {itemDecisionDate && (
                        <span className="text-slate-500 font-mono">
                          {new Date(itemDecisionDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* General Supporting Files & Overall Remarks */}
        {(generalRemarks || generalFiles.length > 0) && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              General Supporting Documents &amp; Overall Remarks
            </h4>

            {generalRemarks && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Distributor Overall Remarks:</label>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
                  {generalRemarks}
                </div>
              </div>
            )}

            {generalFiles.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400">General Documents ({generalFiles.length}):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {generalFiles.map((doc: any) => (
                    <div key={doc.id || doc.name} className="p-2.5 bg-slate-900 border border-slate-700/80 rounded-lg flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(doc.name)}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                          <p className="text-[10px] text-slate-500">{doc.size || 'Attached'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(doc)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clarification & Review History Trail */}
        {history.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Clarification &amp; Audit Review History Trail ({history.length})
            </h4>
            <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
              {history.map((h: any, i: number) => (
                <div key={i} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        h.role === 'Auditor' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {h.role || 'User'}
                      </span>
                      <strong className="text-slate-200">{h.action || 'Updated'}</strong>
                    </div>
                    {h.message && <p className="text-slate-400 mt-1 italic">&ldquo;{h.message}&rdquo;</p>}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono shrink-0">
                    {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Sub-Tab Rendering logic
  const renderGLTab = () => (
    <div className="space-y-4">
      {/* GL Population Metric Cards */}
      {mergedRecords.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Transactions</p>
            <p className="text-xl font-bold text-white mt-1">{mergedRecords.length.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Debit</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalGLDebit, currencyMode)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Credit</p>
            <p className="text-xl font-bold text-indigo-400 mt-1">{formatCurrency(totalGLCredit, currencyMode)}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Balance</p>
            <p className="text-xl font-bold text-slate-200 mt-1">{formatCurrency(totalGLBalance, currencyMode)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" /> General Ledger Transactions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select Testing Classifications for each transaction, then click &quot;Save Changes&quot;.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {classificationSaveSuccess && (
            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Testing Classifications saved successfully!
            </span>
          )}
          {classificationSaveError && (
            <span className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 bg-rose-950/60 border border-rose-800 px-3 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> {classificationSaveError}
            </span>
          )}
          {!isDistributor && (
            <button
              onClick={handleSaveAllClassifications}
              disabled={isSavingClassifications || Object.keys(classificationChanges).length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
                Object.keys(classificationChanges).length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 ring-2 ring-emerald-400/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSavingClassifications
                ? 'Saving Changes...'
                : Object.keys(classificationChanges).length > 0
                ? `Save Changes (${Object.keys(classificationChanges).length})`
                : 'Save Changes'}
            </button>
          )}
          <button 
            onClick={() => fetchSamplingWorkspace()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Reload latest population records from database"
          >
            <Database className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            Sync from DB
          </button>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
      <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
        <thead>
          <tr className="bg-slate-950/50 border-b border-slate-800">
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Voucher No</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Account #</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Account Description</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Transaction Description</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Debit</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Credit</th>
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Balance</th>
            {!isDistributor && <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900">Testing Classification</th>}
            <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900 text-center">Final Review Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {mergedRecords.length === 0 ? (
            <tr>
              <td colSpan={isDistributor ? 8 : 10} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Final Review: No Accepted Samples Yet</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sampling Review is reserved for final review of accepted items only. Review evidence and accept submissions in Engagement Workspace → Sampling to view them here.
                  </p>
                  {onNavigateToUpload && (
                    <button
                      onClick={onNavigateToUpload}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" /> Go to Engagement Workspace → Sampling
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            mergedRecords.map((rec, i) => (
              <React.Fragment key={rec.id + i}>
                <tr className="hover:bg-slate-800/30 transition-colors group">
                <td className="py-2.5 px-4 text-slate-300 font-mono text-xs">{rec.date}</td>
                <td className="py-2.5 px-4 font-mono font-medium text-slate-200 text-xs">{rec.voucherNo}</td>
                <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">{rec.accountNumber || '—'}</td>
                <td className="py-2.5 px-4 text-slate-200 font-medium truncate max-w-[180px]" title={rec.accountDescription}>{rec.accountDescription || '—'}</td>
                <td className="py-2.5 px-4 text-slate-300 truncate max-w-[220px]" title={`${rec.description} ${rec.narration && rec.narration !== '—' && rec.narration !== rec.description ? `- ${rec.narration}` : ''}`}>
                  <span>{rec.description}</span>
                  {rec.narration && rec.narration !== '—' && rec.narration !== rec.description && (
                    <span className="block text-[10px] text-slate-500 truncate">{rec.narration}</span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-emerald-400 font-semibold font-mono text-right">
                  {Number(rec.debit) > 0 ? formatCurrency(rec.debit, currencyMode) : '—'}
                </td>
                <td className="py-2.5 px-4 text-indigo-400 font-semibold font-mono text-right">
                  {Number(rec.credit) > 0 ? formatCurrency(rec.credit, currencyMode) : '—'}
                </td>
                <td className="py-2.5 px-4 text-slate-300 font-mono text-right">
                  {rec.balance !== undefined && rec.balance !== null && Number(rec.balance) !== 0 ? formatCurrency(rec.balance, currencyMode) : '—'}
                </td>
                
                {!isDistributor && (
                <td className="py-2.5 px-4 bg-slate-900/40 relative">

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenClassificationId(openClassificationId === rec.id ? null : rec.id);
                    }}
                    className={`flex items-center justify-between w-48 bg-slate-950 border text-xs rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors ${
                      classificationChanges[rec.id] !== undefined
                        ? 'border-amber-500/70 text-amber-200'
                        : rec.testingClassification.length > 0
                        ? 'border-slate-700 text-slate-200'
                        : 'border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate">
                      {rec.testingClassification.length === 0 ? 'Not Selected' :
                       rec.testingClassification.length === 1 ? rec.testingClassification[0] :
                       `${rec.testingClassification.length} Selected`}
                    </span>
                    <span className="text-slate-500 ml-2">▼</span>
                  </button>
                  {openClassificationId === rec.id && (
                    <div 
                      className="absolute z-50 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden text-sm"
                      style={{ right: '0', top: '100%' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3 border-b border-slate-700 font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center justify-between">
                        <span>Testing Classification</span>
                        {classificationChanges[rec.id] !== undefined && (
                          <span className="text-[10px] text-amber-400 font-normal">Unsaved</span>
                        )}
                      </div>
                      <div className="p-3 space-y-3">
                        {['3rd Party Disbursement', 'Employee Disbursement & Reimbursement', 'Sales Testing', 'N/A'].map(opt => {
                          const isSelected = rec.testingClassification.includes(opt);
                          return (
                            <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleClassificationToggle(rec, opt)}
                                className="mt-0.5 shrink-0 rounded border-slate-600 text-indigo-500 focus:ring-indigo-500 bg-slate-900 w-4 h-4 cursor-pointer"
                              />
                              <span className={`text-xs leading-tight ${isSelected ? 'text-white font-medium' : 'text-slate-300 group-hover:text-white'}`}>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="p-2 border-t border-slate-700 bg-slate-900/50 flex justify-between">
                         <button 
                           onClick={() => handleClearClassification(rec)}
                           className="text-xs px-2 py-1 text-slate-400 hover:text-white transition-colors"
                         >
                           Clear
                         </button>
                         <button 
                           onClick={() => setOpenClassificationId(null)}
                           className="text-xs px-3 py-1 font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                         >
                           Done
                         </button>
                      </div>
                    </div>
                  )}
                
                </td>
                )}
                <td className="py-2.5 px-4 bg-slate-900/40 text-center">
                  <div className="flex flex-col items-center gap-1.5 min-w-[170px]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Accepted
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleRowExpand(rec.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${
                          expandedRowIds.has(rec.id)
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700'
                        }`}
                        title="View full accepted questionnaire details, distributor responses, uploaded evidence, and audit decision"
                      >
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>{expandedRowIds.has(rec.id) ? 'Hide Details' : 'View Details'}</span>
                        {expandedRowIds.has(rec.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFullModalRecord(rec)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                        title="Open complete read-only questionnaire modal"
                      >
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                        <span>Modal</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              {expandedRowIds.has(rec.id) && (
                <tr key={`${rec.id}-details`} className="bg-slate-950/80 border-b border-indigo-950/60">
                  <td colSpan={isDistributor ? 9 : 10} className="p-4 md:p-6">
                    {renderAcceptedQuestionnaireDetails(rec)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  const renderTestingTab = (classification: string) => {
    const records = mergedRecords.filter(r => Array.isArray(r.testingClassification) && r.testingClassification.includes(classification));
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> {classification}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {records.length} transaction{records.length === 1 ? '' : 's'} assigned to this testing category.
            </p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">No</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Document ID</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Account #</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Account Description</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Description</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Debit</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-right">Credit</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-center">Testing Status</th>
                <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {records.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-slate-400">No samples assigned to this category.</td></tr>
              ) : (
                records.map((rec, i) => (
                  <tr key={rec.id + i} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">{i + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-indigo-300 text-xs">{rec.testingReference || rec.voucherNo || rec.id}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-mono text-xs">{rec.date}</td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-xs">{rec.accountNumber || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-200 font-medium truncate max-w-[160px]" title={rec.accountDescription}>{rec.accountDescription || '—'}</td>
                    <td className="py-2.5 px-4 text-slate-400 truncate max-w-[200px]" title={rec.description}>{rec.description}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-emerald-400 text-right">
                      {Number(rec.debit) > 0 ? formatCurrency(rec.debit, currencyMode) : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-indigo-400 text-right">
                      {Number(rec.credit) > 0 ? formatCurrency(rec.credit, currencyMode) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${rec.testingStatus === 'Assigned' ? 'bg-blue-500/20 text-blue-400' : 
                          rec.testingStatus === 'Tested' ? 'bg-emerald-500/20 text-emerald-400' : 
                          rec.testingStatus === 'Exception' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-slate-700/50 text-slate-300'}`}>
                        {rec.testingStatus || 'Assigned'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button 
                        onClick={() => openReviewModal(rec, classification)}
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
      </div>
    );
  };

  const renderReviewModal = () => {
    if (!reviewRecord) return null;
    const contextClass = reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification[0] : reviewRecord.testingClassification);
    const relevantCustomQuestions = customQuestions.filter(q => 
       q.contextClass === contextClass && 
       (!q.scope || q.scope === 'classification' || (q.scope === 'sample' && q.sampleId === reviewRecord.id))
    );
    const template = [...(TESTING_TEMPLATES[contextClass] || []), ...relevantCustomQuestions];
    const evidenceFields = EVIDENCE_FIELDS[contextClass] || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                  {reviewRecord._activeClassificationContext || (Array.isArray(reviewRecord.testingClassification) ? reviewRecord.testingClassification.join(', ') : reviewRecord.testingClassification)}
                </span>
                <span className="font-mono text-sm text-slate-400">{reviewRecord.testingReference}</span>
              </div>
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-white">Sample Testing & Attributes</h2>
              </div>
            </div>
            <button onClick={() => setReviewRecord(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* GL Context */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" /> Source GL Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Date</div><div className="text-sm text-slate-200 font-mono">{reviewRecord.date}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Voucher No</div><div className="text-sm text-slate-200 font-mono">{reviewRecord.voucherNo}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Account #</div><div className="text-sm text-slate-200 font-mono">{reviewRecord.accountNumber || '—'}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Account Description</div><div className="text-sm text-slate-200 font-medium">{reviewRecord.accountDescription || '—'}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Debit</div><div className="text-sm font-medium text-emerald-400 font-mono">{formatCurrency(reviewRecord.debit, currencyMode)}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Credit</div><div className="text-sm font-medium text-indigo-400 font-mono">{formatCurrency(reviewRecord.credit, currencyMode)}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Balance</div><div className="text-sm font-medium text-slate-300 font-mono">{formatCurrency(reviewRecord.balance, currencyMode)}</div></div>
                <div className="col-span-2 md:col-span-4"><div className="text-[10px] text-slate-500 uppercase tracking-wider">Description / Narration</div><div className="text-sm text-slate-300">{reviewRecord.description} {reviewRecord.narration && reviewRecord.narration !== '—' && reviewRecord.narration !== reviewRecord.description ? `- ${reviewRecord.narration}` : ''}</div></div>
              </div>
            </div>

            {/* Accepted Questionnaire & Evidence Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Accepted Questionnaire &amp; Distributor Evidence
                </h3>
                <button
                  type="button"
                  onClick={() => setFullModalRecord(reviewRecord)}
                  className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Modal
                </button>
              </div>
              {renderAcceptedQuestionnaireDetails(reviewRecord)}
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
                {template.map((attr: any) => {
                  const type = attr.type || 'Yes / No / N/A';
                  let options: string[] = [];
                  if (type === 'Yes / No') options = ['Yes', 'No'];
                  else if (type === 'Yes / No / N/A' || !attr.type) options = ['Yes', 'No', 'N/A', 'See Comments'];
                  else if (type === 'Single Choice' || type === 'Multiple Choice' || type === 'Checkbox / Multiple Select') options = attr.options || [];
                  else if (type === 'Yes / No + Conditional Follow-up') options = ['Yes', 'No'];
                  
                  return (
                  <div key={attr.id} className="p-4 flex flex-col md:flex-row gap-6 hover:bg-slate-900/50 transition-colors border-b border-slate-800/50 last:border-0">
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                          {attr.attributeCode || attr.id}
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {attr.text}
                            {attr.required && <span className="text-rose-500 ml-1">*</span>}
                          </p>
                          {attr.type && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 block">{attr.type}</span>}
                          {attr.id.startsWith('CQ') && (
                            <div className="flex gap-2 mt-2">
                               <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider">
                                 Edit
                               </button>
                               <button className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 uppercase tracking-wider">
                                 Duplicate
                               </button>
                               <button 
                                 onClick={() => {
                                    if (confirm('Delete this custom question?')) {
                                       fetch('/api/sampling/questions/' + attr.dbId, { method: 'DELETE', headers: { 'x-user-email': currentUser?.email || '' } })
                                         .then(() => setCustomQuestions(prev => prev.filter(q => q.id !== attr.id)));
                                    }
                                 }}
                                 className="text-[10px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-wider"
                               >
                                 Delete
                               </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 md:w-64 shrink-0">
                      
                      {/* Render based on type */}
                      {['Yes / No', 'Yes / No / N/A', 'Yes / No + Conditional Follow-up'].includes(type) && (
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 h-9">
                          {options.map(opt => (
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
                      )}
                      
                      {type === 'Single Choice' && (
                        <select 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-9"
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        >
                          <option value="">Select option...</option>
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                      
                      {(type === 'Multiple Choice' || type === 'Checkbox / Multiple Select') && (
                        <div className="flex flex-col gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
                           {options.map(opt => {
                              const selected = Array.isArray(reviewAnswers[attr.id]?.result) ? reviewAnswers[attr.id].result.includes(opt) : false;
                              return (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-500"
                                    checked={selected}
                                    onChange={(e) => {
                                      let current = Array.isArray(reviewAnswers[attr.id]?.result) ? [...reviewAnswers[attr.id].result] : [];
                                      if (e.target.checked) current.push(opt);
                                      else current = current.filter((v: string) => v !== opt);
                                      setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: current }})
                                    }}
                                  />
                                  <span className="text-xs text-slate-300">{opt}</span>
                                </label>
                              );
                           })}
                        </div>
                      )}
                      
                      {type === 'Text Answer' && (
                        <textarea 
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[60px]"
                          placeholder="Enter response..."
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        />
                      )}
                      
                      {type === 'Number' && (
                        <input 
                          type="number"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-9"
                          placeholder="Enter number..."
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        />
                      )}
                      
                      {type === 'Date' && (
                        <input 
                          type="date"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-9"
                          value={reviewAnswers[attr.id]?.result || ''}
                          onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], result: e.target.value }})}
                        />
                      )}
                      
                      {type === 'File Upload' && (
                        <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-col gap-2">
                           <input type="file" className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-slate-800 file:text-slate-300" />
                        </div>
                      )}

                      <input 
                        type="text"
                        placeholder="Add comment..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        value={reviewAnswers[attr.id]?.comment || ''}
                        onChange={(e) => setReviewAnswers({...reviewAnswers, [attr.id]: { ...reviewAnswers[attr.id], comment: e.target.value }})}
                      />
                    </div>
                  </div>
                );
                })}
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">Sampling Review</h1>
              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Final Review Only
              </span>
            </div>
            <p className="text-slate-400 mt-2">Final Review of Accepted &amp; Tested Transaction Samples</p>
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
                 value={selectedPopulation?.id || selectedPopulation?.googleDriveFileId || ''}
                 onChange={(e) => {
                   const pop = availablePopulations.find(p => p.id === e.target.value || p.googleDriveFileId === e.target.value);
                   if (pop) handleSelectPopulation(pop);
                 }}
               >
                 {availablePopulations.map(p => (
                   <option key={p.id || p.googleDriveFileId} value={p.id || p.googleDriveFileId} className="bg-slate-900 text-white">{p.fileName}</option>
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
        {!isDistributor && (
        <div className="flex gap-2 border-b border-slate-800">
          {[
            { id: 'GL', label: 'General Ledger - Sample' },
            ...(!isDistributor ? [
              { id: '3PD', label: '3rd Party Disbursement' },
              { id: 'EMP', label: 'Employee Disbursement & Reimbursement' },
              { id: 'SALES', label: 'Sales Testing' }
            ] : [])
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
                  {tab.id === '3PD' ? mergedRecords.filter(s => s.testingClassification.includes('3rd Party Disbursement')).length :
                   tab.id === 'EMP' ? mergedRecords.filter(s => s.testingClassification.includes('Employee Disbursement & Reimbursement')).length :
                   mergedRecords.filter(s => s.testingClassification.includes('Sales Testing')).length}
                </span>
              )}
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4">
        {activeTab === 'GL' && renderGLTab()}
        {!isDistributor && activeTab === '3PD' && renderTestingTab('3rd Party Disbursement')}
        {!isDistributor && activeTab === 'EMP' && renderTestingTab('Employee Disbursement & Reimbursement')}
        {!isDistributor && activeTab === 'SALES' && renderTestingTab('Sales Testing')}
      </div>

      {!isDistributor && renderReviewModal()}

      {/* Full Questionnaire Read-Only Modal */}
      {fullModalRecord && (
        <RequiredDataQuestionnaire
          isOpen={true}
          onClose={() => setFullModalRecord(null)}
          targetSampleId={fullModalRecord.sampleId || fullModalRecord.id}
          targetVoucherNo={fullModalRecord.voucherNo && fullModalRecord.voucherNo !== '—' ? fullModalRecord.voucherNo : (fullModalRecord.sampleId || fullModalRecord.id)}
          targetClassification={Array.isArray(fullModalRecord.testingClassification) ? fullModalRecord.testingClassification[0] : fullModalRecord.testingClassification}
          selectedClient={selectedClient}
          distributorName={selectedDistributor}
          engagementId={selectedAuditFilter || 'eng-101'}
          isDistributor={false}
          isAuditor={true}
          isReviewMode={true}
        />
      )}

      {/* Supporting Evidence File Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {getFileIcon(previewDoc.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-md" title={previewDoc.name}>
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {previewDoc.size || 'Supporting Evidence Document'}
                    {previewDoc.uploadDate && ` • Uploaded ${new Date(previewDoc.uploadDate).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-slate-950/40 min-h-[360px]">
              {previewDoc.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc.name) ? (
                <img
                  src={previewDoc.url || previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-slate-800"
                />
              ) : previewDoc.type === 'application/pdf' || previewDoc.name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url || previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-[70vh] rounded-lg border border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                    {getFileIcon(previewDoc.name)}
                  </div>
                  <p className="text-sm font-bold text-slate-200">{previewDoc.name}</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    This file format is best previewed locally or in an external application.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(previewDoc)}
                    className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" /> Download File ({previewDoc.size || 'Attachment'})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
