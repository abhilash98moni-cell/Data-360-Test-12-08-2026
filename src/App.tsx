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
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    const saved = localStorage.getItem('data360_currency_mode');
    return (saved === 'USD' || saved === 'INR') ? (saved as CurrencyMode) : 'INR';
  });
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('data360_theme_mode');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const handleCurrencyModeChange = (mode: CurrencyMode) => {
    setCurrencyMode(mode);
    try {
      localStorage.setItem('data360_currency_mode', mode);
    } catch (e) {
      console.error('Failed to save currency mode', e);
    }
  };

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
  const [engagements, setEngagements] = useState<AuditEngagement[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('data360_engagements');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return INITIAL_ENGAGEMENTS;
  });
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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isIIRFullScreen, setIsIIRFullScreen] = useState(false);
  const [targetVoucherNo, setTargetVoucherNo] = useState<string | null>(null);

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

  // Periodic polling for unread notifications
  React.useEffect(() => {
    const fetchUnread = async () => {
      try {
        const params = new URLSearchParams();
        if (currentUser?.role) params.set('role', currentUser.role);
        if (currentUser?.email) params.set('userEmail', currentUser.email);
        const dist = currentUser?.organization || selectedDistributor;
        if (dist) params.set('distributor', dist);
        const res = await fetch(`/api/notifications?${params.toString()}`, {
          headers: {
            'x-user-role': currentUser?.role || '',
            'x-user-organization': dist || '',
            'x-user-email': currentUser?.email || ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.notifications)) {
            const unread = data.notifications.filter((n: any) => !n.isRead).length;
            setUnreadNotificationsCount(unread);
          }
        }
      } catch (e) {}
    };
    fetchUnread();
    window.addEventListener('notification-updated', fetchUnread);
    const interval = setInterval(fetchUnread, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', fetchUnread);
    };
  }, [currentUser?.role, currentUser?.organization, currentUser?.email, selectedDistributor]);

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

  
  const filteredAssignments = assignments.filter(a => {
    const eng = engagements.find(e => e.id === a.engagementId);
    if (!eng) return false;
    const matchesClient = selectedClient === 'All Clients' || eng.clientName === selectedClient;
    const matchesDistributor = activeDistributorFilter === 'All Distributors' ||
      eng.title.toLowerCase().includes(activeDistributorFilter.toLowerCase()) ||
      eng.code.toLowerCase().includes(activeDistributorFilter.toLowerCase());
    return matchesClient && matchesDistributor;
  });

  const filteredSamplingRuns = samplingRuns.filter(s => {
    const eng = engagements.find(e => e.id === s.engagementId);
    if (!eng) return false;
    const matchesClient = selectedClient === 'All Clients' || eng.clientName === selectedClient;
    const matchesDistributor = activeDistributorFilter === 'All Distributors' ||
      eng.title.toLowerCase().includes(activeDistributorFilter.toLowerCase()) ||
      eng.code.toLowerCase().includes(activeDistributorFilter.toLowerCase());
    return matchesClient && matchesDistributor;
  });

  // Update Finding Status handler
  const handleUpdateFindingStatus = (id: string, newStatus: any) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  // Add New Engagement handler
  const handleAddEngagement = (newEng: AuditEngagement, newDistributorName?: string, newClientName?: string) => {
    setEngagements(prev => {
      const updated = [newEng, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('data360_engagements', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    setSelectedEngId(newEng.id);
    if (newClientName) {
      setSelectedClient(newClientName);
    } else if (newEng.clientName) {
      setSelectedClient(newEng.clientName);
    }
    const distName = newDistributorName || (newEng as any).distributorName;
    if (distName) {
      setSelectedDistributor(distName);
    }
    // After creation, open the new engagement as a completely fresh workspace
    setActiveTab('engagement_workspace');
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
        onCurrencyModeChange={handleCurrencyModeChange}
        themeMode={themeMode}
        onThemeModeChange={handleThemeModeChange}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenNewAudit={() => setIsNewAuditOpen(true)}
        unreadAlertsCount={unreadNotificationsCount}
        onNavigateToIIR={() => {
          setActiveTab('engagement_workspace');
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(prev => !prev)}
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
           ['master_control', 'audit_logs'].includes(activeTab) ? (
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
              engagements={filteredEngagements}
              findings={filteredFindings}
              samplingRuns={filteredSamplingRuns}
              assignments={filteredAssignments}
              onSelectEngagement={(id) => {
                setSelectedEngId(id);
                const eng = engagements.find(e => e.id === id);
                if (eng) {
                  if (eng.clientName) setSelectedClient(eng.clientName);
                  if (eng.distributorName) {
                    setSelectedDistributor(eng.distributorName);
                  } else {
                    const dists = getDistributorsForClient(eng.clientName);
                    const matched = dists.find(d => eng.title.includes(d.name) || eng.location.includes(d.name) || (d.code && eng.location.includes(d.code)));
                    if (matched) {
                      setSelectedDistributor(matched.name);
                    }
                  }
                }
                setActiveTab('engagement_workspace');
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
              currencyMode={currencyMode}
              initialSubTab={activeTab === 'iir' ? 'iir' : 'questionnaire'}
              isIIRFullScreen={isIIRFullScreen}
              onToggleIIRFullScreen={() => setIsIIRFullScreen(prev => !prev)}
              onDistributorChangeGlobal={setSelectedDistributor}
              targetVoucherNo={targetVoucherNo}
            />
          ) : activeTab === 'evidence' ? (
            <EvidenceManagementView 
              currentUser={currentUser}
              selectedDistributor={selectedDistributor}
              
              selectedClient={selectedClient}
              defaultAuditFilter={selectedEngId}
            />
          ) : activeTab === 'sampling_review' || activeTab === 'sampling' ? (
            <SamplingView
              selectedClient={selectedClient}
              selectedDistributor={currentUser?.role?.includes('Distributor') ? (currentUser.organization || selectedDistributor) : selectedDistributor}
              selectedAuditFilter={selectedEngId}
              currentUser={currentUser}
              currencyMode={currencyMode}
              onNavigateToUpload={() => setActiveTab('engagement_workspace')}
              targetVoucherNo={targetVoucherNo}
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

      <NewAuditModal 
        isOpen={isNewAuditOpen}
        onClose={() => setIsNewAuditOpen(false)} selectedDistributor={selectedDistributor}
        onAddEngagement={handleAddEngagement}
        defaultClient={selectedClient}
        currentUser={currentUser}
      />

      <NotificationsModal 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        currentUser={currentUser}
        selectedDistributor={selectedDistributor}
        onUpdateUnreadCount={setUnreadNotificationsCount}
        onNavigateToTab={(tab, targetVoucher) => {
          if (targetVoucher) {
            setTargetVoucherNo(targetVoucher);
          }
          if (tab === 'sampling') {
            setActiveTab('engagement_workspace');
          } else if (tab === 'sampling_review') {
            setActiveTab('sampling_review');
          } else if (tab === 'engagement_workspace') {
            setActiveTab('engagement_workspace');
          } else {
            setActiveTab(tab);
          }
        }}
      />
    </div>
  );
}

