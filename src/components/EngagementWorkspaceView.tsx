import React, { useState } from 'react';
import {
  FileText,
  HelpCircle,
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';
import { BusinessQuestionnaireView } from './questionnaire/BusinessQuestionnaireView';
import { InitialInformationRequestView } from './InitialInformationRequestView';
import { INITIAL_IIR_REQUESTS, INITIAL_IIR_AUDIT_TRAIL } from '../data/iirData';
import { UserSession } from './AuthModal';

export type EngagementSubTab = 'questionnaire' | 'iir' | 'sampling';

interface EngagementWorkspaceViewProps {
  selectedClient: string;
  selectedDistributor: string;
  currentUser: UserSession | null;
  initialSubTab?: EngagementSubTab;
  isIIRFullScreen?: boolean;
  onToggleIIRFullScreen?: () => void;
  onDistributorChangeGlobal?: (distributor: string) => void;
}

export const EngagementWorkspaceView: React.FC<EngagementWorkspaceViewProps> = ({
  selectedClient,
  selectedDistributor,
  currentUser,
  initialSubTab = 'questionnaire',
  isIIRFullScreen = false,
  onToggleIIRFullScreen,
  onDistributorChangeGlobal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<EngagementSubTab>(initialSubTab);

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const isAuditor = !isDistributor;

  const distributorProp = isDistributor
    ? currentUser?.organization || selectedDistributor
    : selectedDistributor !== 'All Distributors'
    ? selectedDistributor
    : 'Midwest Trading Co.';

  return (
    <div className="space-y-4">
      {/* Top Workspace Header & Sub-Tab Navigation */}
      {!isIIRFullScreen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-inner shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">ENGAGEMENT WORKSPACE</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-emerald-400 font-semibold">{distributorProp}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Coordinated compliance workflow for business questionnaires, initial information requests (IRL), and fieldwork data.
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="grid grid-flow-col auto-cols-fr bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shadow-inner shrink-0 gap-1.5 min-w-[320px] sm:min-w-[480px]">
            <button
              onClick={() => setActiveSubTab('questionnaire')}
              className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                activeSubTab === 'questionnaire'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">Business Questionnaire</span>
            </button>

            <button
              onClick={() => setActiveSubTab('iir')}
              className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                activeSubTab === 'iir'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">IRL</span>
            </button>

            {/* Sampling tab: Strictly for Auditors */}
            {isAuditor && (
              <button
                onClick={() => setActiveSubTab('sampling')}
                className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                  activeSubTab === 'sampling'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="truncate">Sampling</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab Content Rendering */}
      {activeSubTab === 'questionnaire' && (
        <BusinessQuestionnaireView
          selectedClient={selectedClient}
          selectedDistributor={distributorProp}
          currentUser={currentUser}
          onNavigateToIRL={() => setActiveSubTab('iir')}
        />
      )}

      {activeSubTab === 'iir' && (
        <InitialInformationRequestView
          initialRequests={INITIAL_IIR_REQUESTS}
          initialAuditTrail={INITIAL_IIR_AUDIT_TRAIL}
          auditName={`${selectedClient !== 'All Clients' ? selectedClient : 'Apex Group'} FY26 Distributor Channel Audit`}
          distributorName={distributorProp}
          selectedClientProp={selectedClient}
          selectedDistributorProp={distributorProp}
          onDistributorChangeGlobal={onDistributorChangeGlobal}
          auditPeriod="FY 2025 - Q1 to Q4 (Apr 1, 2025 – Mar 31, 2026)"
          dueDate="Aug 25, 2026"
          currentUser={currentUser}
          isFullScreen={isIIRFullScreen}
          onToggleFullScreen={onToggleIIRFullScreen}
        />
      )}

      {activeSubTab === 'sampling' && isAuditor && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-4xl mx-auto shadow-xl">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Engagement Sampling & Statistical Testing</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Sample selection and testing will be available here. Configure Monetary Unit Sampling (MUS) and stratified populations once questionnaire and IRL evidence are accepted.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left max-w-2xl mx-auto">
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Target Population</span>
              <p className="text-xs font-semibold text-slate-200">142,000 Invoices</p>
              <p className="text-[10px] text-slate-400">Ledger value: ₹18.84 Cr</p>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence Interval</span>
              <p className="text-xs font-semibold text-emerald-400">95% Confidence</p>
              <p className="text-[10px] text-slate-400">MUS standard threshold</p>
            </div>
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Workflow State</span>
              <p className="text-xs font-semibold text-amber-300">Pending Fieldwork</p>
              <p className="text-[10px] text-slate-400">Awaiting questionnaire sign-off</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
