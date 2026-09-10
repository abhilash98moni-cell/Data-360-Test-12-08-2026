import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  LayoutDashboard, 
  Search, 
  Bell, 
  UserCheck, 
  ChevronDown,
  Layers,
  Sun,
  Moon,
  Database,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  User,
  Lock,
  LogOut,
  Check
} from 'lucide-react';

import { CurrencyMode } from '../utils/currencyFormatter';
import { CLIENT_TENANTS, getDistributorsForClient, getAllRegisteredDistributors, DistributorInfo } from '../data/clientsAndDistributors';
import { UserSession } from './AuthModal';

interface HeaderProps {
  selectedClient: string;
  onClientChange: (client: string) => void;
  selectedDistributor: string;
  onDistributorChange: (distributor: string) => void;
  currencyMode: CurrencyMode;
  onCurrencyModeChange: (mode: CurrencyMode) => void;
  themeMode: 'dark' | 'light';
  onThemeModeChange: (mode: 'dark' | 'light') => void;
  onOpenCopilot: () => void;
  onOpenNewAudit: () => void;
  unreadAlertsCount: number;
  onNavigateToIIR?: () => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: (tab: 'profile' | 'security') => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedClient,
  onClientChange,
  selectedDistributor,
  onDistributorChange,
  currencyMode,
  onCurrencyModeChange,
  themeMode,
  onThemeModeChange,
  onOpenCopilot,
  onOpenNewAudit,
  unreadAlertsCount,
  onNavigateToIIR,
  currentUser,
  onOpenAuth,
  onOpenNotifications,
  onLogout,
  onNavigateToProfile
}) => {
  const [isDistributorDropdownOpen, setIsDistributorDropdownOpen] = useState(false);
  const [distributorSearchQuery, setDistributorSearchQuery] = useState('');
  const distributorDropdownRef = React.useRef<HTMLDivElement>(null);

  // Baseline initial demo engagement IDs to distinguish from newly created audit engagements
  const BASELINE_DEMO_ENGAGEMENT_IDS = React.useMemo(() => new Set([
    'eng-101', 'eng-102', 'eng-103', 'eng-104', 'eng-105', 'eng-106'
  ]), []);

  const availableDistributors = React.useMemo(() => {
    const all = getAllRegisteredDistributors();
    const sourceList: DistributorInfo[] = (all && all.length > 0) ? all : getDistributorsForClient(selectedClient);

    // Identify any distributors attached to newly created audit engagements
    const newEngagementDistributors: DistributorInfo[] = [];
    const newEngagementDistributorNames = new Set<string>();

    if (typeof window !== 'undefined') {
      try {
        const storedEngs = localStorage.getItem('data360_engagements');
        if (storedEngs) {
          const parsed = JSON.parse(storedEngs);
          if (Array.isArray(parsed)) {
            parsed.forEach((eng: any) => {
              // Any engagement beyond the initial baseline demo set
              if (eng && eng.id && !BASELINE_DEMO_ENGAGEMENT_IDS.has(eng.id)) {
                const distName = (eng.distributorName || '').trim();
                if (distName) {
                  newEngagementDistributorNames.add(distName.toLowerCase());
                  if (!sourceList.some(d => d.name.toLowerCase().trim() === distName.toLowerCase())) {
                    newEngagementDistributors.push({
                      id: `dist-${eng.id}`,
                      name: distName,
                      code: eng.distributorCode || `${distName.substring(0, 3).toUpperCase()}-001`,
                      region: eng.location || 'Active Engagement Territory',
                      status: eng.status || 'Planning'
                    });
                  }
                }
                sourceList.forEach(d => {
                  if (
                    (eng.title && eng.title.toLowerCase().includes(d.name.toLowerCase())) ||
                    (eng.location && eng.location.toLowerCase().includes(d.name.toLowerCase())) ||
                    (d.code && eng.location && eng.location.toLowerCase().includes(d.code.toLowerCase()))
                  ) {
                    newEngagementDistributorNames.add(d.name.toLowerCase().trim());
                  }
                });
              }
            });
          }
        }
      } catch (e) {}
    }

    const combinedList = [...sourceList, ...newEngagementDistributors];

    // For current audit engagement: show only Midwest Trading Co. (MDT-8092).
    // Dynamically include additional distributors only if attached to a newly created audit engagement.
    return combinedList.filter(d => {
      const lower = d.name.toLowerCase().trim();
      if (lower === 'midwest trading co.' || d.code === 'MDT-8092' || lower.includes('midwest trading')) {
        return true;
      }
      if (newEngagementDistributorNames.has(lower)) {
        return true;
      }
      return false;
    });
  }, [selectedClient, isDistributorDropdownOpen, BASELINE_DEMO_ENGAGEMENT_IDS]);

  // If the active distributor was previously pointing to an excluded distributor without an engagement, fallback to Midwest Trading Co.
  React.useEffect(() => {
    const lowerSelected = selectedDistributor.toLowerCase().trim();
    if (lowerSelected === 'all distributors') return;

    const isValid = availableDistributors.some(
      d => d.name.toLowerCase().trim() === lowerSelected ||
           (d.code && lowerSelected.includes(d.code.toLowerCase())) ||
           lowerSelected.includes(d.name.toLowerCase().trim()) ||
           (lowerSelected.includes('midwest') && d.name.toLowerCase().includes('midwest'))
    );
    if (!isValid) {
      onDistributorChange('Midwest Trading Co.');
    }
  }, [selectedDistributor, availableDistributors, onDistributorChange]);

  const filteredDistributors = React.useMemo(() => {
    if (!distributorSearchQuery.trim()) return availableDistributors;
    const query = distributorSearchQuery.toLowerCase().trim();
    return availableDistributors.filter(d => 
      d.name.toLowerCase().includes(query) ||
      (d.code && d.code.toLowerCase().includes(query)) ||
      (d.region && d.region.toLowerCase().includes(query))
    );
  }, [availableDistributors, distributorSearchQuery]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        distributorDropdownRef.current && 
        !distributorDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDistributorDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDistributorDropdownOpen) {
        setIsDistributorDropdownOpen(false);
      }
    };
    if (isDistributorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDistributorDropdownOpen]);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-3 sm:px-4 lg:px-6 py-2.5 shadow-md w-full max-w-full">
      <div className="flex items-center justify-between gap-2 max-w-full">
        
        {/* Brand & Client Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center font-bold text-base shadow-inner ring-1 ring-white/20 shrink-0">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Data360
                </span>
                <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SaaS
                </span>
              </div>
            </div>
          </div>

          {/* Distributor Selector - Working dropdown */}
          {currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor') ? (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs text-emerald-300 font-semibold shadow-inner">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="truncate max-w-[130px] sm:max-w-[180px] md:max-w-[220px]">
                <span className="font-bold text-emerald-300 truncate">{currentUser.organization || selectedDistributor}</span>
              </div>
            </div>
          ) : (
            <div className="relative" ref={distributorDropdownRef} id="header-distributor-selector-container">
              <button
                id="header-distributor-selector-btn"
                type="button"
                onClick={() => {
                  setIsDistributorDropdownOpen(prev => !prev);
                  setDistributorSearchQuery('');
                }}
                aria-expanded={isDistributorDropdownOpen}
                aria-haspopup="listbox"
                className={`flex items-center gap-1.5 sm:gap-2 bg-slate-950/80 hover:bg-slate-800/90 border rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shadow-sm group ${
                  isDistributorDropdownOpen 
                    ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-slate-800/90 text-white' 
                    : 'border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
                title={`Currently selected distributor: ${selectedDistributor}. Click to switch distributor.`}
              >
                <div className="flex items-center gap-1 shrink-0">
                  <div className="h-4.5 w-4.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 hidden xl:inline">Distributor:</span>
                </div>

                <span className="text-xs font-bold text-emerald-400 truncate max-w-[110px] sm:max-w-[150px] md:max-w-[190px] lg:max-w-[230px]">
                  {selectedDistributor}
                </span>

                <ChevronDown 
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isDistributorDropdownOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-slate-200'
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              {isDistributorDropdownOpen && (
                <div 
                  id="header-distributor-dropdown-menu"
                  role="listbox"
                  aria-label="Distributor list"
                  className="absolute left-0 mt-2 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/50"
                >
                  <div className="px-3 pb-2 pt-1 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Distributor Context
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      {availableDistributors.length} Available
                    </span>
                  </div>

                  {availableDistributors.length > 5 && (
                    <div className="px-2 pt-2 pb-1">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          id="distributor-search-input"
                          type="text"
                          value={distributorSearchQuery}
                          onChange={(e) => setDistributorSearchQuery(e.target.value)}
                          placeholder="Search distributor or code..."
                          className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  <div className="max-h-72 overflow-y-auto py-1 px-1.5 space-y-0.5 custom-scrollbar">
                    {/* All Distributors Option */}
                    {(!distributorSearchQuery.trim() || 'all distributors'.includes(distributorSearchQuery.toLowerCase())) && (
                      <button
                        id="distributor-opt-all"
                        type="button"
                        role="option"
                        aria-selected={selectedDistributor === 'All Distributors'}
                        onClick={() => {
                          onDistributorChange('All Distributors');
                          setIsDistributorDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          selectedDistributor === 'All Distributors'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-slate-100">All Distributors</div>
                            <div className="text-[10px] text-slate-400 font-normal">Consolidated multi-entity overview</div>
                          </div>
                        </div>
                        {selectedDistributor === 'All Distributors' && (
                          <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-1" />
                        )}
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800/80" />

                    {/* Specific Distributors */}
                    {filteredDistributors.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No distributors found matching "{distributorSearchQuery}"
                      </div>
                    ) : (
                      filteredDistributors.map((d) => {
                        const isSelected = selectedDistributor.toLowerCase() === d.name.toLowerCase() ||
                          (selectedDistributor.toLowerCase().includes('midwest') && d.name.toLowerCase().includes('midwest'));
                        const displayName = d.code && !d.name.includes(d.code) ? `${d.name} (${d.code})` : d.name;
                        return (
                          <button
                            key={d.id || d.name}
                            id={`distributor-opt-${d.id || d.name.replace(/\s+/g, '-').toLowerCase()}`}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              onDistributorChange(d.name);
                              setIsDistributorDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                              isSelected
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200 group-hover:text-white'}`}>
                                  {displayName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 truncate">
                                <span className="truncate">{d.region}</span>
                                {d.status && (
                                  <>
                                    <span className="text-slate-600">•</span>
                                    <span className={`${
                                      d.status === 'Active Audit' ? 'text-emerald-400' :
                                      d.status === 'Under Review' ? 'text-amber-400' :
                                      'text-slate-400'
                                    }`}>
                                      {d.status}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* India / Global Currency Switcher */}
          <div className="flex items-center bg-slate-950/80 rounded-lg border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => onCurrencyModeChange('INR')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                currencyMode === 'INR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch monetary values to Indian Rupees (₹ Cr / ₹ Lakhs)"
            >
              <span>🇮🇳</span>
              <span className="text-[11px]">INR</span>
            </button>
            <button
              onClick={() => onCurrencyModeChange('USD')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                currencyMode === 'USD'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch monetary values to US Dollars ($)"
            >
              <span>🌐</span>
              <span className="text-[11px]">USD</span>
            </button>
          </div>

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={() => onThemeModeChange(themeMode === 'dark' ? 'light' : 'dark')}
            className={`hidden md:flex p-1.5 rounded-lg border items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
              themeMode === 'dark'
                ? 'bg-slate-950/80 text-amber-300 border-slate-800 hover:bg-slate-800'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {themeMode === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 shrink-0">

          {/* AI Copilot Button */}
          <button 
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/30 text-amber-200 hover:text-amber-100 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Supabase DB Connection Checker Badge */}
          <SupabaseHeaderChecker />

          {/* New Audit Launch Button (Auditors only) */}
          {currentUser?.role !== 'Distributor' && !currentUser?.role?.includes('Distributor') && (
            <button 
              onClick={onOpenNewAudit}
              className="hidden xl:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors shadow-sm"
            >
              <span>+ New Audit</span>
            </button>
          )}

          {/* Risk Notification Bell */}
          <div className="relative">
            <button 
              id="header-notification-bell-btn"
              onClick={onOpenNotifications}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all relative cursor-pointer flex items-center justify-center"
              title="View In-App Notifications & Alerts"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadAlertsCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping pointer-events-none"></span>
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-lg ring-2 ring-slate-900 leading-none pointer-events-none">
                    {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* User Profile / Auth Button */}
          <div className="pl-1.5 border-l border-slate-800 relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => {
                    if (onNavigateToProfile) onNavigateToProfile('profile');
                  }}
                  className="flex items-center gap-2 p-1 hover:bg-slate-800/80 rounded-xl transition-all border border-transparent hover:border-slate-700/80 cursor-pointer text-left"
                  title="View Profile"
                >
                  <div className={`h-7 w-7 rounded-full font-bold text-xs flex items-center justify-center border ${
                    currentUser.role === 'Auditor' 
                      ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300' 
                      : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                  }`}>
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name}</p>
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-all shadow-md cursor-pointer shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">Sign In / Register</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

const SupabaseHeaderChecker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; latencyMs?: number; url?: string; error?: string; message?: string } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/supabase/health');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setStatus({
          connected: false,
          error: `Unable to connect to the Data360 database. Server returned non-JSON response (${res.status}).`
        });
        return;
      }
      const data = await res.json();
      if (!res.ok && !data.error) {
        data.error = `HTTP Error ${res.status}`;
      }
      setStatus(data);
    } catch (err: any) {
      setStatus({ connected: false, error: err.message || 'Unable to connect to the Data360 database.' });
    } finally {
      setTesting(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!status && !testing) {
      runTest();
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
        title="Check Supabase Connection Status"
      >
        <Database className="h-3.5 w-3.5 text-purple-400" />
        <span className="hidden md:inline">Supabase DB</span>
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                  <Database className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Supabase PostgreSQL Health Check</h3>
                  <p className="text-[11px] text-slate-400 font-mono">jellfdqrymlnvebdcwpj.supabase.co</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Pings your Supabase PostgreSQL server to test read/write permissions for core tables (<span className="font-mono text-purple-300">pending_signup_requests</span>, <span className="font-mono text-purple-300">profiles</span>, <span className="font-mono text-purple-300">evidence_files</span>).
              </p>

              {testing && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-purple-300">
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                  <span>Connecting to Supabase Cloud DB...</span>
                </div>
              )}

              {status && !testing && (
                <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                  status.connected 
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="flex items-center gap-2">
                      {status.connected ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-rose-400" />}
                      {status.connected ? 'SUPABASE CONNECTED (LIVE)' : 'CONNECTION FAILED'}
                    </span>
                    {status.latencyMs !== undefined && <span className="text-xs text-slate-300 font-bold">{status.latencyMs} ms</span>}
                  </div>
                  <p className="text-xs">{status.message || status.error}</p>
                  {status.url && <p className="text-[10px] text-slate-400 opacity-80 break-all">URL: {status.url}</p>}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={runTest}
                disabled={testing}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span>Re-Test Live Connection</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
