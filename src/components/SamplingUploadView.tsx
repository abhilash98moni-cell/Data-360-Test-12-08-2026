import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  Download,
  Eye,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  HelpCircle,
  ChevronDown,
  Info,
  Check,
  Send
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserSession } from './AuthModal';
import { RequiredDataQuestionnaire } from './RequiredDataQuestionnaire';
import { CurrencyMode, formatFinancialAmount, getCurrencySymbol } from '../utils/currencyFormatter';
import { getDistributorsForClient } from '../data/clientsAndDistributors';
import { EngagementWorkspaceActionBar } from './EngagementWorkspaceActionBar';
import { executeEngagementPush } from '../services/unifiedEngagementPush';

interface GLRecord {
  id: string;
  originalRow?: number;
  date: string;
  voucherNo: string;
  accountNumber: string;
  accountDescription: string;
  description: string;
  narration?: string;
  debit: number;
  credit: number;
  balance: number;
  [key: string]: any;
}

interface GLMapping {
  date: string;
  voucherNo: string;
  accountNumber: string;
  accountDescription: string;
  description: string;
  narration?: string;
  debit: string;
  credit: string;
  balance?: string;
}

interface SamplingPopulation {
  id: string;
  clientName: string;
  auditId: string;
  auditCode: string;
  distributorName: string;
  requestRef: string;
  requestTitle: string;
  section: string;
  fileName: string;
  fileSizeMB: number;
  fileType: string;
  googleDriveFileId: string;
  uploadedBy: string;
  uploadedDate: string;
  status: string;
  samplingEnabled: boolean;
  glMapping?: any;
  recordCount: number;
  hasParsedRecords: boolean;
}

interface SamplingUploadViewProps {
  selectedClient: string;
  selectedDistributor: string;
  selectedAuditFilter?: string;
  currentUser: UserSession | null;
  currencyMode?: string;
  onNavigateToSamplingReview?: () => void;
  targetVoucherNo?: string | null;
}

