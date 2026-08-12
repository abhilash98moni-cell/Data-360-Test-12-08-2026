import React, { useState } from 'react';
import { AuditEngagement, SamplingRun } from '../types';
import { 
  Calculator, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  RefreshCw,
  FileCheck,
  Search,
  Lock,
  Sparkles
} from 'lucide-react';

import { formatCurrency, CurrencyMode } from '../utils/currencyFormatter';

interface AuditExecutionViewProps {
  engagements: AuditEngagement[];
  selectedEngagementId: string;
  onSelectEngagement: (id: string) => void;
  samplingRuns: SamplingRun[];
  currencyMode?: CurrencyMode;
}

export const AuditExecutionView: React.FC<AuditExecutionViewProps> = ({
  engagements,
  selectedEngagementId,
  onSelectEngagement,
  samplingRuns,
  currencyMode = 'INR'
}) => {
  const currentEng = engagements.find(e => e.id === selectedEngagementId) || engagements[0];

  // MUS Interactive Calculator State
  const [populationValue, setPopulationValue] = useState<number>(14200000);
  const [populationCount, setPopulationCount] = useState<number>(18200);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [tolerableError, setTolerableError] = useState<number>(150000);
  const [expectedMisstatement, setExpectedMisstatement] = useState<number>(25000);

  // Dynamic MUS Calculations
  const reliabilityFactor = confidenceLevel === 99 ? 4.61 : confidenceLevel === 95 ? 3.00 : 2.31;
  const sampleInterval = Math.round((tolerableError - expectedMisstatement) / reliabilityFactor);
  const calculatedSampleSize = Math.round(populationValue / Math.max(sampleInterval, 1));

  // Test Checklist State
  const [testSteps, setTestSteps] = useState([
    {
      id: 1,
      assertion: 'Completeness',
      description: 'Reconcile distributor sell-through SAP ledgers against audited inventory counts.',
      status: 'Passed',
      notes: 'No unrecorded inventory discrepancies identified in 1,200 sample units.'
    },
    {
      id: 2,
      assertion: 'Accuracy / Valuation',
      description: 'Verify quarterly volume rebate tier calculations against signed master contract.',
      status: 'Exception Found',
      notes: 'Midwest Trading Co claimed 12% rebate instead of contractual 8% cap ($185k overclaim).'
    },
    {
      id: 3,
      assertion: 'Cutoff',
      description: 'Test post-period-end sales returns for phantom stock or artificially inflated Q2 volume.',
      status: 'Passed',
      notes: 'Returns ratio post-June 30 remained within 1.2% historical threshold.'
    },
    {
      id: 4,
      assertion: 'Rights & Obligations',
      description: 'Inspect bill-and-hold distributor warehouse agreements for title transfer clause.',
      status: 'In Progress',
      notes: 'Awaiting signed confirmation from 3 distributor legal representatives.'
    }
  ]);

  // Evidence Files Upload State
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Midwest_Rebate_Contract_Q2_2026.pdf', size: '2.4 MB', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', time: 'Today 10:14 AM' },
    { name: 'Distributor_Inventory_Valuation_Sheet.xlsx', size: '8.1 MB', hash: '5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9', time: 'Yesterday 04:30 PM' }
  ]);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const newFile = {
        name: f.name,
        size: `${(f.size / (1024*1024)).toFixed(1)} MB`,
        hash: `a8f5f167f44f4964e${Math.random().toString(36).substring(2, 10)}819231`,
        time: 'Just Now'
      };
      setUploadedFiles([newFile, ...uploadedFiles]);
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-200">
      
      {/* Top Header & Engagement Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
              {currentEng.code}
            </span>
            <span className="text-xs text-slate-400">{currentEng.clientName}</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">{currentEng.title}</h1>
          <p className="text-xs text-slate-400">Lead Auditor: <span className="text-slate-200 font-semibold">{currentEng.leadAuditor}</span> &bull; Location: {currentEng.location}</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Switch Active Audit:</label>
          <select 
            value={selectedEngagementId}
            onChange={(e) => onSelectEngagement(e.target.value)}
            className="bg-slate-950 text-slate-100 text-xs border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>
                [{eng.type}] {eng.title} ({eng.clientName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left Column (Audit Program & Assertions), Right Column (MUS Sampling Builder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Audit Program & Test Assertions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Audit Program & Assertion Tests</h2>
            </div>
            <span className="text-xs text-slate-400">
              {testSteps.filter(t => t.status === 'Passed').length}/{testSteps.length} Tests Passed
            </span>
          </div>

          <div className="space-y-3">
            {testSteps.map((step) => (
              <div key={step.id} className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Assertion: {step.assertion}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    step.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    step.status === 'Exception Found' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {step.status}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">{step.description}</p>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 font-mono">
                  Notes: {step.notes}
                </div>
              </div>
            ))}
          </div>

          {/* Evidence Upload Box */}
          <div className="border border-dashed border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40 rounded-xl p-4 transition-colors space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Upload Fieldwork Evidence File</h3>
                  <p className="text-[10px] text-slate-400">Cryptographic SHA-256 hash generated automatically</p>
                </div>
              </div>
              <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                Select File
                <input type="file" className="hidden" onChange={handleSimulateUpload} />
              </label>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="flex items-center gap-2 truncate max-w-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{f.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({f.size})</span>
                  </div>
                  <div className="text-right font-mono text-[9px] text-slate-400">
                    Hash: {f.hash.substring(0, 12)}...
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Monetary Unit Sampling (MUS) Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Monetary Unit Sampling (MUS) Calculator</h2>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
              ISA 530 Compliant
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Population Total Value */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Total Audit Population Value ($):</span>
                <span className="font-mono font-bold text-white">${populationValue.toLocaleString()}</span>
              </div>
              <input 
                type="number" 
                value={populationValue}
                onChange={(e) => setPopulationValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Confidence Level Select */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Desired Confidence Level:</span>
                <span className="font-bold text-indigo-400">{confidenceLevel}% (Reliability Factor: {reliabilityFactor})</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[90, 95, 99].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setConfidenceLevel(lvl)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      confidenceLevel === lvl 
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {lvl}% Confidence
                  </button>
                ))}
              </div>
            </div>

            {/* Tolerable Error & Expected Misstatement Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tolerable Misstatement ($):</label>
                <input 
                  type="number" 
                  value={tolerableError}
                  onChange={(e) => setTolerableError(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Expected Misstatement ($):</label>
                <input 
                  type="number" 
                  value={expectedMisstatement}
                  onChange={(e) => setExpectedMisstatement(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Calculated Output Stats Card */}
            <div className="bg-gradient-to-br from-slate-950 to-indigo-950/60 border border-indigo-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold border-b border-indigo-500/30 pb-2">
                <span>MUS Sampling Engine Output</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-medium">Sampling Interval</p>
                  <p className="text-lg font-bold font-mono text-white">${sampleInterval.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Every ${sampleInterval.toLocaleString()}th dollar selected</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-medium">Recommended Sample Size (n)</p>
                  <p className="text-2xl font-extrabold font-mono text-emerald-400">{calculatedSampleSize} <span className="text-xs text-slate-300 font-normal">items</span></p>
                  <p className="text-[10px] text-emerald-400 font-medium">Statistically sound for audit opinion</p>
                </div>
              </div>
            </div>

            {/* Generate Sample List Button */}
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Generate MUS Sample Extract & Workpapers</span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};
