import React, { useState } from 'react';
import { Header } from './components/Header';
import { NavigationSidebar, ActiveTab } from './components/NavigationSidebar';
import { DashboardView } from './components/DashboardView';
import { AuditExecutionView } from './components/AuditExecutionView';
import { ForensicAnalyticsView } from './components/ForensicAnalyticsView';
import { FindingsCAPAView } from './components/FindingsCAPAView';
import { InitialInformationRequestView } from './components/InitialInformationRequestView';
import { EngagementWorkspaceView } from './components/EngagementWorkspaceView';
import { BRDDocumentView } from './components/BRDDocumentView';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { NewAuditModal } from './components/NewAuditModal';
import { AuthModal, UserSession } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { MasterControlView } from './components/MasterControlView';
import { AdminApprovalView } from './components/AdminApprovalView';
import { EvidenceManagementView } from './components/EvidenceManagementView';
import { CommunicationView } from './components/CommunicationView';
import { AuditLogsView } from './components/AuditLogsView';
import { ProfileView } from './components/ProfileView';
import { NotificationsModal } from './components/NotificationsModal';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

import { 
  INITIAL_ENGAGEMENTS, 
  INITIAL_FINDINGS, 
  INITIAL_SAMPLING_RUNS, 
  INITIAL_FORENSIC_ANOMALIES,
  INITIAL_ASSIGNMENTS
} from './data/mockData';
import { INITIAL_IIR_REQUESTS, INITIAL_IIR_AUDIT_TRAIL } from './data/iirData';
import { CLIENT_TENANTS, getDistributorsForClient } from './data/clientsAndDistributors';
import { AuditEngagement, AuditFinding, AuditAssignment } from './types';

