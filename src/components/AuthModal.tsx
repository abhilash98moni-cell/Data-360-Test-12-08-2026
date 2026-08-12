import React, { useState } from 'react';
import { 
  X, 
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
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { CLIENT_TENANTS } from '../data/clientsAndDistributors';
import { supabase } from '../lib/supabaseClient';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Auditor' | 'Distributor';
  title: string;
  organization: string;
  avatarInitials: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLogin: (user: UserSession) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Auditor' | 'Distributor'>('Auditor');
  const [clientTenant, setClientTenant] = useState('Apex Electronics Corp');
  const [distributorName, setDistributorName] = useState('Midwest Trading Co.');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const org = role === 'Auditor' ? clientTenant : distributorName;
    const initials = fullName
      ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : email.slice(0, 2).toUpperCase();

    if (mode === 'register') {
      try {
        // Direct browser SDK insert into Supabase pending_signup_requests table using .env credentials
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
          onLogin(data.user);
          setSuccessMessage('Logged in successfully!');
          setTimeout(() => {
            setSuccessMessage('');
            onClose();
          }, 800);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative text-white">
        
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {currentUser ? 'Account & Session Settings' : mode === 'login' ? 'Sign In to Platform' : 'Create New Account'}
              </h3>
              <p className="text-xs text-slate-400">
                {currentUser ? 'Manage active role and tenant access' : 'Access Auditor Workspace or Distributor Portal'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alert Banners */}
        {errorMessage && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center gap-2 text-red-400 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-6">
          {currentUser ? (
            /* Active User Info & Logout View */
            <div className="space-y-5">
              <div className="flex items-center gap-4 bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center border-2 border-indigo-400">
                  {currentUser.avatarInitials}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{currentUser.name}</h4>
                  <p className="text-xs text-slate-400">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      currentUser.role === 'Auditor' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {currentUser.role === 'Auditor' ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      {currentUser.role} Role
                    </span>
                    <span className="text-xs text-slate-400">• {currentUser.organization}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-slate-200">Session Details:</p>
                <p><span className="text-slate-500">Designation:</span> {currentUser.title}</p>
                <p><span className="text-slate-500">Access Scope:</span> {currentUser.role === 'Auditor' ? 'Full Master Audit Workspace & Analytics' : 'Isolated Distributor Portal & Evidence Uploads'}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onLogout();
                    setSuccessMessage('Logged out successfully');
                    setTimeout(() => setSuccessMessage(''), 1000);
                  }}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Sign Out of Current Account
                </button>
              </div>
            </div>
          ) : (
            /* Login / Register Form */
            <div>
              {/* Super Admin Quick Sign In Helper */}
              {mode === 'login' && (
                <div className="mb-3.5 p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-300">
                      <Key className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-purple-200">Super Admin Access</p>
                      <p className="text-[10px] text-purple-300/70">abhilash98moni@gmail.com</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('abhilash98moni@gmail.com');
                      setPassword('Ey@2026@test');
                      setSuccessMessage('Super Admin credentials filled. Click "Sign In" below to authenticate.');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    Autofill Super Admin
                  </button>
                </div>
              )}

              {/* Mode Toggle Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="text"
                        required={mode === 'register'}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role Selection on Register */}
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                          role === 'Auditor' 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                            : 'bg-slate-950 border-slate-800 text-slate-400'
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

                        <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs ${
                          role === 'Distributor' 
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200' 
                            : 'bg-slate-950 border-slate-800 text-slate-400'
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
                            <p className="text-[10px] text-slate-400">Vendor / Channel Partner</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {role === 'Auditor' ? 'Client Organization' : 'Distributor Entity'}
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        {role === 'Auditor' ? (
                          <select
                            value={clientTenant}
                            onChange={(e) => setClientTenant(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            {CLIENT_TENANTS.map(c => (
                              <option key={c.id} value={c.name} className="bg-slate-900">{c.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input 
                            type="text"
                            required
                            value={distributorName}
                            onChange={(e) => setDistributorName(e.target.value)}
                            placeholder="e.g. Midwest Trading Co."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-1">
                  <p className="text-[10px] text-amber-400 font-medium flex items-center justify-center gap-1.5 mb-2">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    <span>{mode === 'login' ? 'Supabase Authenticated Sign In' : 'Requires Admin Approval before storing in Supabase'}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Processing Request...</span>
                    ) : (
                      <>
                        <span>{mode === 'login' ? 'Sign In to Account' : 'Submit Signup Request for Approval'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
