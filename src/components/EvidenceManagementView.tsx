import React, { useState, useEffect } from 'react';
import { downloadFileFromApi } from '../lib/downloadHelper';
import { 
  FolderArchive,
  Database, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  FileText, 
  Download, 
  Eye, 
  History, 
  MessageSquare, 
  ShieldCheck, 
  Building2, 
  Tag, 
  Calendar, 
  User, 
  ArrowUpRight,
  ChevronDown,
  AlertTriangle,
  Send,
  Lock,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  ExternalLink,
  PieChart,
  Info,
  Check,
  File
} from 'lucide-react';
import { EvidenceRecord, UserSession } from '../types';
import { SamplingView } from './SamplingView';

interface EvidenceManagementViewProps {
  currentUser: UserSession | null;
  selectedClient?: string;
  selectedDistributor?: string;
  defaultAuditFilter?: string;
  defaultMode?: 'All Evidence' | 'Sampling Eligible';
}

interface EvidenceVersionHistoryItem {
  id: string;
  version: number;
  fileName: string;
  fileSizeMB: number;
  uploader?: string;
  uploadedBy: string;
  uploadedDate: string;
  status: string;
  reviewerComment?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

export const EvidenceManagementView: React.FC<EvidenceManagementViewProps> = ({
  currentUser,
  selectedClient = 'All Clients',
  selectedDistributor = 'All Distributors',
  defaultAuditFilter = 'All Audits',
  defaultMode = 'All Evidence'
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    if (defaultMode) {
      setEvidenceMode(defaultMode);
    }
  }, [defaultMode]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'All' | 'PENDING_REVIEW' | 'ACCEPTED' | 'CLARIFICATION_REQUIRED' | 'REJECTED'>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('All');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('All Sources');
  const [selectedAuditFilter, setSelectedAuditFilter] = useState<string>(defaultAuditFilter);
  useEffect(() => {
    setSelectedAuditFilter(defaultAuditFilter);
  }, [defaultAuditFilter]);
  const [activeMainTab, setActiveMainTab] = useState<'list' | 'upload'>('list');
  const [evidenceMode, setEvidenceMode] = useState<'All Evidence' | 'Sampling'>(defaultMode === 'Sampling Eligible' ? 'Sampling' : (defaultMode as 'All Evidence' | 'Sampling'));
  
  // Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDistributor, setUploadDistributor] = useState<string>('');
  const [uploadEngagement, setUploadEngagement] = useState<string>(defaultAuditFilter || 'eng-101');
  const [uploadAuditPeriod, setUploadAuditPeriod] = useState<string>('FY 2025-26');
  const [uploadDocType, setUploadDocType] = useState<string>('Expense Register');
  const [uploadDocUsage, setUploadDocUsage] = useState<string[]>(['EVIDENCE']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  
  // Modal & Detail Review State
  const [selectedRecord, setSelectedRecord] = useState<EvidenceRecord | null>(null);
  const [reviewerCommentInput, setReviewerCommentInput] = useState('');
  const [modalDocUsage, setModalDocUsage] = useState<string[]>([]);
  const [samplingModalRecord, setSamplingModalRecord] = useState<EvidenceRecord | null>(null);
  const [isAddingSampling, setIsAddingSampling] = useState(false);
  const [samplingSuccessRecord, setSamplingSuccessRecord] = useState<EvidenceRecord | null>(null);
  const [isUpdatingUsage, setIsUpdatingUsage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [removeSamplingModalRecord, setRemoveSamplingModalRecord] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<EvidenceVersionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [activeModalTab, setActiveModalTab] = useState<'preview' | 'history' | 'ai'>('preview');

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const userOrg = currentUser?.organization || 'Midwest Trading Co.';

  // Fetch Evidence Records from Server API
  const fetchEvidenceRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        client: selectedClient || 'All Clients',
        auditId: selectedAuditFilter || 'All Audits',
        distributor: isDistributor ? userOrg : (selectedDistributor || 'All Distributors'),
        userRole: currentUser?.role || 'Auditor',
        userOrg: userOrg
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
        setEvidenceList(data.records);
      } else {
        console.warn('Fallback: unable to load evidence from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch evidence records from API:', err);
      if (err?.message?.includes('Failed to fetch')) {
        console.warn('Network error: Dev server may be restarting.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceRecords();
  }, [selectedClient, selectedDistributor, selectedAuditFilter, currentUser]);

  // Sync listener for upload events
  useEffect(() => {
    const handleSync = () => fetchEvidenceRecords();
    window.addEventListener('data360_iir_sync_event', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('data360_iir_sync_event', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Fetch version history when modal opens
  const fetchVersionHistory = async (recordId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/evidence/${recordId}/history`, {
        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setVersionHistory(data.history);
      }
    } catch (err: any) {
      console.error('Failed to fetch evidence history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenRecordModal = (record: EvidenceRecord) => {
    setSelectedRecord(record);
    setReviewerCommentInput(record.reviewerComment || '');
    if (Array.isArray(record.documentUsage)) {
      setModalDocUsage(record.documentUsage);
    } else if (typeof record.documentUsage === 'string') {
      try {
        if (record.documentUsage.startsWith('[')) setModalDocUsage(JSON.parse(record.documentUsage));
        else setModalDocUsage(record.documentUsage.split(',').map(s => s.trim()));
      } catch (e) {
        setModalDocUsage([record.documentUsage]);
      }
    } else {
      setModalDocUsage(['EVIDENCE']);
    }
    setValidationError('');
    setActionSuccessMsg('');
    setActiveModalTab('preview');
    fetchVersionHistory(record.id);
  };

  // Filter records locally by status, file type, and search query
  const filteredRecords = evidenceList.filter(rec => {
    // Distributor Multi-Tenant Isolation
    if (isDistributor && rec.distributorName.toLowerCase() !== userOrg.toLowerCase()) {
      return false;
    }

    if (!isDistributor && selectedDistributor && selectedDistributor !== 'All Distributors') {
      if (rec.distributorName.toLowerCase() !== selectedDistributor.toLowerCase()) {
        return false;
      }
    }

    if (selectedClient && selectedClient !== 'All Clients') {
      if (rec.clientName && rec.clientName.toLowerCase() !== selectedClient.toLowerCase()) {
        return false;
      }
    }

    if (selectedAuditFilter && selectedAuditFilter !== 'All Audits') {
      if (rec.auditId !== selectedAuditFilter) {
        return false;
      }
    }

    // Evidence Mode Filter
    

    // Status Filter
    if (activeStatusFilter !== 'All') {
      const normRecStatus = (rec.status || '').toUpperCase().replace(/\s+/g, '_');
      if (activeStatusFilter === 'PENDING_REVIEW' && (normRecStatus === 'PENDING_REVIEW' || normRecStatus === 'PENDING')) {
        // match
      } else if (normRecStatus !== activeStatusFilter) {
        return false;
      }
    }

    
    // Source Filter
    if (selectedSourceFilter !== 'All Sources') {
      const src = rec.source || (rec.uploadedBy?.toLowerCase().includes('auditor') ? 'Auditor Upload' : 'Distributor Upload');
      if (selectedSourceFilter === 'Distributor Upload' && src !== 'Distributor Upload') return false;
      if (selectedSourceFilter === 'Auditor Upload' && src !== 'Auditor Upload') return false;
    }

    // File Type Filter
    if (selectedFileType !== 'All') {
      if (selectedFileType === 'PDF' && !rec.fileType.includes('pdf')) return false;
      if (selectedFileType === 'Spreadsheet' && (!rec.fileType.includes('sheet') && !rec.fileType.includes('excel') && !rec.fileType.includes('csv'))) return false;
      if (selectedFileType === 'Image' && (!rec.fileType.includes('image') && !rec.fileType.includes('png') && !rec.fileType.includes('jpg'))) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = rec.fileName.toLowerCase().includes(q);
      const matchRef = rec.requestRef.toLowerCase().includes(q);
      const matchTitle = rec.requestTitle.toLowerCase().includes(q);
      const matchDist = rec.distributorName.toLowerCase().includes(q);
      const matchComment = rec.reviewerComment ? rec.reviewerComment.toLowerCase().includes(q) : false;
      if (!matchName && !matchRef && !matchTitle && !matchDist && !matchComment) {
        return false;
      }
    }

    return true;
  });

  // Calculate Metric Counts & Percentages
  const totalCount = evidenceList.length;
  const countByNormStatus = (statusKey: string) => {
    return evidenceList.filter(r => {
      const norm = (r.status || '').toUpperCase().replace(/\s+/g, '_');
      if (statusKey === 'PENDING_REVIEW') return norm === 'PENDING_REVIEW' || norm === 'PENDING';
      return norm === statusKey;
    }).length;
  };

  const pendingCount = countByNormStatus('PENDING_REVIEW');
  const acceptedCount = countByNormStatus('ACCEPTED');
  const clarificationCount = countByNormStatus('CLARIFICATION_REQUIRED');
  const rejectedCount = countByNormStatus('REJECTED');

  const getPercent = (count: number) => {
    if (totalCount === 0) return '0%';
    return `${Math.round((count / totalCount) * 100)}%`;
  };

  // Submit Evidence Review Action (Auditor)
  const handleAddSampling = async () => {
    if (!samplingModalRecord) return;
    setIsAddingSampling(true);
    try {
      const currentUsage = Array.isArray(samplingModalRecord.documentUsage) ? samplingModalRecord.documentUsage : 
                           (typeof samplingModalRecord.documentUsage === 'string' ? samplingModalRecord.documentUsage.split(',') : ['EVIDENCE']);
      const newUsage = [...new Set([...currentUsage, 'SAMPLING_POPULATION'])];
      const res = await fetch(`/api/evidence/${samplingModalRecord.id}/usage`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify({ documentUsage: newUsage, samplingEnabled: true })
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
      console.log("==================================================");
      console.log("ADD TO SAMPLING");
      console.log("Engagement ID:", samplingModalRecord.auditId || "eng-101");
      console.log("Distributor ID:", samplingModalRecord.distributorName);
      console.log("Evidence ID:", samplingModalRecord.id);
      console.log("File ID:", samplingModalRecord.googleDriveFileId || samplingModalRecord.id);
      console.log("File Name:", samplingModalRecord.fileName);
      console.log("Sampling Record ID:", samplingModalRecord.id);
      console.log("Sampling Status: AVAILABLE");
      console.log("==================================================");
        setToastMessage(`✓ ${samplingModalRecord.fileName} is now available in Sampling.`);
        setTimeout(() => setToastMessage(null), 4000);
        if (selectedRecord && selectedRecord.id === samplingModalRecord.id) {
          setSelectedRecord({ 
            ...selectedRecord, 
            documentUsage: newUsage, 
            samplingEnabled: true,
            samplingStatus: 'AVAILABLE'
          });
        }
        setSamplingModalRecord(null);
        fetchEvidenceRecords();
      } else {
        console.error("ADD TO SAMPLING ERROR:", resData);
        setToastMessage(`❌ Failed to add document to Sampling. ${resData.error || ''}`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(`❌ Failed to add document to Sampling. Please try again.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAddingSampling(false);
    }
  };

  const isSamplingAdded = selectedRecord?.samplingEnabled === true && selectedRecord?.samplingStatus === 'AVAILABLE' && selectedRecord?.documentUsage?.includes('SAMPLING_POPULATION');

  const handleRemoveSampling = async () => {
    if (!removeSamplingModalRecord) return;
    setIsAddingSampling(true);
    try {
      const currentUsage = Array.isArray(removeSamplingModalRecord.documentUsage) ? removeSamplingModalRecord.documentUsage : 
                           (typeof removeSamplingModalRecord.documentUsage === 'string' ? removeSamplingModalRecord.documentUsage.split(',') : ['EVIDENCE']);
      const newUsage = currentUsage.filter((u) => u !== 'SAMPLING_POPULATION');
      const res = await fetch(`/api/evidence/${removeSamplingModalRecord.id}/usage`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify({ documentUsage: newUsage, samplingEnabled: false })
      });
      if (res.ok) {
        setToastMessage(`✓ ${removeSamplingModalRecord.fileName} removed from Sampling.`);
        setTimeout(() => setToastMessage(null), 4000);
        if (selectedRecord && selectedRecord.id === removeSamplingModalRecord.id) {
          setSelectedRecord({ ...selectedRecord, documentUsage: newUsage, samplingEnabled: false, samplingStatus: undefined });
        }
        setRemoveSamplingModalRecord(null);
        fetchEvidenceRecords();
      } else {
        setToastMessage(`❌ Unable to remove document from Sampling. Please try again.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setToastMessage(`❌ Unable to remove document from Sampling. Please try again.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsAddingSampling(false);
    }
  };

  const handleUsageUpdate = async () => {
    if (!selectedRecord) return;
    setIsUpdatingUsage(true);
    setValidationError('');
    setActionSuccessMsg('');
    try {
      const res = await fetch(`/api/evidence/${selectedRecord.id}/usage`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify({ documentUsage: modalDocUsage })
      });
      if (res.ok) {
        setActionSuccessMsg('Document usage updated successfully!');
        fetchEvidenceRecords();
        setSelectedRecord({...selectedRecord, documentUsage: modalDocUsage});
      } else {
        const data = await res.json();
        setValidationError('Failed to update usage: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setValidationError('Failed to update document usage.');
    } finally {
      setIsUpdatingUsage(false);
    }
  };

  const handleReviewSubmit = async (decisionStatus: 'ACCEPTED' | 'CLARIFICATION_REQUIRED' | 'REJECTED') => {
    if (!selectedRecord) return;

    if (isDistributor) {
      setValidationError('HTTP 403: Distributor accounts cannot perform review actions.');
      return;
    }

    const trimmedComment = reviewerCommentInput.trim();

    // Mandatory comment check for Clarification & Rejection
    if ((decisionStatus === 'CLARIFICATION_REQUIRED' || decisionStatus === 'REJECTED') && !trimmedComment) {
      setValidationError(`A detailed review comment is MANDATORY when setting status to ${decisionStatus === 'CLARIFICATION_REQUIRED' ? 'Clarification Required' : 'Rejected'}.`);
      return;
    }

    setValidationError('');
    setIsSubmittingReview(true);

    try {
      const res = await fetch(`/api/evidence/${selectedRecord.id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        },
        body: JSON.stringify({
          status: decisionStatus,
          comment: trimmedComment,
          reviewerName: currentUser?.name || 'Sarah Jenkins (Auditor)',
          userRole: currentUser?.role || 'Auditor',
          clientName: selectedRecord.clientName,
          distributorName: selectedRecord.distributorName,
          auditId: selectedRecord.auditId
        })
      });

      const data = await res.json();

      if (data.success) {
        setActionSuccessMsg(`Evidence review updated to "${decisionStatus === 'CLARIFICATION_REQUIRED' ? 'Clarification Required' : decisionStatus}"`);
        
        // Refresh local list
        setEvidenceList(prev => prev.map(item => {
          if (item.id === selectedRecord.id) {
            return {
              ...item,
              status: decisionStatus,
              reviewerComment: trimmedComment,
              reviewedBy: currentUser?.name || 'Sarah Jenkins (Auditor)',
              reviewedDate: new Date().toLocaleString()
            };
          }
          return item;
        }));

        // Refresh version history list
        fetchVersionHistory(selectedRecord.id);

        setTimeout(() => {
          setActionSuccessMsg('');
          setSelectedRecord(null);
        }, 1200);
      } else {
        setValidationError(data.error || 'Failed to update evidence review status.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'An unexpected error occurred during review submission.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FolderArchive className="h-6 w-6 text-indigo-400" />
            <span>{isDistributor ? 'My Evidence Uploads & Review Status' : 'Auditor Evidence Review Console'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {isDistributor 
              ? 'Track uploaded compliance evidence and view auditor evaluation decisions.'
              : 'Inspect and review uploaded distributor evidence files.'
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvidenceRecords}
            disabled={loading}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Evidence"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">{isDistributor ? userOrg : (selectedDistributor || 'All Distributors')}</span>
          </div>
        </div>
      </div>

      {activeMainTab === 'upload' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Upload Central Document</h2>
          <p className="text-xs text-slate-400 mb-6">Upload a document to the centralized repository. It will be available for Evidence, Sampling, and other workflows based on its designated usage.</p>
          
          {uploadSuccessMsg && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">File</label>
              <input 
                type="file" 
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Distributor</label>
                <select 
                  value={uploadDistributor}
                  onChange={(e) => setUploadDistributor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Distributor...</option>
                  <option value="Midwest Trading Co.">Midwest Trading Co.</option>
                  <option value="Global Logistics Corp">Global Logistics Corp</option>
                  <option value="TechFlow Distributors">TechFlow Distributors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Engagement</label>
                <input 
                  type="text" 
                  value={uploadEngagement}
                  onChange={(e) => setUploadEngagement(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Audit Period</label>
                <input 
                  type="text" 
                  value={uploadAuditPeriod}
                  onChange={(e) => setUploadAuditPeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Document Type</label>
                <select 
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Expense Register">Expense Register</option>
                  <option value="Revenue Register">Revenue Register</option>
                  <option value="Purchase Register">Purchase Register</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">Document Usage</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'EVIDENCE', label: 'Evidence' },
                  { id: 'SAMPLING_POPULATION', label: 'Sampling Population' },
                  { id: 'QUESTIONNAIRE_SOURCE', label: 'Questionnaire Source' },
                  { id: 'SUPPORTING_DOCUMENT', label: 'Supporting Document' }
                ].map(usage => (
                  <label key={usage.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={uploadDocUsage.includes(usage.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUploadDocUsage([...uploadDocUsage, usage.id]);
                        } else {
                          setUploadDocUsage(uploadDocUsage.filter(u => u !== usage.id));
                        }
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-300">{usage.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={async () => {
                  if (!uploadFile) return alert('Please select a file');
                  if (!uploadDistributor) return alert('Please select a distributor');
                  
                  setIsUploading(true);
                  setUploadSuccessMsg('');
                  try {
                    const formData = new FormData();
                    formData.append('file', uploadFile);
                    formData.append('clientName', 'Apex Electronics Corp');
                    formData.append('distributorName', uploadDistributor);
                    formData.append('auditName', uploadEngagement);
                    formData.append('auditPeriod', uploadAuditPeriod);
                    formData.append('documentType', uploadDocType);
                    formData.append('documentUsage', JSON.stringify(uploadDocUsage));
                    formData.append('requirementId', 'CEN-' + Math.floor(Math.random()*1000));
                    
                    const res = await fetch('/api/storage/upload', {
                      method: 'POST',
                      headers: {
                        'x-user-email': currentUser?.email || '',
                        'x-user-role': currentUser?.role || '',
                        'x-user-organization': currentUser?.organization || ''
                      },
                      body: formData
                    });
                    
                    if (res.ok) {
                      setUploadSuccessMsg('Document uploaded successfully and added to My Evidence.');
                      setUploadFile(null);
                      const fileInputs = document.querySelectorAll('input[type="file"]');
                      fileInputs.forEach((input) => (input as any).value = '');
                      fetchEvidenceRecords();
                    } else {
                      const data = await res.json();
                      alert('Upload failed: ' + data.error);
                    }
                  } catch (e) {
                    alert('Upload failed');
                  } finally {
                    setIsUploading(false);
                  }
                }}
                disabled={isUploading || !uploadFile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="h-4 w-4" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: activeMainTab === 'list' ? 'block' : 'none' }}>
        {/* Evidence Mode Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 max-w-[600px] mx-auto sm:mx-0">
          <button
            onClick={() => setEvidenceMode('All Evidence')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${evidenceMode === 'All Evidence' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <FolderArchive className="w-4 h-4" /> All Evidence
          </button>
          <button
            onClick={() => setEvidenceMode('Sampling')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${evidenceMode === 'Sampling' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <Database className="w-4 h-4" /> Sampling
          </button>
        </div>

      {evidenceMode === 'Sampling' && (
        <SamplingView
          currentUser={currentUser}
          selectedClient={selectedClient}
          selectedDistributor={selectedDistributor}
          selectedAuditFilter={selectedAuditFilter}
          isEvidenceManagementMode={true}
        />
      )}
      <div style={{ display: evidenceMode === 'All Evidence' ? 'block' : 'none' }}>
      {/* Metrics & Analytics Dashboard Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { 
            id: 'All', 
            label: 'Total Evidence Files', 
            count: totalCount, 
            subText: '100% Total Population', 
            statusKey: 'All' as const, 
            color: 'text-indigo-400', 
            bgColor: 'bg-indigo-500/10 border-indigo-500/30',
            icon: FolderArchive 
          },
          { 
            id: 'PENDING_REVIEW', 
            label: 'Pending Review', 
            count: pendingCount, 
            subText: `${getPercent(pendingCount)} of total files`, 
            statusKey: 'PENDING_REVIEW' as const, 
            color: 'text-amber-400', 
            bgColor: 'bg-amber-500/10 border-amber-500/30',
            icon: Clock 
          },
          { 
            id: 'ACCEPTED', 
            label: 'Accepted Evidence', 
            count: acceptedCount, 
            subText: `${getPercent(acceptedCount)} Acceptance Rate`, 
            statusKey: 'ACCEPTED' as const, 
            color: 'text-emerald-400', 
            bgColor: 'bg-emerald-500/10 border-emerald-500/30',
            icon: CheckCircle2 
          },
          { 
            id: 'CLARIFICATION_REQUIRED', 
            label: 'Clarification Required', 
            count: clarificationCount, 
            subText: `${getPercent(clarificationCount)} Need Info`, 
            statusKey: 'CLARIFICATION_REQUIRED' as const, 
            color: 'text-blue-400', 
            bgColor: 'bg-blue-500/10 border-blue-500/30',
            icon: HelpCircle 
          },
          { 
            id: 'REJECTED', 
            label: 'Rejected Evidence', 
            count: rejectedCount, 
            subText: `${getPercent(rejectedCount)} Rejection Rate`, 
            statusKey: 'REJECTED' as const, 
            color: 'text-red-400', 
            bgColor: 'bg-red-500/10 border-red-500/30',
            icon: XCircle 
          }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeStatusFilter === item.statusKey;
          return (
            <button
              key={item.id}
              onClick={() => setActiveStatusFilter(item.statusKey)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isActive 
                  ? 'bg-slate-900 border-indigo-500 shadow-lg ring-2 ring-indigo-500/40' 
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl border ${item.bgColor}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </span>
                <span className={`text-xl font-extrabold ${item.color}`}>
                  {item.count}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200 mt-3">{item.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.subText}</p>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by file name, Ref #, requirement title, distributor, or comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audit:</span>
          </div>
          <select
            value={selectedAuditFilter}
            onChange={(e) => setSelectedAuditFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
          >
            <option value="All Audits">All Audits</option>
            <option value="eng-101">Apex Group FY26 Audit (eng-101)</option>
            <option value="eng-102">India Subcontinent Audit 2026 (eng-102)</option>
            <option value="eng-103">LATAM Region Channel Audit (eng-103)</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800">
            <span>Format:</span>
          </div>
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Formats</option>
            <option value="PDF">PDF Documents</option>
            <option value="Spreadsheet">Excel / CSV Spreadsheets</option>
            <option value="Image">Image Files</option>
          </select>

          <div className="text-xs text-slate-400 font-medium pl-2 border-l border-slate-800">
            Showing <span className="font-bold text-white">{filteredRecords.length}</span> of <span className="font-bold text-slate-300">{totalCount}</span> files
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Requirement Ref & Title</th>
                <th className="py-3.5 px-4">Evidence Document</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Distributor Entity</th>
                <th className="py-3.5 px-4">Uploader</th>
                <th className="py-3.5 px-4">Review Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    <span>Loading Evidence Review Records...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <FolderArchive className="h-8 w-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No evidence files match the selected filters.</p>
                    <p className="text-[11px] text-slate-500">Try adjusting your search terms or status filter tab.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const normStatus = (item.status || '').toUpperCase().replace(/\s+/g, '_');
                  const isAccepted = normStatus === 'ACCEPTED';
                  const isPending = normStatus === 'PENDING_REVIEW' || normStatus === 'PENDING';
                  const isClarification = normStatus === 'CLARIFICATION_REQUIRED';
                  const isRejected = normStatus === 'REJECTED';

                  return (
                    <tr key={`evd-${item.id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] font-bold text-indigo-300">
                            {item.requestRef}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-100 line-clamp-1 max-w-xs">{item.requestTitle}</p>
                            <span className="text-[9px] text-slate-500 uppercase">{item.section || 'Requirement'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {item.fileType.includes('pdf') ? (
                            <FileText className="h-4 w-4 text-red-400 shrink-0" />
                          ) : item.fileType.includes('sheet') || item.fileType.includes('excel') ? (
                            <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <File className="h-4 w-4 text-indigo-400 shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-slate-100 hover:text-indigo-300 transition-colors cursor-pointer" onClick={() => handleOpenRecordModal(item)}>
                              {item.fileName}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded text-[10px] font-bold border border-slate-800 uppercase tracking-wider">
                          {item.source && !item.source.toLowerCase().includes('auditor') && !item.source.toLowerCase().includes('distributor')
                            ? item.source
                            : 'Direct Upload'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>{item.distributorName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                          (item.uploader === 'Auditor' || (!item.uploader && item.uploadedBy?.toLowerCase().includes('auditor')))
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {(item.uploader === 'Auditor' || (!item.uploader && item.uploadedBy?.toLowerCase().includes('auditor'))) ? 'Auditor' : 'Distributor'}
                        </span>
                        {item.uploadedDate && (
                          <p className="text-[10px] text-slate-400 mt-1">{item.uploadedDate}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          isAccepted
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : isClarification
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}>
                          {isAccepted && <CheckCircle2 className="h-3 w-3" />}
                          {isPending && <Clock className="h-3 w-3" />}
                          {isClarification && <HelpCircle className="h-3 w-3" />}
                          {isRejected && <XCircle className="h-3 w-3" />}
                          <span>{isAccepted ? 'Accepted' : isPending ? 'Pending Review' : isClarification ? 'Clarification Required' : 'Rejected'}</span>
                        </span>
                        {item.reviewerComment && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic max-w-xs">
                            "{item.reviewerComment}"
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => downloadFileFromApi(item.googleDriveFileId || item.id, item.fileName)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors inline-flex cursor-pointer"
                            title="Download Original File"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRecordModal(item)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{isDistributor ? 'View Details' : 'Review File'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div>
      {/* EVIDENCE REVIEW & DETAIL MODAL */}
      
      
      {/* Remove Sampling Confirmation Modal */}
      {removeSamplingModalRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Remove from Sampling?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Are you sure you want to remove <strong className="text-slate-200">{removeSamplingModalRecord.fileName}</strong> from Sampling Populations? This will not delete the original evidence file.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setRemoveSamplingModalRecord(null)}
                  disabled={isAddingSampling}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRemoveSampling}
                  disabled={isAddingSampling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {isAddingSampling && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Remove from Sampling
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sampling Confirmation Modal */}
      {samplingModalRecord && !samplingSuccessRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">Add to Sampling?</h3>
              <p className="text-slate-400 text-sm mb-4">
                This document will be available as a sampling population for the current distributor, engagement, audit, and audit period.
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-6 space-y-1.5 text-left">
                <p className="text-xs text-slate-400">File: <span className="text-slate-200 font-semibold">{samplingModalRecord.fileName}</span></p>
                <p className="text-xs text-slate-400">Distributor: <span className="text-slate-200 font-semibold">{samplingModalRecord.distributorName}</span></p>
                <p className="text-xs text-slate-400">Audit Period: <span className="text-slate-200 font-semibold">{samplingModalRecord.auditPeriod || 'FY 2025-26'}</span></p>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setSamplingModalRecord(null)}
                  disabled={isAddingSampling}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSampling}
                  disabled={isAddingSampling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  {isAddingSampling && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Add to Sampling
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl text-white my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold rounded-lg">
                  Ref #{selectedRecord.requestRef}
                </span>
                <div>
                  <h3 className="font-bold text-base text-white">{selectedRecord.requestTitle}</h3>
                  <p className="text-xs text-slate-400">
                    Distributor: <span className="font-bold text-slate-200">{selectedRecord.distributorName}</span> • Client: <span className="font-bold text-slate-200">{selectedRecord.clientName || 'Apex Electronics Corp'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2 flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveModalTab('preview')}
                className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeModalTab === 'preview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Document Preview & Metadata</span>
              </button>

              <button
                onClick={() => setActiveModalTab('history')}
                className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeModalTab === 'history' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Version History ({versionHistory.length})</span>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Validation & Feedback Banners */}
              {validationError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {actionSuccessMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

              {/* TAB 1: PREVIEW & METADATA */}
              {activeModalTab === 'preview' && (
                <div className="space-y-4">
                  
                  {/* Document Content In-App Preview Container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400 font-bold">
                        <Eye className="h-4 w-4 text-indigo-400" />
                        Embedded Document Preview
                      </span>
                      <a
                        href={`/api/storage/preview/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>Open in New Tab</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[380px] flex flex-col items-center justify-center text-center">
                      {selectedRecord.fileType.includes('pdf') ? (
                        <div className="w-full h-[400px]">
                          <iframe 
                            src={`/api/storage/preview/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`} 
                            className="w-full h-full border border-slate-800 rounded-lg bg-slate-900"
                            title="PDF Preview"
                          />
                        </div>
                      ) : selectedRecord.fileType.includes('sheet') || selectedRecord.fileType.includes('excel') || selectedRecord.fileName.endsWith('.xlsx') ? (
                        <div className="w-full space-y-3 text-left">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>Spreadsheet Data Grid Preview (First 5 Sample Records)</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Parsed XLSX Grid</span>
                          </div>

                          <div className="overflow-x-auto border border-slate-800 rounded-lg">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-900 text-slate-400 font-mono">
                                <tr>
                                  <th className="p-2 border-b border-slate-800">TxID</th>
                                  <th className="p-2 border-b border-slate-800">Date</th>
                                  <th className="p-2 border-b border-slate-800">Item Description</th>
                                  <th className="p-2 border-b border-slate-800">Qty</th>
                                  <th className="p-2 border-b border-slate-800 text-right">Amount ($)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 text-slate-300">
                                <tr>
                                  <td className="p-2 font-mono">TX-2026-081</td>
                                  <td className="p-2">2026-01-15</td>
                                  <td className="p-2 font-semibold">Apex Pro Enterprise Hub Router</td>
                                  <td className="p-2">45</td>
                                  <td className="p-2 text-right font-mono">$18,450.00</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-mono">TX-2026-082</td>
                                  <td className="p-2">2026-01-18</td>
                                  <td className="p-2 font-semibold">Fiber Optic Transceiver Module x8</td>
                                  <td className="p-2">120</td>
                                  <td className="p-2 text-right font-mono">$24,000.00</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-mono">TX-2026-083</td>
                                  <td className="p-2">2026-02-01</td>
                                  <td className="p-2 font-semibold">Commercial Access Point v3</td>
                                  <td className="p-2">80</td>
                                  <td className="p-2 text-right font-mono">$12,800.00</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-[400px]">
                          <iframe 
                            src={`/api/storage/preview/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`} 
                            className="w-full h-full border border-slate-800 rounded-lg bg-slate-900"
                            title="Document Preview"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Compact Metadata Strip Below */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/storage/download/${selectedRecord.googleDriveFileId || selectedRecord.id}?fileName=${encodeURIComponent(selectedRecord.fileName || 'document.pdf')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Original File ({selectedRecord.fileSizeMB} MB)</span>
                        </a>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-indigo-300 font-mono font-bold rounded text-[11px]">
                        Version v{selectedRecord.version}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-slate-400 font-mono">
                      <span>{selectedRecord.fileSizeMB} MB</span>
                      <span className="text-slate-700">&bull;</span>
                      <span className="uppercase">{selectedRecord.fileType.split('/')[1] || selectedRecord.fileType}</span>
                      <span className="text-slate-700">&bull;</span>
                      <span>Uploaded by <strong className="text-slate-200 font-sans font-semibold">{selectedRecord.uploader || (selectedRecord.uploadedBy?.toLowerCase().includes('auditor') ? 'Auditor' : 'Distributor')}</strong></span>
                      <span className="text-slate-700">&bull;</span>
                      <span>{selectedRecord.uploadedDate}</span>
                    </div>
                  </div>

                  {/* Review Decision Form */}
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Auditor Review Findings & Comments
                      </label>
                      {selectedRecord.reviewedBy && (
                        <span className="text-[11px] text-slate-400">
                          Last Reviewed By: <span className="font-semibold text-slate-200">{selectedRecord.reviewedBy}</span> on {selectedRecord.reviewedDate}
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={3}
                      disabled={isDistributor}
                      value={reviewerCommentInput}
                      onChange={(e) => {
                        setReviewerCommentInput(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      placeholder={
                        isDistributor 
                          ? 'Auditor evaluation findings and comments will appear here.' 
                          : 'Enter mandatory review justification or clarification notes for the distributor...'
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-70 transition-colors"
                    />

                    
                    {/* Sampling Section */}
                    <div className="mt-8 border-t border-slate-800 pt-6">
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">SAMPLING USAGE</h4>
                        <div className="h-px w-full bg-slate-800"></div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
                          <span className="text-xs font-semibold text-slate-400">Sampling Eligibility:</span>
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Eligible</span>
                        </div>

                        {!isDistributor && !isSamplingAdded && (
                          <button
                            onClick={() => setSamplingModalRecord(selectedRecord)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
                          >
                            Add to Sampling
                          </button>
                        )}
                        {!isDistributor && isSamplingAdded && (
                          <div className="space-y-3">
                            <div className="w-full py-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Added to Sampling
                            </div>
                            <p className="text-xs text-slate-400 text-center">This document is currently available in:<br/><strong className="text-slate-300">Sampling &rarr; Available Populations</strong></p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRecord(null);
                                  window.dispatchEvent(new CustomEvent('NAVIGATE_TO_SAMPLING'));
                                }}
                                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors"
                              >
                                Go to Sampling
                              </button>
                              <button
                                onClick={() => setRemoveSamplingModalRecord(selectedRecord)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold rounded-lg transition-colors border border-slate-700"
                              >
                                Remove from Sampling
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isDistributor && (
                      <div className="space-y-2 mt-8 border-t border-slate-800 pt-6">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Select Auditor Action Decision:
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleReviewSubmit('ACCEPTED')}
                            className="py-3 px-4 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>ACCEPT EVIDENCE</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleReviewSubmit('CLARIFICATION_REQUIRED')}
                            className="py-3 px-4 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <HelpCircle className="h-4 w-4 text-blue-400" />
                            <span>REQUEST CLARIFICATION</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingReview}
                            onClick={() => handleReviewSubmit('REJECTED')}
                            className="py-3 px-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span>REJECT EVIDENCE</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: VERSION HISTORY */}
              {activeModalTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Document Versioning Log</h4>
                      <p className="text-xs text-slate-400">Complete audit trail of all file versions uploaded for Requirement Ref {selectedRecord.requestRef}.</p>
                    </div>
                  </div>

                  {loadingHistory ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin mx-auto mb-2" />
                      <span>Loading Version History...</span>
                    </div>
                  ) : versionHistory.length === 0 ? (
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                      Single version record registered for this requirement.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versionHistory.map((vh) => {
                        const isCurrent = vh.version === selectedRecord.version;
                        return (
                          <div 
                            key={vh.id} 
                            className={`p-4 rounded-xl border transition-all ${
                              isCurrent 
                                ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md' 
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 font-mono text-[11px] font-bold rounded ${
                                  isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  v{vh.version} {isCurrent && '(Current Active)'}
                                </span>
                                <span className="font-semibold text-slate-200 text-xs">{vh.fileName}</span>
                              </div>

                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                                vh.status === 'ACCEPTED' || vh.status === 'Accepted'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : vh.status === 'CLARIFICATION_REQUIRED' || vh.status === 'Clarification Required'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : vh.status === 'REJECTED' || vh.status === 'Rejected'
                                  ? 'bg-red-500/10 text-red-300 border-red-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}>
                                {vh.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60">
                              <div>Uploaded by: <span className="text-slate-200 font-medium">{vh.uploader || (vh.uploadedBy?.toLowerCase().includes('auditor') ? 'Auditor' : 'Distributor')}</span></div>
                              <div>Upload date: <span className="text-slate-200 font-medium">{vh.uploadedDate}</span></div>
                              <div>File size: <span className="text-slate-200 font-medium">{vh.fileSizeMB} MB</span></div>
                            </div>

                            {vh.reviewerComment && (
                              <div className="mt-2.5 p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg text-[11px] text-slate-300">
                                <span className="font-bold text-indigo-300">Auditor Comment ({vh.reviewedBy || 'Sarah Jenkins'}):</span> "{vh.reviewerComment}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[200] animate-in slide-in-from-bottom-5 fade-in bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            {toastMessage.startsWith('❌') ? <XCircle className="h-4 w-4 text-red-400" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </div>
          <p className="text-sm font-semibold text-white">{toastMessage.replace('✓ ', '').replace('❌ ', '')}</p>
        </div>
      )}
    </div>
  );
};