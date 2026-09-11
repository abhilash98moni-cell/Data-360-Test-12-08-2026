import React, { useState, useEffect } from 'react';
import { AuditEngagement, AuditType, RiskLevel, UserSession } from '../types';
import { 
  X, 
  Plus, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  Briefcase, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Lock, 
  AlertCircle,
  Database,
  Sparkles
} from 'lucide-react';
import { 
  CLIENT_TENANTS, 
  registerNewDistributor, 
  getAllRegisteredDistributors 
} from '../data/clientsAndDistributors';

interface NewAuditModalProps {
  isOpen: boolean;
  selectedDistributor?: string;
  onClose: () => void;
  onAddEngagement: (newEng: AuditEngagement, newDistributorName: string, newClientName: string) => void;
  defaultClient?: string;
  currentUser?: UserSession | null;
}

export const NewAuditModal: React.FC<NewAuditModalProps> = ({ selectedDistributor, 
  isOpen,
  onClose,
  onAddEngagement,
  defaultClient = 'Apex Electronics Corp',
  currentUser
}) => {
  const [clientName, setClientName] = useState(defaultClient || 'Apex Electronics Corp');
  const [distributorName, setDistributorName] = useState(selectedDistributor && selectedDistributor !== 'All Distributors' && selectedDistributor !== 'No Distributors Assigned' ? selectedDistributor : '');
  const [distributorCode, setDistributorCode] = useState('');
  const [region, setRegion] = useState('North America / West Division');
  const [auditId, setAuditId] = useState('');
  const [auditCode, setAuditCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AuditType>('Distributor');
  const [riskRating, setRiskRating] = useState<RiskLevel>('Medium');
  const [leadAuditor, setLeadAuditor] = useState(currentUser?.name || 'Sarah Jenkins');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetCompletion, setTargetCompletion] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [auditPeriod, setAuditPeriod] = useState('FY 2025-26');
  const [location, setLocation] = useState('On-site & Remote Audit');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate default ID and title whenever distributor name or type changes
  useEffect(() => {
    if (isOpen && selectedDistributor && selectedDistributor !== 'All Distributors' && selectedDistributor !== 'No Distributors Assigned') {
      setDistributorName(selectedDistributor);
    }
    if (!isOpen) return;

    const randNum = Math.floor(100 + Math.random() * 900);
    const generatedAuditId = `eng-${Date.now().toString().slice(-4)}`;
    setAuditId(generatedAuditId);

    const typePrefix = type.substring(0, 3).toUpperCase();
    const generatedCode = `AUD-2026-${typePrefix}-${randNum}`;
    setAuditCode(generatedCode);

    if (distributorName.trim()) {
      const codeSuggestion = distributorName
        .split(/\s+/)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 4) + `-${Math.floor(1000 + Math.random() * 9000)}`;
      setDistributorCode(codeSuggestion);
      setTitle(`FY26 ${distributorName.trim()} ${type} Compliance & Rebate Audit`);
    } else {
      setDistributorCode('');
      setTitle(`FY26 Channel Partner ${type} Compliance Audit`);
    }
  }, [isOpen]);

  // Update title when distributor name changes
  const handleDistributorNameChange = (val: string) => {
    setDistributorName(val);
    if (errorMsg) setErrorMsg('');
    if (val.trim()) {
      const initials = val
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 4);
      setDistributorCode(`${initials || 'DIST'}-${Math.floor(1000 + Math.random() * 9000)}`);
      setTitle(`FY26 ${val.trim()} ${type} Compliance & Rebates Audit`);
    }
  };

  const handleTypeChange = (newType: AuditType) => {
    setType(newType);
    const dist = distributorName.trim() || 'Channel Partner';
    setTitle(`FY26 ${dist} ${newType} Compliance & Rebates Audit`);
    const rand = Math.floor(100 + Math.random() * 900);
    setAuditCode(`AUD-2026-${newType.substring(0, 3).toUpperCase()}-${rand}`);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!distributorName.trim()) {
      setErrorMsg('Please enter a valid Distributor Name.');
      return;
    }

    if (!auditId.trim()) {
      setErrorMsg('Please provide a unique Engagement ID.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanDistributor = distributorName.trim();
      const cleanClient = clientName.trim() || 'Apex Electronics Corp';
      const cleanAuditId = auditId.trim();
      const cleanDistCode = distributorCode.trim() || `${cleanDistributor.substring(0, 3).toUpperCase()}-1001`;

      // Validate against the server
      const token = localStorage.getItem('supabase_token');
      if (token) {
        const res = await fetch('/api/audits/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
             title: title.trim(),
             code: cleanDistCode,
             distributorName: cleanDistributor
          })
        });
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Server rejected audit creation.');
        }
      }

      // 1. Register new distributor in master tenant directory so it appears in all dropdowns
      registerNewDistributor(cleanClient, {
        name: cleanDistributor,
        code: cleanDistCode,
        region: region.trim() || 'General Territory',
        status: 'Planning'
      });

      // 2. Construct the fresh, isolated AuditEngagement object
      const newAudit: AuditEngagement = {
        id: cleanAuditId,
        code: auditCode.trim() || `AUD-2026-${type.substring(0, 3).toUpperCase()}-001`,
        title: title.trim() || `FY26 ${cleanDistributor} Audit Engagement`,
        clientName: cleanClient,
        clientIndustry: 'Consumer Technology & Enterprise Distribution',
        distributorName: cleanDistributor,
        distributorCode: cleanDistCode,
        auditPeriod: auditPeriod.trim() || 'FY 2025-26',
        type,
        status: 'Planning',
        riskRating,
        leadAuditor: leadAuditor.trim() || 'Sarah Jenkins',
        teamSize: 2,
        startDate,
        targetCompletion,
        progressPercent: 0,
        financialExposure: 0,
        sampledRecordsCount: 0,
        totalPopulationCount: 0,
        findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
        location: `${region.trim()} (${cleanDistCode})`
      };

      // 3. Trigger callback to open engagement workspace in fresh state
      onAddEngagement(newAudit, cleanDistributor, cleanClient);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to initialize audit engagement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingDistributors = getAllRegisteredDistributors();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl flex flex-col my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Initiate New Audit Engagement
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Isolated Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create a completely new, clean audit engagement with its own isolated database context.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)] text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Client & Distributor Identity */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span>Client & Distributor Entities</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Client Organization <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Apex Electronics Corp"
                    list="client-options-list"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="client-options-list">
                    {CLIENT_TENANTS.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Select existing enterprise client or enter a new client organization.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Distributor Name <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={distributorName}
                  onChange={(e) => handleDistributorNameChange(e.target.value)}
                  placeholder="e.g. Pacific Distribution LLC"
                  list="distributor-suggestions-list"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <datalist id="distributor-suggestions-list">
                  {existingDistributors.map(d => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Type a new distributor or select an existing entity.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Distributor Entity Code</label>
                <input 
                  type="text"
                  value={distributorCode}
                  onChange={(e) => setDistributorCode(e.target.value)}
                  placeholder="e.g. PDL-9102"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Region / Territory</label>
                <input 
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Pacific Northwest (USA)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Engagement Metadata & IDs */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Engagement Scope & Identifiers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Audit / Engagement ID <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={auditId}
                  onChange={(e) => setAuditId(e.target.value)}
                  placeholder="e.g. eng-104 or AUD-2026-004"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Isolated workspace identifier.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Audit Code</label>
                <input 
                  type="text"
                  value={auditCode}
                  onChange={(e) => setAuditCode(e.target.value)}
                  placeholder="e.g. AUD-2026-DIST-004"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Audit Stream Type</label>
                <select 
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as AuditType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Distributor">Distributor Audit</option>
                  <option value="Financial">Financial General Ledger</option>
                  <option value="Compliance">Regulatory Compliance</option>
                  <option value="Forensic">Forensic Investigation</option>
                  <option value="Operational">Operational Audit</option>
                  <option value="Vendor">Vendor & Procurement</option>
                  <option value="Dealer">Dealer Network</option>
                  <option value="Franchise">Franchise Royalty</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Engagement Title</label>
              <input 
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FY26 Pacific Distribution LLC Distributor Compliance & Rebates Audit"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 3: Timeline & Audit Details */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeline, Auditor & Governance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Audit Period</label>
                <input 
                  type="text"
                  value={auditPeriod}
                  onChange={(e) => setAuditPeriod(e.target.value)}
                  placeholder="e.g. FY 2025-26"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Commencement Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Sign-Off Date</label>
                <input 
                  type="date"
                  value={targetCompletion}
                  onChange={(e) => setTargetCompletion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Lead Engagement Auditor</label>
                <input 
                  type="text"
                  value={leadAuditor}
                  onChange={(e) => setLeadAuditor(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Initial Risk Rating</label>
                <select 
                  value={riskRating}
                  onChange={(e) => setRiskRating(e.target.value as RiskLevel)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                  <option value="Critical">Critical Risk</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Audit Location / Reach</label>
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote & Field Site"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Context Isolation Guarantee Banner */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-start gap-3">
            <Database className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-300 space-y-1 leading-relaxed">
              <span className="font-semibold text-white block">Strict Workspace Isolation Guaranteed</span>
              <p>
                The new engagement will immediately launch in a dedicated, isolated database context. 
                Business Questionnaires, IRL requirements, GL population files, sampling workpapers, and reports will start completely fresh—without mixing any records from other audits or distributors.
              </p>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Target distributor will immediately gain access to their fresh portal upon login.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer text-xs disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Launch & Open Workspace</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
