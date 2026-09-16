import React, { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';

import { CurrencyMode } from '../utils/currencyFormatter';
import { UserSession } from './AuthModal';
import { AuditEngagement } from '../types';

interface HeaderProps {
  selectedClient?: string;
  onClientChange?: (client: string) => void;
  selectedDistributor?: string;
  onDistributorChange?: (distributor: string) => void;
  currencyMode: CurrencyMode;
  onCurrencyModeChange: (mode: CurrencyMode) => void;
  themeMode: 'dark' | 'light';
  onThemeModeChange: (mode: 'dark' | 'light') => void;
  onOpenCopilot: () => void;
  onOpenNewAudit?: () => void;
  unreadAlertsCount: number;
  onNavigateToIIR?: () => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
  onNavigateToProfile?: (tab: 'profile' | 'security') => void;
  liveAudits?: AuditEngagement[];
  isLoadingAudits?: boolean;
  selectedAuditId?: string;
  onAuditSelect?: (auditId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currencyMode,
  onCurrencyModeChange,
  themeMode,
  onThemeModeChange,
  onOpenCopilot,
  unreadAlertsCount,
  currentUser,
  onOpenAuth,
  onOpenNotifications,
  onNavigateToProfile
}) => {
  const isDistributor = currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor');

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-3 sm:px-4 lg:px-6 py-2.5 shadow-md w-full max-w-full">
      <div className="flex items-center justify-between gap-2 max-w-full">
        
        <div className="flex flex-1 items-center gap-4 shrink-0">
          {/* Currency Switcher */}
          <div className="hidden lg:flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => onCurrencyModeChange('INR')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                currencyMode === 'INR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇮🇳</span>
              <span className="text-[11px]">INR</span>
            </button>
            <button
              onClick={() => onCurrencyModeChange('USD')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                currencyMode === 'USD'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌐</span>
              <span className="text-[11px]">USD</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => onThemeModeChange(themeMode === 'dark' ? 'light' : 'dark')}
            className={`hidden md:flex p-1.5 rounded-lg border items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
              themeMode === 'dark'
                ? 'bg-slate-950/80 text-amber-300 border-amber-500/30 hover:bg-slate-800'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {themeMode === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-600" />
            )}
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center justify-center mr-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950/90 border border-indigo-500/30 rounded-lg shadow-sm">
              <span className={`h-2 w-2 rounded-full ${isDistributor ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                {isDistributor ? 'DISTRIBUTOR VIEW' : 'AUDITOR VIEW'}
              </span>
            </div>
          </div>

          <button 
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          <SupabaseHeaderChecker />

          <div className="relative">
            <button 
              onClick={onOpenNotifications}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all relative cursor-pointer flex items-center justify-center"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-slate-900 leading-none">
                {unreadAlertsCount || 3}
              </span>
            </button>
          </div>

          <div className="pl-3 border-l border-slate-800 relative">
            {currentUser ? (
              <button
                onClick={() => {
                  if (onNavigateToProfile) onNavigateToProfile('profile');
                }}
                className="flex items-center gap-2 hover:bg-slate-800/80 p-1 rounded-xl transition-all border border-transparent cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center border bg-indigo-500/20 border-indigo-400/40 text-indigo-300">
                  {currentUser.avatarInitials || (currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (isDistributor ? 'DU' : 'AS'))}
                </div>
                <div className="hidden lg:flex flex-col items-start justify-center">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {currentUser.name || (isDistributor ? 'Distributor Admin' : 'Abhilash S')}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                    {currentUser.organization || currentUser.role || (isDistributor ? 'Distributor' : 'Auditor')}
                  </p>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer shrink-0"
              >
                <LogIn className="h-4 w-4" />
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
          error: `Unable to connect to the DMP database. Server returned non-JSON response (${res.status}).`
        });
        return;
      }
      const data = await res.json();
      if (!res.ok && !data.error) {
        data.error = `HTTP Error ${res.status}`;
      }
      setStatus(data);
    } catch (err: any) {
      setStatus({ connected: false, error: err.message || 'Unable to connect to the DMP database.' });
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
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
      >
        <Database className="h-3.5 w-3.5 text-purple-400" />
        <span className="hidden md:inline">Supabase DB</span>
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

