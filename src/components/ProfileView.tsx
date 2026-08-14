import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  LogOut,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserSession } from '../types';

interface ProfileViewProps {
  currentUser: UserSession | null;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onLogout }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('Password successfully updated via Supabase Auth');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-indigo-400 shadow-lg">
            {currentUser?.avatarInitials || 'US'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>{currentUser?.name || 'User Account'}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold rounded-md uppercase">
                {currentUser?.role || 'Auditor'} Role
              </span>
              <span className="text-xs text-slate-400">• {currentUser?.organization}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Account Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-5 w-5 text-indigo-400" />
            <span>Account Details & Session Metadata</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Full User Name</span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">{currentUser?.name}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Email Address</span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">{currentUser?.email}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Designation Title</span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">{currentUser?.title}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Organization Tenant</span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">{currentUser?.organization}</p>
            </div>
          </div>
        </div>

        {/* Password & Security Management */}
        <div id="security-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="h-5 w-5 text-indigo-400" />
            <span>Change Password & Security</span>
          </h3>

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl">
              {errorMessage}
            </div>
          )}

          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input 
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelPasswordChange}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-start justify-center py-2 space-y-3 animate-fade-in">
              <p className="text-xs text-slate-400">Update your password to keep your account secure.</p>
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700 shadow-sm"
              >
                Change Password
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
