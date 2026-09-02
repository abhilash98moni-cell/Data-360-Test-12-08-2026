import React, { useState } from 'react';
import { Header } from './components/Header';
import { NavigationSidebar, ActiveTab } from './components/NavigationSidebar';
import { DashboardView } from './components/DashboardView';
import { InitialInformationRequestView } from './components/InitialInformationRequestView';
import { EngagementWorkspaceView } from './components/EngagementWorkspaceView';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { NewAuditModal } from './components/NewAuditModal';
import { AuthModal, UserSession } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { MasterControlView } from './components/MasterControlView';
import { AdminApprovalView } from './components/AdminApprovalView';
import { EvidenceManagementView } from './components/EvidenceManagementView';
import { SamplingView } from './components/SamplingView';
import { DistributorSamplingReviewView } from './components/DistributorSamplingReviewView';
import { CommunicationView } from './components/CommunicationView';
import { ReportingView } from './components/ReportingView';
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
  const [evidenceMode, setEvidenceMode] = useState<'All Evidence' | 'Sampling Eligible'>('All Evidence');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('data360_nav_collapsed') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    const handleNavToSampling = () => {
      setActiveTab('sampling');
    };
    window.addEventListener('NAVIGATE_TO_SAMPLING', handleNavToSampling);
    return () => window.removeEventListener('NAVIGATE_TO_SAMPLING', handleNavToSampling);
  }, []);

  const handleToggleNavCollapse = () => {
    const newVal = !isNavCollapsed;
    setIsNavCollapsed(newVal);
    localStorage.setItem('data360_nav_collapsed', String(newVal));
  };

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
  const handleCreateFinding = (findingData: any) => {
    const newFinding = {
      id: `FND-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      status: 'Open',
      ...findingData
    };
    setFindings(prev => [newFinding, ...prev]);
  };


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
      (f.auditedEntity && f.auditedEntity.toLowerCase().includes(activeDistributorFilter.toLowerCase())) ||
      (f.title && f.title.toLowerCase().includes(activeDistributorFilter.toLowerCase()));
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
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onNavigateToProfile={(tab) => {
          setActiveTab('profile');
          if (tab === 'security') {
            setTimeout(() => {
              document.getElementById('security-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 max-w-full overflow-x-hidden">
        
        {/* Left Navigation Drawer */}
        {(!isIIRFullScreen || (activeTab !== 'iir' && activeTab !== 'engagement_workspace')) && (
          <NavigationSidebar 
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
            }}
            openFindingsCount={filteredFindings.filter(f => f.status !== 'Resolved').length}
            flaggedAnomaliesCount={forensicAnomalies.length}
            currentUser={currentUser}
            isCollapsed={isNavCollapsed}
            onToggleCollapse={handleToggleNavCollapse}
          />
        )}

        {/* Content Body View */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden bg-slate-950/90 pb-12">
          
          {(currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor')) && 
           ['dashboard', 'master_control', 'audit_logs'].includes(activeTab) ? (
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
              onFindingCreated={handleCreateFinding} 
              onNavigateToEvidence={() => { setActiveTab('evidence'); setEvidenceMode('Sampling Eligible'); }}
              onNavigateToSamplingReview={() => setActiveTab('sampling_review')}
              selectedClient={selectedClient}
              selectedDistributor={currentUser?.role?.includes('Distributor') ? (currentUser.organization || selectedDistributor) : selectedDistributor}
              selectedAuditFilter={selectedEngId}
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
              
              selectedClient={selectedClient}
              defaultAuditFilter={selectedEngId}
            />
          ) : activeTab === 'sampling_review' ? (
            <SamplingView
              selectedClient={selectedClient}
              selectedDistributor={selectedDistributor}
              selectedAuditFilter={selectedEngId}
              currentUser={currentUser}
              currencyMode={currencyMode}
              onNavigateToUpload={() => setActiveTab('engagement_workspace')}
            />

          ) : activeTab === 'reporting' ? (
            <ReportingView 
              currentUser={currentUser}
              selectedClient={selectedClient}
              selectedDistributor={selectedDistributor}
            />
          ) : activeTab === 'communication' ? (
            <CommunicationView 
              currentUser={currentUser}
              selectedClient={selectedClient}
              selectedDistributor={selectedDistributor}
            />
          ) : activeTab === 'master_control' ? (
            <MasterControlView 
              currentUser={currentUser}
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

      {/* Modals */}
      {isCopilotOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsCopilotOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
               <h3 className="text-sm font-bold text-slate-200">Data360 AI Copilot</h3>
               <button onClick={() => setIsCopilotOpen(false)} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center text-slate-500">
               AI Chat Interface Placeholder
            </div>
          </div>
        </div>
      )}

      {isNewAuditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           {/* Placeholder for New Audit Modal, if we had one extracted */}
           <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl w-full max-w-md animate-fade-in-up">
              <h3 className="text-lg font-bold mb-4 text-white">Create New Audit Engagement</h3>
              <p className="text-slate-400 text-sm mb-6">This feature is not fully implemented in this demo shell.</p>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setIsNewAuditOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">Cancel</button>
              </div>
           </div>
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" onClick={() => setIsNewAuditOpen(false)} />
        </div>
      )}

      <NotificationsModal 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

