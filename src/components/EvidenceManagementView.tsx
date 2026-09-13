import React, { useState, useEffect, useMemo } from 'react';
import { downloadFileFromApi, bulkDownloadFromApi } from '../lib/downloadHelper';
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
  File,
  X
} from 'lucide-react';
import { EvidenceRecord, UserSession } from '../types';

interface EvidenceManagementViewProps {
  currentUser: UserSession | null;
  selectedClient?: string;
  selectedDistributor?: string;
  defaultAuditFilter?: string;
  defaultMode?: 'All Evidence' | 'Sampling Eligible';
  onDistributorChangeGlobal?: (distributor: string) => void;
}

export const EvidenceManagementView: React.FC<EvidenceManagementViewProps> = ({
  currentUser,
  selectedClient = 'All Clients',
  selectedDistributor = 'All Distributors',
  defaultAuditFilter = 'All Audits',
  defaultMode = 'All Evidence',
  onDistributorChangeGlobal
}) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('All');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('All Sections');
  
  const [selectedRecord, setSelectedRecord] = useState<EvidenceRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const userOrg = currentUser?.organization || 'Midwest Trading Co.';
  
  const currentContextDistributor = isDistributor ? userOrg : selectedDistributor;

  const fetchEvidenceRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        client: selectedClient || 'All Clients',
        auditId: defaultAuditFilter || 'All Audits',
        distributor: currentContextDistributor || 'All Distributors',
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
        setSelectedRows(new Set()); // clear selections on load
      } else {
        console.warn('Fallback: unable to load evidence from server');
      }
    } catch (err: any) {
      console.error('Failed to fetch evidence records from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceRecords();
    setSelectedRecord(null);
  }, [selectedClient, currentContextDistributor, defaultAuditFilter, currentUser]);

  const filteredRecords = useMemo(() => {
    return evidenceList.filter(rec => {
      // Status Filter
      if (activeStatusFilter !== 'All') {
        const normRecStatus = (rec.status || '').toUpperCase().replace(/\s+/g, '_');
        if (activeStatusFilter === 'PENDING_REVIEW' && (normRecStatus === 'PENDING_REVIEW' || normRecStatus === 'PENDING')) {
          // match
        } else if (normRecStatus !== activeStatusFilter) {
          return false;
        }
      }

      // Section Filter
      if (selectedSectionFilter !== 'All Sections') {
        if (rec.section !== selectedSectionFilter && rec.requestTitle !== selectedSectionFilter) {
           return false;
        }
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
        if (!matchName && !matchRef && !matchTitle) {
          return false;
        }
      }

      return true;
    });
  }, [evidenceList, activeStatusFilter, selectedSectionFilter, selectedFileType, searchQuery]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const prefix = type === 'success' ? '✓ ' : type === 'error' ? '❌ ' : '';
    setToastMessage(prefix + msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRows(new Set(filteredRecords.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSet = new Set(selectedRows);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedRows(newSet);
  };

  // Download Logic
  const executeBulkDownload = async (records: EvidenceRecord[], label: string) => {
    if (records.length === 0) {
      showToast('No records available to download.', 'warning');
      return;
    }
    setIsBulkDownloading(true);
    const fileIds = records.map(r => r.googleDriveFileId || r.id);
    const sanitizedDist = (currentContextDistributor || 'All').replace(/[<>\:"\/\\|?*]+/g, '_');
    const zipName = `${sanitizedDist}_${label}_Evidence.zip`;
    await bulkDownloadFromApi(fileIds, zipName, showToast);
    setIsBulkDownloading(false);
  };

  const handleDownloadSelected = () => {
    const records = evidenceList.filter(r => selectedRows.has(r.id));
    executeBulkDownload(records, 'Selected');
  };

  const handleDownloadSection = () => {
    if (selectedSectionFilter === 'All Sections') {
      showToast('Please select a specific section from the filter first.', 'warning');
      return;
    }
    executeBulkDownload(filteredRecords, selectedSectionFilter.replace(/[<>\:"\/\\|?*]+/g, '_'));
  };

  const handleDownloadFilter = () => {
    executeBulkDownload(filteredRecords, 'Filtered');
  };

  const handleDownloadAll = () => {
    executeBulkDownload(evidenceList, 'All');
  };

  const handleIndividualDownload = async (record: EvidenceRecord) => {
    const fileId = record.googleDriveFileId || record.id;
    await downloadFileFromApi(fileId, record.fileName, showToast);
  };

  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    evidenceList.forEach(r => {
      if (r.section) sections.add(r.section);
      else if (r.requestTitle) sections.add(r.requestTitle);
    });
    return Array.from(sections).sort();
  }, [evidenceList]);

  // Statistics
  const totalCount = evidenceList.length;
  const pendingCount = evidenceList.filter(r => {
     const st = (r.status || '').toUpperCase().replace(/\s+/g, '_');
     return st === 'PENDING_REVIEW' || st === 'PENDING';
  }).length;
  const acceptedCount = evidenceList.filter(r => (r.status || '').toUpperCase().replace(/\s+/g, '_') === 'ACCEPTED').length;
  const clarificationCount = evidenceList.filter(r => (r.status || '').toUpperCase().replace(/\s+/g, '_') === 'CLARIFICATION_REQUIRED').length;
  const rejectedCount = evidenceList.filter(r => (r.status || '').toUpperCase().replace(/\s+/g, '_') === 'REJECTED').length;

  const healthPercentage = totalCount === 0 ? 0 : Math.round((acceptedCount / totalCount) * 100);
  
  // Needs Attention
  const attentionRecords = evidenceList.filter(r => {
     const st = (r.status || '').toUpperCase().replace(/\s+/g, '_');
     if (isDistributor) return st === 'CLARIFICATION_REQUIRED' || st === 'REJECTED';
     return st === 'PENDING_REVIEW' || st === 'PENDING' || st === 'CLARIFICATION_REQUIRED';
  });

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in relative">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FolderArchive className="h-6 w-6 text-indigo-400" />
            <span>Evidence & Review</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Manage submitted evidence, review status, and outstanding evidence requirements.
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

          {!isDistributor ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Distributor:</span>
              <select
                value={selectedDistributor || ''}
                onChange={(e) => onDistributorChangeGlobal && onDistributorChangeGlobal(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All Distributors">All Distributors</option>
                <option value="Midwest Trading Co.">Midwest Trading Co.</option>
                <option value="Global Logistics Corp">Global Logistics Corp</option>
                <option value="TechFlow Distributors">TechFlow Distributors</option>
              </select>
            </div>
          ) : (
            <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span>{userOrg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats and Health */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { id: 'All', label: 'Total', count: totalCount, icon: FolderArchive, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
            { id: 'PENDING_REVIEW', label: 'Pending', count: pendingCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
            { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
            { id: 'CLARIFICATION_REQUIRED', label: 'Clarification', count: clarificationCount, icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' }
          ].map(stat => (
            <button
              key={stat.id}
              onClick={() => setActiveStatusFilter(stat.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${activeStatusFilter === stat.id ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/40' : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-xl border ${stat.bg}`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></span>
                <span className={`text-xl font-extrabold ${stat.color}`}>{stat.count}</span>
              </div>
              <p className="text-xs font-bold text-slate-200 mt-3">{stat.label}</p>
            </button>
          ))}
        </div>
        
        {/* Evidence Health */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-center">
           <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
             <ShieldCheck className="h-4 w-4 text-indigo-400" />
             Evidence Health
           </h3>
           <p className="text-xs text-slate-400 mb-4">{acceptedCount} of {totalCount} accepted</p>
           <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
             <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${healthPercentage}%` }}></div>
           </div>
           <div className="mt-2 text-right">
             <span className="text-xl font-extrabold text-white">{healthPercentage}%</span>
           </div>
        </div>
      </div>

      {/* Needs Your Attention */}
      {attentionRecords.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <AlertTriangle className="h-5 w-5 text-amber-400" />
             <div>
               <h4 className="text-sm font-bold text-amber-300">Needs Your Attention</h4>
               <p className="text-xs text-amber-400/80">{attentionRecords.length} evidence file(s) require action</p>
             </div>
          </div>
          <button 
             onClick={() => {
                // Filter to attention records. 
                // Since there are multiple statuses, we clear the specific status filter and use a combined view, or just filter to the most critical.
                const firstStat = (attentionRecords[0].status || '').toUpperCase().replace(/\s+/g, '_');
                setActiveStatusFilter(firstStat === 'PENDING' ? 'PENDING_REVIEW' : firstStat);
             }}
             className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition-colors border border-amber-500/30"
          >
            View Actions
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedSectionFilter}
            onChange={(e) => setSelectedSectionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 max-w-[200px]"
          >
            <option value="All Sections">All Sections</option>
            {availableSections.map(sec => (
               <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Formats</option>
            <option value="PDF">PDF</option>
            <option value="Spreadsheet">Spreadsheet</option>
            <option value="Image">Image</option>
          </select>
          
          <div className="group relative z-10">
            <button disabled={isBulkDownloading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors">
              {isBulkDownloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Download ▼</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={handleDownloadSelected} disabled={selectedRows.size === 0} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800">Download Selected ({selectedRows.size})</button>
               <button onClick={handleDownloadSection} disabled={selectedSectionFilter === 'All Sections'} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 border-t border-slate-700/50">Download Current Section</button>
               <button onClick={handleDownloadFilter} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 border-t border-slate-700/50">Download Current Filter</button>
               <button onClick={handleDownloadAll} className="w-full text-left px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 border-t border-slate-700/50">Download All Evidence</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-700 bg-slate-800 focus:ring-indigo-500"
                    checked={filteredRecords.length > 0 && selectedRows.size === filteredRecords.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">Section / Requirement</th>
                {!isDistributor && <th className="py-3 px-4">Distributor</th>}
                <th className="py-3 px-4">Uploader</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mx-auto mb-2" />
                    <span>Loading Evidence...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FolderArchive className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <span>No evidence matches your filters.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => {
                  const normStatus = (item.status || '').toUpperCase().replace(/\s+/g, '_');
                  const isAccepted = normStatus === 'ACCEPTED';
                  const isPending = normStatus === 'PENDING_REVIEW' || normStatus === 'PENDING';
                  const isClarification = normStatus === 'CLARIFICATION_REQUIRED';
                  const isRejected = normStatus === 'REJECTED';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-700 bg-slate-800 focus:ring-indigo-500"
                          checked={selectedRows.has(item.id)}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                           {item.fileType.includes('pdf') ? <FileText className="h-4 w-4 text-red-400" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-400" />}
                           <span className="font-bold text-white max-w-[200px] truncate">{item.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                         <div className="flex flex-col">
                           <span className="text-slate-200 font-semibold">{item.section || 'General'}</span>
                           <span className="text-[10px] text-slate-500 max-w-[150px] truncate" title={item.requestTitle}>{item.requestTitle}</span>
                         </div>
                      </td>
                      {!isDistributor && (
                        <td className="py-3 px-4 text-slate-300 font-medium">
                          {item.distributorName}
                        </td>
                      )}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex flex-col">
                           <span>{item.uploader || item.uploadedBy || 'User'}</span>
                           <span className="text-[9px] text-slate-500">{item.uploadedDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isAccepted ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                          isPending ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                          isClarification ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                          'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedRecord(item)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors" title="View Details">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleIndividualDownload(item)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[200] animate-in slide-in-from-bottom-5 fade-in bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            {toastMessage.startsWith('❌') ? <XCircle className="h-4 w-4 text-red-400" /> : 
             toastMessage.startsWith('✓') ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> :
             <Info className="h-4 w-4 text-blue-400" />}
          </div>
          <p className="text-sm font-semibold text-white">{toastMessage.replace('✓ ', '').replace('❌ ', '')}</p>
        </div>
      )}

      {/* Right Drawer for View */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedRecord(null)}></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col pointer-events-auto animate-in slide-in-from-right duration-300">
             
             {/* Drawer Header */}
             <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
               <div>
                 <h2 className="text-lg font-bold text-white flex items-center gap-2">
                   <Eye className="h-5 w-5 text-indigo-400" /> Evidence Details
                 </h2>
               </div>
               <button onClick={() => setSelectedRecord(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                 <X className="h-4 w-4" />
               </button>
             </div>

             {/* Drawer Content */}
             <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Document Name</p>
                    <p className="text-sm font-semibold text-white break-all">{selectedRecord.fileName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Requirement / Section</p>
                      <p className="text-sm font-semibold text-slate-200">{selectedRecord.section || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                      <p className="text-sm font-semibold text-slate-200">{selectedRecord.status}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Distributor</p>
                      <p className="text-sm font-semibold text-slate-200">{selectedRecord.distributorName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Upload Date</p>
                      <p className="text-sm font-semibold text-slate-200">{selectedRecord.uploadedDate}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Document Preview</p>
                  
                  {(!selectedRecord.googleDriveFileId && selectedRecord.id.startsWith('EVD-')) || (!selectedRecord.googleDriveFileId && selectedRecord.id.startsWith('ev-')) ? (
                    <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center p-6 text-center">
                       <div>
                         <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                         <p className="text-sm font-bold text-slate-300">File unavailable.</p>
                         <p className="text-xs text-slate-500 mt-1">This is a legacy metadata record without a real file attachment.</p>
                       </div>
                    </div>
                  ) : selectedRecord.fileType.includes('pdf') || selectedRecord.fileType.includes('image') || selectedRecord.fileType.includes('png') || selectedRecord.fileType.includes('jpg') ? (
                    <div className="h-[400px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                      <iframe 
                         src={`/api/storage/preview/${encodeURIComponent(selectedRecord.googleDriveFileId || selectedRecord.id)}?fileName=${encodeURIComponent(selectedRecord.fileName)}`} 
                         className="w-full h-full border-0" 
                         title="Document Preview"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center p-6 text-center">
                       <div>
                         <FileSpreadsheet className="h-8 w-8 text-indigo-400 mx-auto mb-3" />
                         <p className="text-sm font-bold text-slate-300">Preview unavailable for this file type.</p>
                         <p className="text-xs text-slate-500 mt-1">Please download the file to view its contents.</p>
                       </div>
                    </div>
                  )}
                </div>

             </div>
             
             {/* Drawer Footer */}
             <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
               <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                 Close
               </button>
               <button onClick={() => handleIndividualDownload(selectedRecord)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors">
                 <Download className="h-4 w-4" /> Download File
               </button>
             </div>

          </div>
        </div>
      )}

    </div>
  );
};
