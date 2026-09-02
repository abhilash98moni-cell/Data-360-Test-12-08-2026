import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, CheckCircle2, AlertTriangle, FileText, Database, Upload, FileSpreadsheet } from 'lucide-react';
import { UserSession } from './AuthModal';
import { RequiredDataQuestionnaire } from './RequiredDataQuestionnaire';

interface Props {
  currencyMode?: string;
  selectedClient: string;
  selectedDistributor: string;
  selectedAuditFilter?: string;
  currentUser: UserSession | null;
}

const formatCurrency = (val: number | null, mode: string = 'INR') => {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat(mode === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency: mode }).format(val);
};

export const DistributorSamplingReviewView: React.FC<Props> = ({
  selectedClient,
  selectedDistributor,
  selectedAuditFilter,
  currentUser,
  currencyMode = 'INR'
}) => {
  const [openQuestionnaireFor, setOpenQuestionnaireFor] = useState<any | null>(null);
  const [availablePopulations, setAvailablePopulations] = useState<any[]>([]);
  const [selectedPopulation, setSelectedPopulation] = useState<any | null>(null);
  const [populationRecords, setPopulationRecords] = useState<any[]>([]);
  const [assignedSamples, setAssignedSamples] = useState<any[]>([]);
  const [allResponses, setAllResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Available Populations
  const fetchPopulations = async () => {
    try {
      const params = new URLSearchParams({
        client: selectedClient !== 'All Clients' ? selectedClient : '',
        distributor: selectedDistributor !== 'All Distributors' ? selectedDistributor : '',
        auditId: selectedAuditFilter || 'eng-101'
      });
      const res = await fetch(`/api/evidence?${params.toString()}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const popData = await res.json();
      if (popData.success && Array.isArray(popData.records)) {
        const filtered = popData.records.filter((r: any) => {
          const usage = r.documentUsage || '';
          const status = r.status || '';
          const isAcceptable = ['ACCEPTED', 'AVAILABLE', 'PENDING_REVIEW', 'PENDING'].includes(status.toUpperCase().replace(/\s+/g, '_'));
          const isTemplate = (r.fileName || '').toLowerCase().includes('template') || (r.fileName || '').toLowerCase().includes('questionnaire');
          if (isTemplate) return false;
          const hasSamplingUsage = Array.isArray(usage) ? usage.includes('SAMPLING_POPULATION') : usage.includes('SAMPLING_POPULATION');
          return (r.samplingEnabled === true || String(r.samplingEnabled) === 'true') && hasSamplingUsage && isAcceptable;
        });
        setAvailablePopulations(filtered);
        if (!selectedPopulation && filtered.length > 0) {
          handleSelectPopulation(filtered[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch populations", err);
    }
  };

  const fetchAssignedSamples = async () => {
    try {
      const res = await fetch(`/api/sampling/transactions?distributorId=${encodeURIComponent(selectedDistributor)}&auditId=${encodeURIComponent(selectedAuditFilter || 'eng-101')}`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const data = await res.json();
      if (data.success && data.samples) {
        setAssignedSamples(data.samples);
      }
      const respRes = await fetch(`/api/sampling/required-data/responses`, {
        headers: { 'x-user-email': currentUser?.email || '' }
      });
      const respData = await respRes.json();
      if (respData.success && respData.responses) {
        setAllResponses(respData.responses);
      }
    } catch (err) {
      console.error("Failed to fetch assigned samples", err);
    }
  };

  useEffect(() => {
    fetchPopulations();
    fetchAssignedSamples();
  }, [selectedDistributor, selectedClient, selectedAuditFilter]);

  const handleSelectPopulation = async (targetFile: any) => {
    setSelectedPopulation(targetFile);
    setLoading(true);
    setPopulationRecords([]);
    
    try {
      const fileIdToFetch = targetFile.googleDriveFileId || targetFile.id;
      
      // 1. Try population-records API first which contains the persistent pre-parsed records
      try {
        const popRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(fileIdToFetch)}&distributorId=${encodeURIComponent(selectedDistributor || '')}&auditId=${encodeURIComponent(selectedAuditFilter || '')}`);
        if (popRes.ok) {
          const popData = await popRes.json();
          if (popData.success && Array.isArray(popData.records) && popData.records.length > 0) {
            setPopulationRecords(popData.records);
            setLoading(false);
            return;
          }
        }
      } catch (popErr) {
        console.warn('Note: population-records endpoint fallback to direct file download:', popErr);
      }

      // 2. Fallback to direct file download & parse
      const res = await fetch(`/api/storage/download/${fileIdToFetch}?fileName=${encodeURIComponent(targetFile.fileName)}`);
      if (!res.ok) throw new Error(`Failed to download file ${targetFile.fileName}`);
      
      const buffer = await res.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "—" });
      
      const mappedData = targetFile.mappedData || targetFile.glMapping || {};
      let mapping: any = {};
      if (typeof mappedData === 'string') {
        try {
          mapping = JSON.parse(mappedData);
        } catch(e) {
          console.error('Failed to parse mappedData:', mappedData, e);
        }
      } else {
        mapping = mappedData || {};
      }

      const cleanAmount = (val: any): number => {
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
        }
        s = s.replace(/[^0-9.]/g, '');
        const parsed = parseFloat(s);
        if (isNaN(parsed)) return 0;
        return isNegative ? -parsed : parsed;
      };

      const parsedRecords = jsonData.map((row: any, index: number) => {
         const dateVal = row[mapping.date || 'date'] || row['Date'] || row['Transaction Date'];
         const voucherNoVal = row[mapping.voucherNo || 'voucherNo'] || row['Voucher No'] || row['Reference No'];
         const accountNumVal = row[mapping.accountNumber || 'accountNumber'] || row['Account Number'] || row['Account No'];
         const accountDescVal = row[mapping.accountDescription || 'accountDescription'] || row['Account Description'] || row['Account Name'];
         const descVal = row[mapping.description || 'description'] || row['Description'] || row['Particulars'];
         const narrationVal = row[mapping.narration || 'narration'] || row['Narration'] || row['Remarks'];
         const debitVal = row[mapping.debit || 'debit'] || row['Debit'] || 0;
         const creditVal = row[mapping.credit || 'credit'] || row['Credit'] || 0;
         const balanceVal = row[mapping.balance || 'balance'] || row['Balance'] || 0;

         let idVal = voucherNoVal !== '—' && voucherNoVal !== undefined ? String(voucherNoVal) : `RECORD-${index + 1}`;
         if (idVal === '—') idVal = `RECORD-${index + 1}`;
         
         const dr = cleanAmount(debitVal);
         const cr = cleanAmount(creditVal);
         let bal = cleanAmount(balanceVal);
         if (bal === 0 && (dr !== 0 || cr !== 0)) {
           bal = dr - cr;
         }

         return {
           ...row,
           id: idVal,
           date: dateVal !== '—' && dateVal ? String(dateVal) : '—',
           voucherNo: voucherNoVal !== '—' && voucherNoVal ? String(voucherNoVal) : '—',
           accountNumber: accountNumVal !== '—' && accountNumVal ? String(accountNumVal) : '—',
           accountDescription: accountDescVal !== '—' && accountDescVal ? String(accountDescVal) : '—',
           description: descVal !== '—' && descVal ? String(descVal) : '—',
           narration: narrationVal !== '—' && narrationVal ? String(narrationVal) : '—',
           debit: dr,
           credit: cr,
           balance: bal,
           originalRow: row
         };
      }).filter(Boolean);
      
      setPopulationRecords(parsedRecords);
    } catch (err: any) {
      console.error("Error loading population:", err);
      setPopulationRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const mergedRecords = useMemo(() => {
    return populationRecords.map(pop => {
      const dbSample = assignedSamples.find(s => s.sampleId === pop.id);
      
      let hasResponse = false;
      let supportingDocName = '';
      let supportingDocId = '';
      
      const sampleResponses = allResponses.filter(r => r.sample_id === pop.id);
      if (sampleResponses.length > 0) {
         hasResponse = true; // or check if actually answered
         // Find any response that has a supporting document
         const respWithDoc = sampleResponses.find(r => r.supporting_doc_id);
         if (respWithDoc) {
             supportingDocId = respWithDoc.supporting_doc_id;
             supportingDocName = respWithDoc.supporting_doc_name || 'Document Attached';
         }
      }
      
      if (dbSample) {
        let tc = dbSample.testingClassification;
        let parsedClassifications = [];
        if (Array.isArray(tc)) {
            parsedClassifications = tc;
        } else if (typeof tc === 'string') {
            if (tc === 'Not Selected' || tc === '' || tc === 'Pending Classification') {
                parsedClassifications = [];
            } else {
                parsedClassifications = [tc];
            }
        }
        return { ...pop, ...dbSample, testingClassification: parsedClassifications, isAssigned: true, hasResponse, supportingDocName, supportingDocId };
      }
      return { 
        ...pop, 
        testingClassification: [], 
        testingStatus: 'Pending Classification',
        hasResponse,
        supportingDocName,
        supportingDocId
      };
    }).filter(rec => {
        // if (!rec.isAssigned) return false; // Show all GL records per instructions
        
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (rec.id || '').toLowerCase().includes(q) ||
            (rec.voucherNo || '').toLowerCase().includes(q) ||
            (rec.description || '').toLowerCase().includes(q) ||
            (rec.accountDescription || '').toLowerCase().includes(q)
        );
    });
  }, [populationRecords, assignedSamples, allResponses, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-[#0B0F19] text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-6 shrink-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Sampling Review
              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded font-bold tracking-wider uppercase border border-indigo-500/30">
                Distributor Actions Required
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Review testing populations and complete required data questionnaires</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[240px] max-w-sm">
             <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search voucher or description..." 
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-200 placeholder-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>
          
          {availablePopulations.length > 0 && (
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Population:</span>
               <select 
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  value={selectedPopulation?.id || ''}
                  onChange={(e) => {
                    const found = availablePopulations.find(p => p.id === e.target.value);
                    if (found) handleSelectPopulation(found);
                  }}
               >
                 {availablePopulations.map(pop => (
                   <option key={pop.id} value={pop.id}>{pop.fileName}</option>
                 ))}
               </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-indigo-400 flex flex-col items-center gap-4">
              <Database className="h-8 w-8 animate-bounce" />
              <p className="text-sm font-semibold animate-pulse">Loading Sample Data...</p>
            </div>
          </div>
        ) : (
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
                  <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Testing Classification</th>
                  <th className="py-3 px-4 font-extrabold text-slate-500 uppercase tracking-wider text-[10px] bg-slate-900 text-center">Required Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {mergedRecords.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">No records require action.</td></tr>
                ) : (
                  mergedRecords.map((rec, i) => (
                    <tr key={rec.id + i} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-2 px-4 text-slate-300">{rec.date}</td>
                      <td className="py-2 px-4 font-medium text-slate-200">{rec.voucherNo}</td>
                      <td className="py-2 px-4 text-slate-400 truncate max-w-[150px]" title={rec.accountDescription}>{rec.accountDescription !== '—' ? rec.accountDescription : rec.accountNumber}</td>
                      <td className="py-2 px-4 text-slate-400 truncate max-w-[200px]" title={rec.description}>{rec.description}</td>
                      <td className="py-2 px-4 text-emerald-400/90 font-medium text-right">{formatCurrency(rec.debit, currencyMode)}</td>
                      <td className="py-2 px-4 text-rose-400/90 font-medium text-right">{formatCurrency(rec.credit, currencyMode)}</td>
                      <td className="py-2 px-4 text-slate-400">
                      {rec.testingClassification?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rec.testingClassification.map((c: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 px-4 bg-slate-900/40">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {rec.isAssigned ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenQuestionnaireFor(rec);
                            }}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-md transition-colors whitespace-nowrap"
                          >
                            Questionnaire
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                        
                        {rec.isAssigned && (
                          rec.hasResponse ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                              In Progress
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openQuestionnaireFor && (
        <RequiredDataQuestionnaire 
          transaction={openQuestionnaireFor}
          engagementId={selectedAuditFilter || 'eng-101'}
          currentUser={currentUser}
          onClose={() => setOpenQuestionnaireFor(null)}
          isReviewMode={!currentUser?.role?.includes('Distributor')}
        />
      )}
    </div>
  );
};