export const SamplingUploadView: React.FC<SamplingUploadViewProps> = ({
  selectedClient,
  selectedDistributor,
  selectedAuditFilter,
  currentUser,
  currencyMode: activeCurrencyMode = 'INR',
  onNavigateToSamplingReview,
  targetVoucherNo
}) => {
  const currencyMode: CurrencyMode = (activeCurrencyMode === 'USD' ? 'USD' : 'INR');
  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const [openQuestionnaireFor, setOpenQuestionnaireFor] = useState<GLRecord | null>(null);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<Record<string, any>>({});

  const [activePopulation, setActivePopulation] = useState<SamplingPopulation | null>(null);
  const [availablePopulations, setAvailablePopulations] = useState<SamplingPopulation[]>([]);
  const [records, setRecords] = useState<GLRecord[]>([]);

  useEffect(() => {
    if (targetVoucherNo) {
      const found = records.find(r => r.voucherNo === targetVoucherNo || r.id === targetVoucherNo);
      if (found) {
        setOpenQuestionnaireFor(found);
      } else {
        setOpenQuestionnaireFor({
          id: targetVoucherNo,
          date: new Date().toISOString().split('T')[0],
          accountNumber: 'GL-REQ',
          accountDescription: 'Sampling Transaction Required Data',
          description: `Transaction / Voucher #${targetVoucherNo}`,
          voucherNo: targetVoucherNo,
          narration: `Audit sampling transaction for voucher #${targetVoucherNo}`,
          debit: 0,
          credit: 0,
          balance: 0,
          currency: currencyMode
        });
      }
    }
  }, [targetVoucherNo, records]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const targetDistributorName = (selectedDistributor && selectedDistributor !== 'All Distributors')
    ? selectedDistributor
    : (activePopulation?.distributorName || 'Distributor');

  const activeDistributors = React.useMemo(() => {
    return getDistributorsForClient(selectedClient || 'Apex Electronics Corp');
  }, [selectedClient]);

  // Row Selection State for granular / single / multi push
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Add Custom Sample Request Modal State
  const [isAddSampleModalOpen, setIsAddSampleModalOpen] = useState<boolean>(false);
  const [newSampleForm, setNewSampleForm] = useState({
    voucherNo: '',
    accountNumber: 'GL-6100',
    accountDescription: 'Promotional Marketing & Distribution',
    description: '',
    narration: '',
    amount: '10000',
    date: new Date().toISOString().substring(0, 10)
  });

  const clarificationCount = React.useMemo(() => {
    return Object.values(questionnaireResponses || {}).filter(
      (r: any) => r?.status === 'Clarification Required' || r?.status === 'Rejected'
    ).length;
  }, [questionnaireResponses]);

  const handleToggleRowSelect = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === filteredRecords.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredRecords.map(r => r.id || r.voucherNo)));
    }
  };

  // Add Custom Item Handler
  const handleAddCustomSampleItem = () => {
    const voucher = newSampleForm.voucherNo.trim() || `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const desc = newSampleForm.description.trim() || 'Custom audit sampling request item';
    const numAmt = parseFloat(newSampleForm.amount) || 0;

    const newRecord: GLRecord = {
      id: `custom-sample-${Date.now()}`,
      date: newSampleForm.date || new Date().toISOString().substring(0, 10),
      voucherNo: voucher,
      accountNumber: newSampleForm.accountNumber.trim() || 'GL-6100',
      accountDescription: newSampleForm.accountDescription.trim() || 'Audit Sample Test Item',
      description: desc,
      narration: newSampleForm.narration.trim() || desc,
      debit: numAmt,
      credit: 0,
      balance: numAmt
    };

    setRecords(prev => [newRecord, ...prev]);
    // Automatically select the new record so auditor can immediately push it if they want
    setSelectedRowIds(prev => new Set([...prev, newRecord.id]));
    setIsAddSampleModalOpen(false);
    setNewSampleForm({
      voucherNo: '',
      accountNumber: 'GL-6100',
      accountDescription: 'Promotional Marketing & Distribution',
      description: '',
      narration: '',
      amount: '10000',
      date: new Date().toISOString().substring(0, 10)
    });
    showToast('success', `Custom sample item "${voucher}" added. You can push it to ${targetDistributorName} whenever you choose.`);
  };

  // Unified Push to Selected Distributor
  const handlePushToDistributor = async () => {
    setIsPushing(true);
    try {
      const candidateRecords = selectedRowIds.size > 0
        ? records.filter(r => selectedRowIds.has(r.id) || selectedRowIds.has(r.voucherNo))
        : records;

      const items = candidateRecords.length > 0
        ? candidateRecords.map(r => ({
            sampleId: r.id,
            voucherNo: r.voucherNo || r.id,
            accountDescription: r.accountDescription,
            amount: r.debit || r.credit || r.balance || 0
          }))
        : [{
            sampleId: `sample-init-1`,
            voucherNo: `TX-INIT-01`,
            accountDescription: 'General Sampling & Fieldwork Documentation Request',
            amount: 0
          }];

      const res = await executeEngagementPush({
        tab: 'sampling',
        action: 'push_single',
        client: selectedClient || 'Apex Electronics Corp',
        targetDistributor: targetDistributorName,
        allDistributors: activeDistributors,
        data: {
          engagementId: selectedAuditFilter || 'eng-101',
          items
        },
        currentUser
      });

      if (res.success) {
        await fetchQuestionnaireResponses();
        window.dispatchEvent(new CustomEvent('notification-updated'));
        showToast('success', `Questionnaire and required data successfully pushed to ${targetDistributorName} (${items.length} items synced)!`);
      } else {
        showToast('error', res.message || `Failed to push questionnaire to ${targetDistributorName}.`);
      }
    } catch (err: any) {
      console.error('Error pushing questionnaire to distributor:', err);
      showToast('error', `Error pushing questionnaire to ${targetDistributorName}: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // Unified Push to ALL Distributors
  const handlePushToAllDistributors = async () => {
    setIsPushing(true);
    try {
      const candidateRecords = selectedRowIds.size > 0
        ? records.filter(r => selectedRowIds.has(r.id) || selectedRowIds.has(r.voucherNo))
        : records;

      const items = candidateRecords.length > 0
        ? candidateRecords.map(r => ({
            sampleId: r.id,
            voucherNo: r.voucherNo || r.id,
            accountDescription: r.accountDescription,
            amount: r.debit || r.credit || r.balance || 0
          }))
        : [{
            sampleId: `sample-init-1`,
            voucherNo: `TX-INIT-01`,
            accountDescription: 'General Sampling & Fieldwork Documentation Request',
            amount: 0
          }];

      const res = await executeEngagementPush({
        tab: 'sampling',
        action: 'push_all',
        client: selectedClient || 'Apex Electronics Corp',
        targetDistributor: targetDistributorName,
        allDistributors: activeDistributors,
        data: {
          engagementId: selectedAuditFilter || 'eng-101',
          items
        },
        currentUser
      });

      if (res.success) {
        await fetchQuestionnaireResponses();
        window.dispatchEvent(new CustomEvent('notification-updated'));
        showToast('success', `Questionnaire and required data successfully pushed to ALL (${activeDistributors.length}) Distributors (${items.length} items per account)!`);
      } else {
        showToast('error', res.message || 'Failed to push questionnaire to all distributors.');
      }
    } catch (err: any) {
      console.error('Error pushing questionnaire to all distributors:', err);
      showToast('error', `Error pushing to all distributors: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // Unified Send Clarifications Back
  const handleSendClarificationsBack = async () => {
    if (clarificationCount === 0) {
      showToast('info', 'No sampling items are currently flagged for Clarification or Rejection.');
      return;
    }

    setIsPushing(true);
    try {
      const clarificationItems = records.filter(r => {
        const resp = questionnaireResponses[String(r.id || '').toLowerCase()] ||
                     questionnaireResponses[String(r.voucherNo || '').toLowerCase()] ||
                     questionnaireResponses[r.id] ||
                     questionnaireResponses[r.voucherNo];
        return resp?.status === 'Clarification Required' || resp?.status === 'Rejected';
      });

      const res = await executeEngagementPush({
        tab: 'sampling',
        action: 'send_clarifications',
        client: selectedClient || 'Apex Electronics Corp',
        targetDistributor: targetDistributorName,
        allDistributors: activeDistributors,
        clarificationCount,
        data: {
          engagementId: selectedAuditFilter || 'eng-101',
          items: clarificationItems
        },
        currentUser
      });

      if (res.success) {
        await fetchQuestionnaireResponses();
        window.dispatchEvent(new CustomEvent('notification-updated'));
        showToast('success', `${clarificationCount} sampling item(s) sent back to ${targetDistributorName} with reviewer notes.`);
      } else {
        showToast('error', res.message || 'Failed to send clarifications.');
      }
    } catch (err: any) {
      console.error('Error sending clarifications back:', err);
      showToast('error', `Error sending clarifications back: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // Mapping Modal State
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<GLMapping>({
    date: '',
    voucherNo: '',
    accountNumber: '',
    accountDescription: '',
    description: '',
    narration: '',
    debit: '',
    credit: '',
    balance: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencySymbol = getCurrencySymbol(currencyMode);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch Questionnaire Responses for status badges and persistence
  const fetchQuestionnaireResponses = async () => {
    try {
      const res = await fetch('/api/sampling/required-data/responses', {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.responses)) {
        const map: Record<string, any> = {};
        data.responses.forEach((r: any) => {
          if (r.sample_id) {
            map[r.sample_id] = r;
          }
          if (r.voucher_no) {
            map[r.voucher_no] = r;
          }
          if (r.voucherNo) {
            map[r.voucherNo] = r;
          }
        });
        setQuestionnaireResponses(map);
      }
    } catch (e) {
      console.error('Error fetching questionnaire responses:', e);
    }
  };

  // Fetch Authoritative Population & Records from Backend
  const loadPopulationData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch available populations from database
      const distParam = encodeURIComponent(selectedDistributor || 'All Distributors');
      const auditParam = encodeURIComponent(selectedAuditFilter || 'All Audits');
      const clientParam = encodeURIComponent(selectedClient || 'All Clients');

      const popRes = await fetch(`/api/sampling/populations?distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`);
      const popData = await popRes.json();
      
      const populations: SamplingPopulation[] = (popData.success && Array.isArray(popData.populations)) ? popData.populations : [];
      setAvailablePopulations(populations);

      // 2. Fetch active sampling state
      const stateRes = await fetch(`/api/sampling/state?distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`);
      const stateData = await stateRes.json();
      const activePopId = stateData.success && stateData.state ? stateData.state.activePopulationId : null;

      // 3. Determine active population
      let targetPop = populations.find(p => p.id === activePopId || p.googleDriveFileId === activePopId);
      if (!targetPop && populations.length > 0) {
        targetPop = populations[0];
      }

      setActivePopulation(targetPop || null);

      // 4. Fetch population records
      const targetId = targetPop ? (targetPop.googleDriveFileId || targetPop.id) : activePopId;
      const recRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(targetId || '')}&distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`);
      const recData = await recRes.json();

      if (recData.success && Array.isArray(recData.records)) {
        const mappedRecords: GLRecord[] = recData.records.map((r: any, idx: number) => ({
          ...r,
          id: r.id || r.sampleId || r.voucherNo || `TX-${idx + 1}`
        }));
        setRecords(mappedRecords);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.error('Failed to load sampling population:', err);
      showToast('error', 'Could not sync population data with the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPopulationData();
    fetchQuestionnaireResponses();
  }, [selectedDistributor, selectedClient, selectedAuditFilter]);

  // Handle Switch Active Population
  const handleSwitchPopulation = async (popId: string) => {
    const selected = availablePopulations.find(p => p.id === popId || p.googleDriveFileId === popId);
    if (!selected) return;

    setIsLoading(true);
    try {
      const fileId = selected.googleDriveFileId || selected.id;
      // Persist active population state in database
      await fetch('/api/sampling/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributorId: selectedDistributor,
          auditId: selectedAuditFilter || 'eng-101',
          clientName: selectedClient,
          activePopulationId: fileId,
          activePopulationName: selected.fileName,
          activeTab: 'GL'
        })
      });

      setActivePopulation(selected);

      // Fetch records for this population
      const distParam = encodeURIComponent(selectedDistributor || 'All Distributors');
      const auditParam = encodeURIComponent(selectedAuditFilter || 'All Audits');
      const recRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(fileId)}&distributorId=${distParam}&auditId=${auditParam}`);
      const recData = await recRes.json();

      if (recData.success && Array.isArray(recData.records)) {
        setRecords(recData.records);
        showToast('success', `Active population switched to "${selected.fileName}" and persisted to database.`);
      }
    } catch (err) {
      showToast('error', 'Failed to switch active population.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle File Selection and Mapping Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      showToast('error', 'Please upload a valid Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setPendingFile(file);

    // Read headers & first 5 rows for column mapping preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

        if (!json || json.length === 0) {
          showToast('error', 'The uploaded spreadsheet is empty.');
          return;
        }

        const headers = Object.keys(json[0] || {});
        setFileHeaders(headers);
        setPreviewRows(json.slice(0, 5));

        // Auto-detect columns intelligently with exact-match precedence
        const findHeader = (exactCandidates: string[], partialCandidates: string[] = []) => {
          // 1. Exact match (case & whitespace stripped)
          for (const h of headers) {
            const clean = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            for (const c of exactCandidates) {
              if (clean === c) return h;
            }
          }
          // 2. Exact word match
          for (const h of headers) {
            const words = h.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
            for (const c of exactCandidates) {
              if (words.includes(c)) return h;
            }
          }
          // 3. Safe partial candidates only
          for (const h of headers) {
            const clean = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            for (const c of partialCandidates) {
              if (clean.includes(c)) return h;
            }
          }
          return '';
        };

        const detectedMapping: GLMapping = {
          date: findHeader(
            ['date', 'txndate', 'transactiondate', 'invoicedate', 'postingdate', 'docdate', 'transdate', 'entrydate', 'voucherdate', 'valuedate', 'billdate', 'datetime'],
            ['txndate', 'transactiondate', 'invoicedate', 'postingdate', 'entrydate']
          ) || (headers.find(h => h.toLowerCase().includes('date')) || headers[0] || ''),

          voucherNo: findHeader(
            ['voucherno', 'vouchernum', 'voucher', 'referenceno', 'referencenum', 'refno', 'refnum', 'reference', 'txnid', 'transactionid', 'documentno', 'docno', 'invoiceno', 'invoicenumber', 'docid', 'slno', 'serialno', 'id', 'transid', 'billno', 'ref'],
            ['referenceno', 'transactionid', 'documentno', 'invoiceno']
          ) || '',

          accountNumber: findHeader(
            ['accountnumber', 'accountno', 'accountnum', 'accno', 'accnum', 'acctno', 'acctnum', 'glaccount', 'glcode', 'accountcode', 'acccode', 'glacct', 'acct', 'acc', 'account'],
            ['accountnumber', 'accountno', 'glaccount', 'accountcode']
          ) || '',

          accountDescription: findHeader(
            ['accountdescription', 'accountdesc', 'accountname', 'accounttitle', 'headofaccount', 'ledgername', 'ledger', 'glname', 'gldescription', 'accounthead', 'acctname', 'accdesc'],
            ['accountdescription', 'accountname', 'accounttitle', 'ledgername', 'headofaccount']
          ) || '',

          description: findHeader(
            ['description', 'transactiondescription', 'txndescription', 'txndesc', 'itemdescription', 'particulars', 'narration', 'memo', 'details', 'detail', 'remarks', 'purpose', 'notes', 'lineitem', 'item', 'payee', 'vendor', 'customer'],
            ['particulars', 'transactiondescription', 'itemdescription']
          ) || '',

          narration: findHeader(
            ['narration', 'remarks', 'comment', 'comments', 'notes', 'memo', 'longdescription'],
            ['narration', 'remarks']
          ) || '',

          debit: findHeader(
            ['debit', 'debitamount', 'debits', 'debitamt', 'dramount', 'dramt', 'dr', 'debitinr', 'debitusd', 'drinr', 'drusd'],
            ['debitamount', 'debitamt', 'dramount']
          ) || '',

          credit: findHeader(
            ['credit', 'creditamount', 'credits', 'creditamt', 'cramount', 'cramt', 'cr', 'creditinr', 'creditusd', 'crinr', 'crusd'],
            ['creditamount', 'creditamt', 'cramount']
          ) || '',

          balance: findHeader(
            ['balance', 'closingbalance', 'runningbalance', 'netamount', 'netbalance', 'bal', 'closingbal', 'balanceamount', 'cumbalance'],
            ['closingbalance', 'runningbalance', 'netbalance', 'balanceamount']
          ) || ''
        };

        setColumnMapping(detectedMapping);
        setShowMappingModal(true);
      } catch (err) {
        console.error('Error parsing spreadsheet preview:', err);
        showToast('error', 'Error reading spreadsheet structure.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Confirm Mapping and Execute Direct Database Upload
  const handleConfirmMappingAndUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('clientName', selectedClient);
      formData.append('distributorName', selectedDistributor);
      formData.append('auditId', selectedAuditFilter || 'eng-101');
      formData.append('auditCode', 'AUD-2026-001');
      formData.append('auditPeriod', 'FY 2025-26');
      formData.append('glMapping', JSON.stringify(columnMapping));

      setUploadProgress(50);

      const res = await fetch('/api/sampling/upload', {
        method: 'POST',
        headers: {
          'x-user-email': currentUser?.email || 'auditor@data360.com',
          'x-user-name': currentUser?.name || 'Sarah Jenkins',
          'x-user-role': currentUser?.role || 'Auditor'
        },
        body: formData
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);
      setShowMappingModal(false);
      setPendingFile(null);

      showToast('success', `General Ledger population "${data.fileName}" uploaded and persisted successfully (${data.recordCount} records). Automatically synchronized to Sampling Review.`);

      // Reload database state
      await loadPopulationData();
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast('error', err.message || 'Failed to upload and persist GL population to database.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const sampleHeaders = [
      ['Date', 'VoucherNo', 'AccountNumber', 'AccountDescription', 'Description', 'Narration', 'Debit', 'Credit', 'Balance']
    ];
    const sampleData = [
      ['2026-04-03', 'TX-8041', 'GL-6100', 'Professional & Legal Fees', 'Quarterly compliance advisory - Baker & McKenzie', 'Retainer fee for audit support', 48500.00, 0, 48500.00],
      ['2026-04-12', 'TX-8042', 'GL-6250', 'Staff Travel & Reimbursements', 'Executive regional travel - John Davis', 'Lodging and flight tickets for site audit', 3420.50, 0, 51920.50],
      ['2026-04-18', 'TX-8043', 'GL-4010', 'Commercial Product Revenue', 'Apex bulk shipment order - PO #ORD-99120', 'Batch dispatch for Midwest distributor network', 0, 128450.00, -76529.50],
      ['2026-05-02', 'TX-8044', 'GL-6150', 'Third Party Logistics & Freight', 'Intermodal freight shipment - FastTrack Inc', 'Detroit warehouse container movement', 19800.00, 0, -56729.50],
      ['2026-05-15', 'TX-8045', 'GL-6250', 'Staff Travel & Reimbursements', 'Field training accommodation - Elena Rostova', 'On-site technical training sessions', 1845.00, 0, -54884.50]
    ];

    const ws = XLSX.utils.aoa_to_sheet([...sampleHeaders, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'General_Ledger_Template');
    XLSX.writeFile(wb, 'Data360_GL_Population_Template.xlsx');
  };

  // Filtered Records
  const uniqueAccounts = Array.from(new Set(records.map(r => r.accountDescription || r.accountNumber).filter(Boolean)));

  const filteredRecords = records.filter(r => {
    const matchesSearch = !searchQuery ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.voucherNo && r.voucherNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.accountNumber && r.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.accountDescription && r.accountDescription.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAccount = accountFilter === 'ALL' ||
      (r.accountDescription === accountFilter || r.accountNumber === accountFilter);

    return matchesSearch && matchesAccount;
  });

  const totalDebit = records.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalCredit = records.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-lg transition-all ${
          notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' :
          notification.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-300' :
          'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-red-400" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>
      )}

      {/* Area 1 Banner: General Ledger Population Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wide">
                Engagement Workspace • Population Intake
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">Authoritative Database Storage</span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
              General Ledger Population Management
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Upload, map, and prepare complete General Ledger populations for audit testing. Files uploaded here are automatically saved to the database and instantly available in <strong className="text-indigo-300 font-semibold">Sampling Review</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isDistributor && (
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Sample GL Template</span>
              </button>
            )}

            <button
              onClick={() => {
                loadPopulationData();
                fetchQuestionnaireResponses();
              }}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow"
              title="Refresh from Database"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync DB</span>
            </button>

            {!isDistributor && (
              <EngagementWorkspaceActionBar
                tab="sampling"
                viewRole="Auditor"
                activeDistributorName={targetDistributorName}
                allDistributorsCount={activeDistributors.length}
                clarificationCount={clarificationCount}
                isPushing={isPushing}
                pushSingleLabel={
                  selectedRowIds.size > 0
                    ? `Push Selected (${selectedRowIds.size}) to ${targetDistributorName}`
                    : `Push to ${targetDistributorName}`
                }
                onCustomize={() => setIsAddSampleModalOpen(true)}
                onPushToDistributor={handlePushToDistributor}
                onPushToAllDistributors={handlePushToAllDistributors}
                onSendClarificationsBack={handleSendClarificationsBack}
                extraActions={
                  onNavigateToSamplingReview && (
                    <button
                      onClick={onNavigateToSamplingReview}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Go to Sampling Review</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Step 1: Upload GL Population Dropzone & Status Card Grid (Auditor Only) */}
      {!isDistributor && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Drag & Drop Upload Zone */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <h3 className="text-sm font-bold text-white">Upload General Ledger File</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">.XLSX, .XLS, .CSV</span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Upload your company's full year General Ledger or transaction register. The system will open the Column Mapping interface to standardize headers.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processSelectedFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-6 text-center cursor-pointer transition-all group relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center transition-all shadow-inner">
                  <UploadCloud className="h-6 w-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                    Click to select file or drag & drop here
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 50MB
                  </p>
                </div>
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                  <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mb-2" />
                  <p className="text-xs font-bold text-white">Saving to database...</p>
                  <div className="w-48 bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              Direct database storage (persists on reload)
            </span>
            <span className="text-indigo-400 font-semibold cursor-pointer hover:underline" onClick={handleDownloadTemplate}>
              Download Sample Format
            </span>
          </div>
        </div>

        {/* Right Column: Active GL Population Status */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <h3 className="text-sm font-bold text-white">Active General Ledger Population</h3>
              </div>
              
              {availablePopulations.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Switch:</span>
                  <select
                    value={activePopulation?.googleDriveFileId || activePopulation?.id || ''}
                    onChange={(e) => handleSwitchPopulation(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    {availablePopulations.map(p => (
                      <option key={p.id} value={p.googleDriveFileId || p.id}>
                        {p.fileName} ({p.recordCount} rows)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activePopulation ? (
              <div className="space-y-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate max-w-[240px] sm:max-w-[320px]">
                          {activePopulation.fileName}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Population
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Uploaded by <strong className="text-slate-300">{activePopulation.uploadedBy || 'Auditor'}</strong> on {activePopulation.uploadedDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-300">{activePopulation.fileSizeMB || 1.5} MB</span>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Rows</p>
                    <p className="text-base font-bold text-white mt-0.5">{records.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Debit</p>
                    <p className="text-base font-bold text-emerald-400 mt-0.5">
                      {formatFinancialAmount(totalDebit, currencyMode)}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Credit</p>
                    <p className="text-base font-bold text-indigo-400 mt-0.5">
                      {formatFinancialAmount(totalCredit, currencyMode)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/50 border border-dashed border-slate-800 rounded-xl">
                <AlertCircle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-300">No Active GL Population Loaded</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload an Excel or CSV file in Step 1 to prepare your General Ledger population.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {selectedDistributor} • {selectedClient}
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready for Sampling
            </span>
          </div>
        </div>
      </div>
      )}

      {/* Imported General Ledger Records Table (Clean, Upload-Only Table — Zero Classification UI) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              Imported General Ledger Transactions
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {filteredRecords.length} of {records.length} transactions
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review imported entries and verify voucher references before conducting sampling classification in Sampling Review.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transactions, accounts, vouchers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>

            {/* Account Filter */}
            {uniqueAccounts.length > 0 && (
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[160px]"
              >
                <option value="ALL">All Accounts</option>
                {uniqueAccounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Records Table View */}
        <div className="overflow-x-auto max-h-[500px]">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
              <p className="text-xs">Loading population transactions from database...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-400">No transactions match the search filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold text-[11px] sticky top-0 z-10 backdrop-blur-md">
                  {!isDistributor && (
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={filteredRecords.length > 0 && selectedRowIds.size === filteredRecords.length}
                        onChange={handleToggleSelectAll}
                        title="Select All Transactions"
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="py-2.5 px-3 w-12">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Voucher / Ref #</th>
                  <th className="py-2.5 px-3">Account #</th>
                  <th className="py-2.5 px-3">Account Description</th>
                  <th className="py-2.5 px-3">Transaction Description & Narration</th>
                  <th className="py-2.5 px-3 text-right">Debit</th>
                  <th className="py-2.5 px-3 text-right">Credit</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center font-extrabold text-indigo-300 uppercase tracking-wider whitespace-nowrap bg-slate-900/90">
                    REQUIRED DATA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredRecords.map((row, idx) => {
                  const isSelected = selectedRowIds.has(row.id) || selectedRowIds.has(row.voucherNo);
                  return (
                    <tr key={row.id || idx} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-950/30' : ''}`}>
                      {!isDistributor && (
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(row.id || row.voucherNo)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-slate-500 font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans whitespace-nowrap">{row.date || '—'}</td>
                    <td className="py-2.5 px-3 text-indigo-300 font-semibold whitespace-nowrap">{row.voucherNo || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.accountNumber || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{row.accountDescription || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans max-w-xs truncate" title={`${row.description} ${row.narration || ''}`}>
                      <span className="font-medium text-white">{row.description}</span>
                      {row.narration && row.narration !== row.description && (
                        <span className="block text-[10px] text-slate-400 truncate">{row.narration}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold whitespace-nowrap">
                      {Number(row.debit) > 0 ? formatFinancialAmount(row.debit, currencyMode) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-400 font-semibold whitespace-nowrap">
                      {Number(row.credit) > 0 ? formatFinancialAmount(row.credit, currencyMode) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      {row.balance !== undefined && row.balance !== null && Number(row.balance) !== 0 ? formatFinancialAmount(row.balance, currencyMode) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-950/20">
                      {(() => {
                        const cleanKey1 = String(row.id || '').toLowerCase();
                        const cleanKey2 = String(row.voucherNo || '').toLowerCase();
                        const cleanKey3 = String(row.sampleId || '').toLowerCase();
                        const resp = questionnaireResponses[cleanKey1] || questionnaireResponses[cleanKey2] || questionnaireResponses[cleanKey3] ||
                                     questionnaireResponses[row.id] || questionnaireResponses[row.voucherNo] || questionnaireResponses[row.sampleId];
                        const st = resp?.status;
                        const isAccepted = st === 'Accepted';
                        const isCompleted = st === 'Completed' || st === 'Submitted';
                        const isClarification = st === 'Clarification Required';
                        const isRejected = st === 'Rejected';
                        const isDraft = st === 'Draft';
                        const isPushed = resp?.is_pushed || resp?.isPushed;

                        const buttonClass = isAccepted
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                          : isRejected
                          ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
                          : isClarification
                          ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                          : isCompleted
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30'
                          : isDraft
                          ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                          : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm';

                        return (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenQuestionnaireFor(row);
                              }}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${buttonClass}`}
                              title="Open Required Data Questionnaire"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Questionnaire</span>
                            </button>
                            {st ? (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                st === 'Accepted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : st === 'Clarification Required'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : st === 'Rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : st === 'Submitted'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {st === 'Clarification Required' ? 'Clarification' : st}
                              </span>
                            ) : isPushed ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                                Pushed
                              </span>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Displaying <strong className="text-white">{filteredRecords.length}</strong> of <strong className="text-white">{records.length}</strong> transactions
          </span>
          <span className="text-[11px] text-slate-500">
            {isDistributor ? (
              <span>Provide required transaction evidence and questionnaire responses for audit attribute verification.</span>
            ) : (
              <span>For audit attribute testing and sample selection, navigate to <strong className="text-indigo-400 font-semibold">Sampling Review</strong> in the main navigation.</span>
            )}
          </span>
        </div>
      </div>

      {/* Column Mapping Modal */}
      {showMappingModal && pendingFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">General Ledger Column Mapping</h3>
                  <p className="text-[11px] text-slate-400">Standardize your spreadsheet column headers for database ingestion</p>
                </div>
              </div>
              <button
                onClick={() => { setShowMappingModal(false); setPendingFile(null); }}
                className="text-slate-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5">
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-200">
                <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Auto-Detection Completed</p>
                  <p className="text-[11px] text-indigo-300/90 mt-0.5">
                    We inspected <strong className="text-white font-mono">{pendingFile.name}</strong> and auto-matched the columns below. Review and adjust if necessary.
                  </p>
                </div>
              </div>

              {/* Column Mapping Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date Column *</label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Voucher / Reference # *</label>
                  <select
                    value={columnMapping.voucherNo}
                    onChange={(e) => setColumnMapping({ ...columnMapping, voucherNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Account Number</label>
                  <select
                    value={columnMapping.accountNumber}
                    onChange={(e) => setColumnMapping({ ...columnMapping, accountNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Account Description *</label>
                  <select
                    value={columnMapping.accountDescription}
                    onChange={(e) => setColumnMapping({ ...columnMapping, accountDescription: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Transaction Description *</label>
                  <select
                    value={columnMapping.description}
                    onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Narration / Remarks</label>
                  <select
                    value={columnMapping.narration || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, narration: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">Debit Amount *</label>
                  <select
                    value={columnMapping.debit}
                    onChange={(e) => setColumnMapping({ ...columnMapping, debit: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-400 mb-1">Credit Amount *</label>
                  <select
                    value={columnMapping.credit}
                    onChange={(e) => setColumnMapping({ ...columnMapping, credit: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Column --</option>
                    {fileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Sample Data Preview */}
              <div>
                <h4 className="text-xs font-bold text-white mb-2">First 5 Rows Preview</h4>
                <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-48 bg-slate-950/80">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0">
                      <tr>
                        {fileHeaders.map(h => (
                          <th key={h} className="p-2 whitespace-nowrap border-b border-slate-800">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {previewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          {fileHeaders.map(h => (
                            <td key={h} className="p-2 whitespace-nowrap text-slate-300">{row[h] !== undefined ? String(row[h]) : ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                onClick={() => { setShowMappingModal(false); setPendingFile(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmMappingAndUpload}
                disabled={isUploading || !columnMapping.date || !columnMapping.debit || !columnMapping.credit}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Uploading & Persisting to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirm Mapping & Import GL Population</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Required Data Questionnaire Modal for Transaction */}
      {openQuestionnaireFor && (
        <RequiredDataQuestionnaire
          transaction={openQuestionnaireFor}
          engagementId={selectedAuditFilter || 'eng-101'}
          currentUser={currentUser}
          isDistributorWorkflow={isDistributor}
          currencyMode={currencyMode}
          selectedDistributor={selectedDistributor}
          selectedClient={selectedClient}
          onClose={() => {
            setOpenQuestionnaireFor(null);
            fetchQuestionnaireResponses();
          }}
        />
      )}

      {/* Customize / Add Request Item Modal */}
      {isAddSampleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Customize / Add Sampling Request Item</h3>
                  <p className="text-[11px] text-slate-400">Add an ad-hoc or custom transaction sample to push to {targetDistributorName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSampleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Voucher / Ref Number *</label>
                  <input
                    type="text"
                    value={newSampleForm.voucherNo}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, voucherNo: e.target.value })}
                    placeholder="e.g. TX-8099"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSampleForm.date}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">GL Account #</label>
                  <input
                    type="text"
                    value={newSampleForm.accountNumber}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, accountNumber: e.target.value })}
                    placeholder="e.g. GL-6100"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    value={newSampleForm.amount}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Account Description</label>
                <input
                  type="text"
                  value={newSampleForm.accountDescription}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, accountDescription: e.target.value })}
                  placeholder="e.g. Promotional Marketing & Distribution Expenses"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Transaction Description / Scope *</label>
                <input
                  type="text"
                  value={newSampleForm.description}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, description: e.target.value })}
                  placeholder="e.g. Promotional event invoice testing & supporting receipts"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Required Evidence / Narration</label>
                <textarea
                  rows={2}
                  value={newSampleForm.narration}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, narration: e.target.value })}
                  placeholder="Provide guidance to the distributor on what documents or evidence to attach..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddSampleModalOpen(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomSampleItem}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Add to Population</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
