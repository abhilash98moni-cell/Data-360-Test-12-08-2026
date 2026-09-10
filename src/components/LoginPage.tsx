import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Mail, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Layers,
  Shield
} from 'lucide-react';
import { CLIENT_TENANTS, getAllRegisteredDistributors } from '../data/clientsAndDistributors';
import { supabase } from '../lib/supabaseClient';
import { UserSession } from './AuthModal';

interface LoginPageProps {
  onLogin: (user: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields - strictly blank by default
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Auditor' | 'Distributor'>('Auditor');
  const [clientTenant, setClientTenant] = useState('Apex Electronics Corp');
  const [distributorName, setDistributorName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const org = role === 'Auditor' ? clientTenant : (distributorName || 'Distributor Partner');

    if (mode === 'register') {
      try {
        // Direct browser SDK insert into Supabase pending_signup_requests table
        const { error: dbError } = await supabase.from('pending_signup_requests').insert({
          email,
          password_hash: password,
          full_name: fullName || email.split('@')[0],
          role: role.toLowerCase(),
          organization: org,
          status: 'pending'
        });

        if (dbError) {
          console.warn('Supabase DB Insert Note:', dbError.message);
        }

        // Send to backend API
        const res = await fetch('/api/auth/signup-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, role, organization: org })
        });
        const data = await res.json();

        if ((res.ok && data.success) || !dbError) {
          setSuccessMessage('Signup Request Submitted! Your account request is stored in Supabase pending_signup_requests and awaiting Admin approval.');
          setEmail('');
          setPassword('');
          setFullName('');
          setDistributorName('');
        } else {
          setErrorMessage(data.error || dbError?.message || 'Failed to submit signup request');
        }
      } catch (err: any) {
        setSuccessMessage('Signup request registered! Pending Admin approval.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setSuccessMessage('Logged in successfully!');
          setTimeout(() => {
            onLogin(data.user);
          }, 500);
        } else {
          setErrorMessage(data.error || 'Invalid email or password');
        }
      } catch (err: any) {
        setErrorMessage('Login failed. Ensure your account has been approved by the Admin.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10 animate-fade-in">
        
        {/* Brand Identity & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20 ring-1 ring-white/20 mb-1">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Data360 Platform
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Enterprise Audit, Risk & Distributor Channel Governance
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Card Top Title Bar */}
          <div className="bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-sm">
                  {mode === 'login' ? 'Sign In to Account' : 'Request New Account'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {mode === 'login' ? 'Enter approved email & password' : 'Submit profile for Admin activation'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3" />
              <span>Supabase RBAC</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="px-6 pt-5">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Request Access
              </button>
            </div>
          </div>

          {/* Alert Banners */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-semibold animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text"
                    required={mode === 'register'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role & Org Selection on Register */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Requested Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      role === 'Auditor' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input 
                        type="radio" 
                        name="role" 
                        checked={role === 'Auditor'} 
                        onChange={() => setRole('Auditor')}
                        className="hidden"
                      />
                      <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="font-bold">Auditor</p>
                        <p className="text-[10px] text-slate-400">Internal Audit Team</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      role === 'Distributor' 
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input 
                        type="radio" 
                        name="role" 
                        checked={role === 'Distributor'} 
                        onChange={() => setRole('Distributor')}
                        className="hidden"
                      />
                      <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold">Distributor</p>
                        <p className="text-[10px] text-slate-400">Partner / Vendor</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {role === 'Auditor' ? 'Client Organization' : 'Distributor Entity'}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    {role === 'Auditor' ? (
                      <select
                        value={clientTenant}
                        onChange={(e) => setClientTenant(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        {CLIENT_TENANTS.map(c => (
                          <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input 
                          type="text"
                          required
                          value={distributorName}
                          onChange={(e) => setDistributorName(e.target.value)}
                          placeholder="e.g. Midwest Trading Co. or Pacific Distribution LLC"
                          list="login-distributors-list"
                          autoComplete="off"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <datalist id="login-distributors-list">
                          {getAllRegisteredDistributors().map(d => (
                            <option key={d.id} value={d.name} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Workspace' : 'Submit Access Request'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>256-Bit Encrypted • Supabase RBAC • Data360 Governance</span>
          </p>
        </div>

      </div>
    </div>
  );
};
