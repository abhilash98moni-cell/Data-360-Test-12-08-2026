import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, ChevronRight, FileDown, 
  CheckCircle, AlertCircle, Edit, Save, Lock, ArrowLeft,
  Settings, ZoomIn, ZoomOut, Download
} from 'lucide-react';
import { UserSession } from './AuthModal';
import { supabase } from '../lib/supabaseClient';
import { ReportMetadata, ReportFinding } from '../types';

interface ReportingViewProps {
  currentUser: UserSession | null;
  selectedClient: string;
  selectedDistributor: string;
}

export const ReportingView: React.FC<ReportingViewProps> = ({
  currentUser,
  selectedClient,
  selectedDistributor
}) => {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [activeReport, setActiveReport] = useState<ReportMetadata | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Form states for creating a new report
  const [newReportAuditId, setNewReportAuditId] = useState('eng-101');
  const [newReportTemplate, setNewReportTemplate] = useState('distributor_audit_report');

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error && error.code !== '42P01') {
        console.error('Error fetching reports:', error);
      } else if (data) {
        setReports(data as ReportMetadata[]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set active report form states
  const [editSummary, setEditSummary] = useState('');
  const [editOverview, setEditOverview] = useState<any>({});
  const [editFindings, setEditFindings] = useState<ReportFinding[]>([]);

  useEffect(() => {
    if (activeReport) {
      setEditSummary(activeReport.executiveSummary || '');
      setEditOverview(activeReport.overview || {});
      setEditFindings(activeReport.findings || []);
      setValidationErrors([]);
    }
  }, [activeReport]);

  const handleCreateDraft = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    const newReport: ReportMetadata = {
      id: `rep-${Date.now()}`,
      clientId: selectedClient,
      distributorId: selectedDistributor,
      auditId: newReportAuditId,
      reportType: 'Distributor Audit Report',
      templateId: newReportTemplate,
      templateVersion: '1.0',
      reportVersion: '0.1',
      status: 'DRAFT',
      createdBy: currentUser.email,
      createdAt: new Date().toISOString(),
      findings: [],
      overview: {
        name: selectedDistributor,
        location: '',
        employees: '',
        contracts: '',
        contacts: '',
        products: '',
        sales: '',
        services: '',
        territories: '',
        percentBusiness: '',
        grossMargin: '',
        inventory: '',
        accountsReceivable: ''
      }
    };
    
    try {
      const { error } = await supabase
        .from('audit_reports')
        .insert([{
          id: newReport.id,
          client_id: newReport.clientId,
          distributor_id: newReport.distributorId,
          audit_id: newReport.auditId,
          report_type: newReport.reportType,
          template_id: newReport.templateId,
          template_version: newReport.templateVersion,
          report_version: newReport.reportVersion,
          status: newReport.status,
          created_by: newReport.createdBy,
          created_at: newReport.createdAt,
          findings: newReport.findings,
          overview: newReport.overview
        }]);
        
      if (error && error.code !== '42P01') throw error;
      
      setReports([newReport, ...reports]);
      setIsCreating(false);
      setActiveReport(newReport);
    } catch (err) {
      console.error('Failed to create report', err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveReport = async () => {
    if (!activeReport || !currentUser) return;
    setIsSaving(true);
    
    const updated = {
      ...activeReport,
      executiveSummary: editSummary,
      overview: editOverview,
      findings: editFindings
    };
    
    try {
      const { error } = await supabase
        .from('audit_reports')
        .update({
          executive_summary: editSummary,
          overview: editOverview,
          findings: editFindings
        })
        .eq('id', activeReport.id);
        
      if (error && error.code !== '42P01') throw error;
      
      setActiveReport(updated);
      setReports(reports.map(r => r.id === updated.id ? updated : r));
    } catch (err) {
      console.error('Failed to save report', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = () => {
    if (!activeReport) return;
    const errors: string[] = [];
    
    if (!editOverview.location) errors.push('Overview: Location is required.');
    if (!editOverview.employees) errors.push('Overview: Employees is required.');
    if (!editSummary || editSummary.trim().length < 50) errors.push('Executive Summary is too short.');
    
    editFindings.forEach((f, idx) => {
      if (!f.title) errors.push(`Finding #${f.findingNumber}: Title is required.`);
      if (!f.description) errors.push(`Finding #${f.findingNumber}: Description is required.`);
      if (!f.contractSection) errors.push(`Finding #${f.findingNumber}: Contract Reference is required.`);
    });
    
    setValidationErrors(errors);
    setIsValidating(true);
    return errors.length === 0;
  };

  const handleFinalize = async () => {
    if (!handleValidate()) return;
    if (!activeReport || !currentUser) return;
    
    setIsFinalizing(true);
    
    try {
      // First save current state
      await saveReport();
      
      const payload = {
        report: {
          ...activeReport,
          executiveSummary: editSummary,
          overview: editOverview,
          findings: editFindings
        },
        userEmail: currentUser.email,
        userName: currentUser.name
      };
      
      const res = await fetch('/api/reporting/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const finalized = {
        ...activeReport,
        status: 'FINAL',
        reportVersion: '1.0',
        finalizedBy: currentUser.email,
        finalizedAt: new Date().toISOString(),
        docxFileId: data.docxFileId,
        pdfFileId: data.pdfFileId
      } as ReportMetadata;
      
      setActiveReport(finalized);
      setReports(reports.map(r => r.id === finalized.id ? finalized : r));
      
    } catch (err: any) {
      console.error('Finalization failed:', err);
      alert(`Finalization failed: ${err.message}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  const addFinding = () => {
    const num = editFindings.length + 1;
    setEditFindings([...editFindings, {
      id: `fnd-${Date.now()}`,
      findingNumber: num,
      severity: 'Medium',
      title: '',
      description: '',
      contractSection: '',
      rootCause: '',
      impact: '',
      evidence: [],
      recommendedActionClient: '',
      recommendedActionDistributor: '',
      owner: '',
      dueDate: '',
      sources: []
    }]);
  };

  const updateFinding = (idx: number, field: keyof ReportFinding, value: any) => {
    const updated = [...editFindings];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditFindings(updated);
  };
  
  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!activeReport) return;
    const fileId = format === 'docx' ? activeReport.docxFileId : activeReport.pdfFileId;
    if (fileId) {
       window.open(`/api/drive/download/${fileId}`, '_blank');
       return;
    }
    
    // If no stored ID, generate on the fly
    try {
      const payload = {
        report: {
          ...activeReport,
          executiveSummary: editSummary,
          overview: editOverview,
          findings: editFindings
        },
        format
      };
      
      const res = await fetch('/api/reporting/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to generate report');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Distributor_Audit_Report_${activeReport.distributorId.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  if (!currentUser) return <div className="p-10 text-white">Please log in.</div>;

  if (activeReport) {
    const isLocked = activeReport.status === 'FINAL';
    
    return (
      <div className="h-screen flex flex-col bg-slate-950 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveReport(null)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{activeReport.reportType}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{activeReport.distributorId}</span>
                <span>•</span>
                <span>v{activeReport.reportVersion}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  activeReport.status === 'FINAL' ? 'bg-emerald-500/20 text-emerald-400' :
                  activeReport.status === 'IN REVIEW' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {activeReport.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleDownload('docx')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
              <FileDown className="h-4 w-4 text-blue-400" />
              Download Word
            </button>
            <button 
              onClick={() => handleDownload('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
              <FileDown className="h-4 w-4 text-red-400" />
              Download PDF
            </button>
            {!isLocked && (
              <>
                <button 
                  onClick={saveReport}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </button>
                <button 
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isFinalizing ? 'Finalizing...' : 'Finalize Report'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Master Detail View */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Sections & Finding Builder */}
          <div className="w-[500px] border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-y-auto">
            {isValidating && validationErrors.length > 0 && (
              <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Validation Errors ({validationErrors.length})
                </div>
                <ul className="list-disc pl-5 text-xs text-red-300 space-y-1">
                  {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          
            {/* Distributor Overview */}
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Building className="h-4 w-4 text-indigo-400" />
                Distributor Overview
              </h3>
              <div className="space-y-3">
                {['location', 'employees', 'contracts', 'products', 'sales'].map((field) => (
                  <div key={field}>
                    <label className="block text-xs text-slate-500 mb-1 capitalize">{field}</label>
                    <input 
                      type="text" 
                      value={editOverview[field] || ''}
                      onChange={e => setEditOverview({...editOverview, [field]: e.target.value})}
                      disabled={isLocked}
                      placeholder="[Information Required]"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-indigo-400" />
                Executive Summary
              </h3>
              <textarea 
                value={editSummary}
                onChange={e => setEditSummary(e.target.value)}
                disabled={isLocked}
                placeholder="Enter executive summary..."
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm h-32 resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* Finding Builder */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Finding Builder
                </h3>
                {!isLocked && (
                  <button 
                    onClick={addFinding}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="h-3 w-3" /> Add Finding
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {editFindings.map((finding, idx) => (
                  <div key={finding.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-200">Finding #{finding.findingNumber}</span>
                      <select 
                        value={finding.severity}
                        onChange={e => updateFinding(idx, 'severity', e.target.value)}
                        disabled={isLocked}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                      >
                        <option>Critical</option>
                        <option>High</option>
                        <option>Significant</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Title</label>
                      <input 
                        type="text" 
                        value={finding.title}
                        onChange={e => updateFinding(idx, 'title', e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Description</label>
                      <textarea 
                        value={finding.description}
                        onChange={e => updateFinding(idx, 'description', e.target.value)}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm h-20 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Contract Ref</label>
                        <input 
                          type="text" 
                          value={finding.contractSection}
                          onChange={e => updateFinding(idx, 'contractSection', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Due Date</label>
                        <input 
                          type="date" 
                          value={finding.dueDate}
                          onChange={e => updateFinding(idx, 'dueDate', e.target.value)}
                          disabled={isLocked}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {editFindings.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm">
                    No findings added yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Report Preview */}
          <div className="flex-1 bg-slate-800 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-6 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-1 shadow-xl">
              <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-1.5 hover:bg-slate-700 rounded text-slate-400"><ZoomOut className="h-4 w-4" /></button>
              <span className="text-xs font-mono w-12 text-center">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="p-1.5 hover:bg-slate-700 rounded text-slate-400"><ZoomIn className="h-4 w-4" /></button>
            </div>
            
            <div className="flex-1 overflow-auto p-12 flex justify-center custom-scrollbar">
              <div 
                className="bg-white text-black shadow-2xl origin-top transition-transform"
                style={{ 
                  width: '816px', 
                  minHeight: '1056px',
                  transform: `scale(${zoomLevel / 100})`,
                  padding: '96px 96px'
                }}
              >
                {/* Simulated Document Preview */}
                <div className="text-[10px] text-slate-500 text-right mb-16 uppercase tracking-widest border-b border-slate-200 pb-2">
                  Confidential
                </div>
                
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{activeReport.reportType}</h1>
                <h2 className="text-xl text-slate-700 mb-12">{activeReport.distributorId}</h2>
                
                <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-4">1. Executive Summary</h3>
                <p className="text-sm leading-relaxed text-slate-700 mb-8 whitespace-pre-wrap">
                  {editSummary || '[Executive Summary text will appear here]'}
                </p>

                <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-4">2. Distributor Overview</h3>
                <table className="w-full text-sm text-left mb-8 border-collapse">
                  <tbody>
                    {['location', 'employees', 'contracts'].map(field => (
                      <tr key={field} className="border-b border-slate-200">
                        <th className="py-2 capitalize w-1/3 text-slate-900">{field}</th>
                        <td className="py-2 text-slate-700">{editOverview[field] || '[Pending]'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-900 pb-1 mb-4">3. Summary of Findings</h3>
                <p className="text-sm leading-relaxed text-slate-700 mb-4">
                  Total Findings: {editFindings.length}
                </p>
                <table className="w-full text-sm text-left mb-8 border border-slate-300">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="py-2 px-3 border border-slate-300">No.</th>
                      <th className="py-2 px-3 border border-slate-300">Title</th>
                      <th className="py-2 px-3 border border-slate-300">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editFindings.map(f => (
                      <tr key={f.id}>
                        <td className="py-2 px-3 border border-slate-300">{f.findingNumber}</td>
                        <td className="py-2 px-3 border border-slate-300">{f.title || '[No Title]'}</td>
                        <td className="py-2 px-3 border border-slate-300 font-medium">{f.severity}</td>
                      </tr>
                    ))}
                    {editFindings.length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-slate-500 italic">No findings</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reporting Landing Page
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reporting</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and generate standardized Distributor Audit Reports</p>
        </div>
        {!currentUser?.role?.includes('Distributor') && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
            Create Report
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h2 className="text-lg font-bold text-white mb-6">Create New Report</h2>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Client</label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300">{selectedClient}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Distributor</label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300">{selectedDistributor}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audit Engagement</label>
              <select 
                value={newReportAuditId}
                onChange={e => setNewReportAuditId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="eng-101">{selectedClient} FY26 Distributor Channel Audit</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Report Template</label>
              <select 
                value={newReportTemplate}
                onChange={e => setNewReportTemplate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="distributor_audit_report">Distributor Audit Report (Tie_out_Report.docx Format)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-5 py-2 hover:bg-slate-800 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateDraft}
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search reports..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder-slate-500"
            />
          </div>
          <select className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 w-40">
            <option>All Status</option>
            <option>Draft</option>
            <option>In Review</option>
            <option>Final</option>
          </select>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-slate-950/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Distributor</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Report Type</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Version</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-slate-900/20">
                  No reports found. Create a new report to get started.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr 
                  key={report.id} 
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => setActiveReport(report)}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-200">{report.distributorId}</div>
                    <div className="text-xs text-slate-500">{report.clientId}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{report.reportType}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase border ${
                      report.status === 'FINAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      report.status === 'IN REVIEW' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {report.status === 'FINAL' && <Lock className="h-3 w-3" />}
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">v{report.reportVersion}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition-colors inline-block" />
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

export default ReportingView;
