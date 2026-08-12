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
  LogIn
} from 'lucide-react';

import { CurrencyMode } from '../utils/currencyFormatter';
import { CLIENT_TENANTS, getDistributorsForClient } from '../data/clientsAndDistributors';
import { UserSession } from './AuthModal';

interface HeaderProps {
  currentMode: 'platform' | 'brd';
  onModeChange: (mode: 'platform' | 'brd') => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
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
  onOpenNotifications
}) => {
  const currentDistributors = getDistributorsForClient(selectedClient);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-3 sm:px-4 lg:px-6 py-2.5 shadow-md w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 max-w-full">
        
        {/* Brand & Client Switcher */}
        <div className="flex items-center gap-3 shrink-0">
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

          {/* Scope Selector - Responsive Visibility */}
          {currentUser?.role === 'Distributor' || currentUser?.role?.includes('Distributor') ? (
            <div className="hidden xl:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs text-emerald-300 font-semibold shadow-inner">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <div className="truncate max-w-[200px]">
                <span className="font-bold text-emerald-300 truncate">{currentUser.organization || selectedDistributor}</span>
              </div>
            </div>
          ) : (
            <div className="hidden 2xl:flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-100 text-xs font-semibold">Apex Electronics</span>
              </div>

              <span className="text-slate-600 font-bold">&gt;</span>

              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <select 
                  value={selectedDistributor} 
                  onChange={(e) => onDistributorChange(e.target.value)}
                  className="bg-transparent text-emerald-300 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All Distributors" className="bg-slate-900 text-slate-200">
                    All Distributors ({currentDistributors.length})
                  </option>
                  {currentDistributors.map(d => (
                    <option key={d.id} value={d.name} className="bg-slate-900 text-slate-200">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* India / Global Currency Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950/80 rounded-lg border border-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => onCurrencyModeChange('INR')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
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
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
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

        {/* Center: Mode Switcher */}
        <div className="hidden lg:flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 shadow-inner shrink-0">
          <button
            onClick={() => onModeChange('platform')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentMode === 'platform' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Live Audit Workspace</span>
          </button>
          
          <button
            onClick={() => onModeChange('brd')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentMode === 'brd' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>BRD Spec</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Switch to Distributor Portal (Auditors only) */}
          {onNavigateToIIR && currentUser?.role !== 'Distributor' && !currentUser?.role?.includes('Distributor') && (
            <button
              onClick={onNavigateToIIR}
              className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-400/40 text-indigo-200 hover:text-white rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="Open the Distributor Portal"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-300" />
              <span>Distributor Portal</span>
            </button>
          )}

          {/* AI Copilot Button */}
          <button 
            onClick={onOpenCopilot}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/30 text-amber-200 hover:text-amber-100 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

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
              onClick={onOpenNotifications}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors relative cursor-pointer"
              title="View In-App Notifications & Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900 animate-ping"></span>
              )}
            </button>
          </div>

          {/* User Profile / Auth Button */}
          <div className="pl-1.5 border-l border-slate-800">
            {currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 hover:bg-slate-800/80 rounded-xl transition-all border border-transparent hover:border-slate-700/80 cursor-pointer text-left"
                title="Click to view Account & Session Settings"
              >
                <div className={`h-7 w-7 rounded-full font-bold text-xs flex items-center justify-center border ${
                  currentUser.role === 'Auditor' 
                    ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300' 
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                }`}>
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name}</p>
                </div>
              </button>
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
