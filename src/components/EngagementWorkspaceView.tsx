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
import { SamplingView } from './SamplingView';
import { INITIAL_IIR_REQUESTS, INITIAL_IIR_AUDIT_TRAIL } from '../data/iirData';
import { UserSession } from './AuthModal';

export type EngagementSubTab = 'questionnaire' | 'iir' | 'sampling';

interface EngagementWorkspaceViewProps {
  currencyMode?: string;
  selectedClient: string;
  selectedDistributor: string;
  currentUser: UserSession | null;
  onFindingCreated?: (finding: any) => void;
  onNavigateToEvidence?: () => void;
  initialSubTab?: EngagementSubTab;
  isIIRFullScreen?: boolean;
  onToggleIIRFullScreen?: () => void;
  onDistributorChangeGlobal?: (distributor: string) => void;
}

export const EngagementWorkspaceView: React.FC<EngagementWorkspaceViewProps> = ({
  selectedClient,
  selectedDistributor,
  currentUser,
  onFindingCreated,
  onNavigateToEvidence,
  initialSubTab = 'questionnaire',
  isIIRFullScreen = false,
  onToggleIIRFullScreen,
  onDistributorChangeGlobal,
  currencyMode
}) => {
  const [activeSubTab, setActiveSubTab] = useState<EngagementSubTab>(initialSubTab);

  React.useEffect(() => {
    const handleSwitch = () => setActiveSubTab('sampling');
    window.addEventListener('SWITCH_TO_SAMPLING_TAB', handleSwitch);
    return () => window.removeEventListener('SWITCH_TO_SAMPLING_TAB', handleSwitch);
  }, []);

  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');
  const isAuditor = !isDistributor;

  const distributorProp = isDistributor
    ? currentUser?.organization || selectedDistributor
    : selectedDistributor !== 'All Distributors'
    ? selectedDistributor
    : selectedDistributor;

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
          currencyMode={currencyMode}
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
        <SamplingView onFindingCreated={onFindingCreated} onNavigateToEvidence={onNavigateToEvidence} 
          selectedClient={selectedClient}
          selectedDistributor={distributorProp}
          currentUser={currentUser}
          currencyMode={currencyMode}
        />
      )}
    </div>
  );
};