import { CurrencyMode } from './utils/currencyFormatter';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'platform' | 'brd'>('platform');
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      if (
        pathname.includes('iir') || 
        pathname.includes('distributor') || 
        pathname.includes('portal') || 
        params.get('tab') === 'iir' || 
        params.get('portal') === 'distributor' || 
        hash.includes('distributor') || 
        hash.includes('iir')
      ) {
        return 'iir';
      }
    }
    return 'dashboard';
  });
  const [selectedClient, setSelectedClient] = useState<string>('Apex Electronics Corp');
  const [selectedDistributor, setSelectedDistributor] = useState<string>('Midwest Trading Co.');
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('INR');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('data360_theme_mode');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const handleClientChange = (newClient: string) => {
    setSelectedClient(newClient);
    if (newClient === 'All Clients') {
      setSelectedDistributor('All Distributors');
    } else {
      const dists = getDistributorsForClient(newClient);
      if (dists.length > 0) {
        setSelectedDistributor(dists[0].name);
      } else {
        setSelectedDistributor('All Distributors');
      }
    }
  };

  const handleThemeModeChange = (mode: 'dark' | 'light') => {
    setThemeMode(mode);
    localStorage.setItem('data360_theme_mode', mode);
  };

  // Audit Engagements State
  const [engagements, setEngagements] = useState<AuditEngagement[]>(INITIAL_ENGAGEMENTS);
  const [selectedEngId, setSelectedEngId] = useState<string>('eng-101');

  // Findings & CAPAs State
  const [findings, setFindings] = useState<AuditFinding[]>(INITIAL_FINDINGS);

  // Sampling, Forensic & Assignments State
  const [samplingRuns] = useState(INITIAL_SAMPLING_RUNS);
  const [forensicAnomalies] = useState(INITIAL_FORENSIC_ANOMALIES);
  const [assignments] = useState<AuditAssignment[]>(INITIAL_ASSIGNMENTS);

  // Modals & Drawers
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNewAuditOpen, setIsNewAuditOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isIIRFullScreen, setIsIIRFullScreen] = useState(false);

  // Active User Session State — Loaded from localStorage if available
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('data360_active_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (err) {
          console.error('Failed to parse saved user session:', err);
        }
      }
    }
    return null; // Start unauthenticated so user can sign in / sign up dynamically!
  });

  // Sync client & distributor when currentUser changes
  React.useEffect(() => {
    if (currentUser?.role === 'Distributor' && currentUser.organization) {
      setSelectedDistributor(currentUser.organization);
      // Auto match client tenant if possible
      const matchedClient = CLIENT_TENANTS.find(c => 
        c.distributors.some(d => d.name.toLowerCase() === currentUser.organization.toLowerCase())
      );
      if (matchedClient) {
        setSelectedClient(matchedClient.name);
      }
    }
  }, [currentUser]);

  const handleLogin = (user: UserSession) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('data360_active_user', JSON.stringify(user));
    }
    if (user.role === 'Admin') {
      setActiveTab('admin_approval');
    } else if (user.role === 'Distributor') {
      setActiveTab('engagement_workspace');
      if (user.organization) {
        setSelectedDistributor(user.organization);
        const matchedClient = CLIENT_TENANTS.find(c => 
          c.distributors.some(d => d.name.toLowerCase() === user.organization.toLowerCase())
        );
        if (matchedClient) {
          setSelectedClient(matchedClient.name);
        }
      }
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('data360_active_user');
    }
  };

  // Effective distributor scope
  const activeDistributorFilter = currentUser?.role === 'Distributor' 
    ? (currentUser.organization || selectedDistributor)
    : selectedDistributor;

  // Filter Engagements by selected client and distributor
  const filteredEngagements = engagements.filter(e => {
    const matchesClient = selectedClient === 'All Clients' || e.clientName === selectedClient;
    const matchesDistributor = activeDistributorFilter === 'All Distributors' ||
      e.title.toLowerCase().includes(activeDistributorFilter.toLowerCase()) ||
      e.code.toLowerCase().includes(activeDistributorFilter.toLowerCase());
    return matchesClient && matchesDistributor;
  });

  // Filter Findings by selected client and distributor
  const filteredFindings = findings.filter(f => {
    const eng = engagements.find(e => e.id === f.engagementId);
    const matchesClient = selectedClient === 'All Clients' || (eng && eng.clientName === selectedClient);
    const matchesDistributor = activeDistributorFilter === 'All Distributors' ||
      f.auditedEntity.toLowerCase().includes(activeDistributorFilter.toLowerCase()) ||
      f.title.toLowerCase().includes(activeDistributorFilter.toLowerCase());
    return matchesClient && matchesDistributor;
  });

  // Update Finding Status handler
  const handleUpdateFindingStatus = (id: string, newStatus: any) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  // Add New Engagement handler
  const handleAddEngagement = (newEng: AuditEngagement) => {
    setEngagements([newEng, ...engagements]);
    setSelectedEngId(newEng.id);
  };

  // If unauthenticated, render the clean full-screen Login Page directly (no UI behind it)
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans max-w-full overflow-x-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
      themeMode === 'light' ? 'light-theme bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Header */}
      <Header 
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          if (mode === 'brd') setActiveTab('brd');
          else if (activeTab === 'brd') setActiveTab('dashboard');
        }}
        selectedClient={selectedClient}
        onClientChange={handleClientChange}
        selectedDistributor={selectedDistributor}
        onDistributorChange={setSelectedDistributor}
        currencyMode={currencyMode}
        onCurrencyModeChange={setCurrencyMode}
        themeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenNewAudit={() => setIsNewAuditOpen(true)}
        unreadAlertsCount={3}
        onNavigateToIIR={() => {
          setActiveTab('engagement_workspace');
          setCurrentMode('platform');
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 max-w-full overflow-x-hidden">
        
        {/* Left Navigation Drawer */}
        {(!isIIRFullScreen || (activeTab !== 'iir' && activeTab !== 'engagement_workspace')) && (
          <NavigationSidebar 
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              if (tab === 'brd') setCurrentMode('brd');
              else setCurrentMode('platform');
            }}
            openFindingsCount={filteredFindings.filter(f => f.status !== 'Resolved').length}
            flaggedAnomaliesCount={forensicAnomalies.length}
            currentUser={currentUser}
          />
        )}

        {/* Content Body View */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden bg-slate-950/90 pb-12">
          
          {(currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor')) && 
           ['dashboard', 'engagements', 'sampling', 'forensics', 'master_control', 'audit_logs'].includes(activeTab) ? (
            <div className="p-12 text-center max-w-xl mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl animate-fade-in text-white">
              <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-white">HTTP 403 — Enterprise Access Denied</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distributor user accounts are isolated to their designated portal. Access to practice-level executive dashboards, internal sampling algorithms, and system logs is restricted.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => setActiveTab('engagement_workspace')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Engagement Workspace</span>
                </button>
              </div>
            </div>
          ) : currentMode === 'brd' || activeTab === 'brd' ? (
            <BRDDocumentView />
          ) : activeTab === 'admin_approval' ? (
            <AdminApprovalView 
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardView 
              engagements={filteredEngagements.length > 0 ? filteredEngagements : engagements}
              findings={filteredFindings.length > 0 ? filteredFindings : findings}
              samplingRuns={samplingRuns}
              assignments={assignments}
              onSelectEngagement={(id) => {
                setSelectedEngId(id);
                setActiveTab('sampling');
              }}
              onOpenNewAudit={() => setIsNewAuditOpen(true)}
              onTabChange={setActiveTab}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              currencyMode={currencyMode}
              currentUser={currentUser}
            />
          ) : activeTab === 'engagement_workspace' || activeTab === 'iir' ? (
            <EngagementWorkspaceView 
              selectedClient={selectedClient}
              selectedDistributor={currentUser?.role?.includes('Distributor') ? (currentUser.organization || selectedDistributor) : selectedDistributor}
              currentUser={currentUser}
              initialSubTab={activeTab === 'iir' ? 'iir' : 'questionnaire'}
              isIIRFullScreen={isIIRFullScreen}
              onToggleIIRFullScreen={() => setIsIIRFullScreen(prev => !prev)}
              onDistributorChangeGlobal={setSelectedDistributor}
            />
          ) : activeTab === 'evidence' ? (
            <EvidenceManagementView 
              currentUser={currentUser}
              selectedDistributor={selectedDistributor}
            />
          ) : activeTab === 'communication' ? (
            <CommunicationView 
              currentUser={currentUser}
              selectedClient={selectedClient}
              selectedDistributor={selectedDistributor}
            />
          ) : activeTab === 'engagements' ? (
            <DashboardView 
              engagements={filteredEngagements.length > 0 ? filteredEngagements : engagements}
              findings={filteredFindings.length > 0 ? filteredFindings : findings}
              samplingRuns={samplingRuns}
              assignments={assignments}
              onSelectEngagement={(id) => {
                setSelectedEngId(id);
                setActiveTab('sampling');
              }}
              onOpenNewAudit={() => setIsNewAuditOpen(true)}
              onTabChange={setActiveTab}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              currencyMode={currencyMode}
              currentUser={currentUser}
            />
          ) : activeTab === 'sampling' ? (
            <AuditExecutionView 
              engagements={filteredEngagements.length > 0 ? filteredEngagements : engagements}
              selectedEngagementId={selectedEngId}
              onSelectEngagement={setSelectedEngId}
              samplingRuns={samplingRuns}
              currencyMode={currencyMode}
            />
          ) : activeTab === 'forensics' ? (
            <ForensicAnalyticsView 
              anomalies={forensicAnomalies}
              currencyMode={currencyMode}
            />
          ) : activeTab === 'findings' ? (
            <FindingsCAPAView 
              findings={filteredFindings.length > 0 ? filteredFindings : findings}
              onUpdateFindingStatus={handleUpdateFindingStatus}
              currencyMode={currencyMode}
              currentUser={currentUser}
            />
          ) : activeTab === 'master_control' ? (
            <MasterControlView 
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          ) : activeTab === 'audit_logs' ? (
            <AuditLogsView 
              currentUser={currentUser}
            />
          ) : activeTab === 'profile' ? (
            <ProfileView 
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          ) : null}

        </main>

      </div>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
      />

      {/* New Audit Modal */}
      <NewAuditModal 
        isOpen={isNewAuditOpen} 
        onClose={() => setIsNewAuditOpen(false)}
        onAddEngagement={handleAddEngagement}
      />

      {/* Account & Login/Register Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* In-App Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as ActiveTab);
          setCurrentMode('platform');
        }}
      />

    </div>
  );
}
