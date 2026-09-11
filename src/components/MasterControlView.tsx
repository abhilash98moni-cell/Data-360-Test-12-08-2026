import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  Building2, 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sliders, 
  Server, 
  Activity, 
  Mail, 
  ChevronRight, 
  Lock, 
  RefreshCw,
  Layers,
  Settings2,
  Database,
  Shield,
  Eye,
  FileText
} from 'lucide-react';
import { UserSession } from './AuthModal';
import { GoogleDriveStorageCard } from './GoogleDriveStorageCard';

interface MasterControlViewProps {
  currentUser: UserSession | null;
  onOpenAuth: () => void;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'Platform Super Admin' | 'AA Super Admin' | 'AA Auditor' | 'Client Super Admin' | 'Client Employee' | 'Distributor Admin' | 'Distributor Employee';
  organization: string;
  tenantType: 'Platform' | 'Audit Firm' | 'Client Company' | 'Distributor';
  status: 'Active' | 'Pending Invitation' | 'Suspended';
  lastActive: string;
  avatarInitials: string;
  assignedAuditsCount: number;
}

const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr-0',
    name: 'Data360 Admin',
    email: 'admin@data360.io',
    role: 'Platform Super Admin',
    organization: 'Data360 Platform Core',
    tenantType: 'Platform',
    status: 'Active',
    lastActive: '2 mins ago',
    avatarInitials: 'D3',
    assignedAuditsCount: 124
  },
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 's.jenkins@apex-audit.com',
    role: 'AA Super Admin',
    organization: 'Apex Audit Practice (AA)',
    tenantType: 'Audit Firm',
    status: 'Active',
    lastActive: 'Just now',
    avatarInitials: 'SJ',
    assignedAuditsCount: 18
  },
  {
    id: 'usr-2',
    name: 'David Vance',
    email: 'd.vance@midwesttrading.com',
    role: 'Distributor Admin',
    organization: 'Midwest Trading Co.',
    tenantType: 'Distributor',
    status: 'Active',
    lastActive: '14 mins ago',
    avatarInitials: 'DV',
    assignedAuditsCount: 2
  },
  {
    id: 'usr-3',
    name: 'Marcus Thorne',
    email: 'm.thorne@apex-electronics.com',
    role: 'Client Super Admin',
    organization: 'Apex Electronics Corp',
    tenantType: 'Client Company',
    status: 'Active',
    lastActive: '1 hour ago',
    avatarInitials: 'MT',
    assignedAuditsCount: 6
  },
  {
    id: 'usr-4',
    name: 'Elena Rostova',
    email: 'e.rostova@apex-audit.com',
    role: 'AA Auditor',
    organization: 'Apex Audit Practice (AA)',
    tenantType: 'Audit Firm',
    status: 'Active',
    lastActive: '3 hours ago',
    avatarInitials: 'ER',
    assignedAuditsCount: 5
  },
  {
    id: 'usr-5',
    name: 'Karan Patel',
    email: 'k.patel@horizonlogistics.in',
    role: 'Distributor Employee',
    organization: 'Horizon Logistics India',
    tenantType: 'Distributor',
    status: 'Pending Invitation',
    lastActive: 'Invited 2 days ago',
    avatarInitials: 'KP',
    assignedAuditsCount: 1
  },
  {
    id: 'usr-6',
    name: 'Ananya Sharma',
    email: 'a.sharma@apex-electronics.com',
    role: 'Client Employee',
    organization: 'Apex Electronics Corp',
    tenantType: 'Client Company',
    status: 'Active',
    lastActive: 'Yesterday',
    avatarInitials: 'AS',
    assignedAuditsCount: 4
  }
];

export const MasterControlView: React.FC<MasterControlViewProps> = ({ currentUser, onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'users' | 'hierarchy' | 'rbac' | 'system'>('storage');
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_SYSTEM_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // New Invitation Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [selectedAuditorForAccess, setSelectedAuditorForAccess] = useState<any | null>(null);
  const [auditorAccessMap, setAuditorAccessMap] = useState<Record<string, boolean>>({});
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [allDistributorsList, setAllDistributorsList] = useState<any[]>([]);

  useEffect(() => {
     if (activeTab === 'users') {
        fetch('/api/distributors', {
           headers: { 'Authorization': 'Bearer ' + localStorage.getItem('supabase_token') }
        }).then(r => r.json()).then(d => {
           if (d.success) setAllDistributorsList(d.distributors);
        }).catch(console.error);
     }
  }, [activeTab]);

  const openManageAccess = async (user: any) => {
     setSelectedAuditorForAccess(user);
     setIsLoadingAccess(true);
     try {
        const res = await fetch('/api/admin/auditor-access', {
           headers: { 'Authorization': 'Bearer ' + localStorage.getItem('supabase_token') }
        });
        const data = await res.json();
        if (data.success) {
           const map: Record<string, boolean> = {};
           data.mappings.forEach((m: any) => {
              if (m.auditor_user_id === user.id) {
                 map[m.distributor_name] = m.is_active;
              }
           });
           setAuditorAccessMap(map);
        }
     } catch (err) {
        console.error(err);
     } finally {
        setIsLoadingAccess(false);
     }
  };

  const toggleDistributorAccess = async (userId: string, distName: string, isActive: boolean) => {
     // Optimistic update
     setAuditorAccessMap(prev => ({ ...prev, [distName]: isActive }));
     try {
        await fetch('/api/admin/auditor-access', {
           method: 'POST',
           headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + localStorage.getItem('supabase_token')
           },
           body: JSON.stringify({ auditor_user_id: userId, distributor_name: distName, is_active: isActive })
        });
     } catch (err) {
        console.error(err);
        // Revert on error
        setAuditorAccessMap(prev => ({ ...prev, [distName]: !isActive }));
     }
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<SystemUser['role']>('AA Auditor');
  const [inviteOrg, setInviteOrg] = useState('Apex Audit Practice (AA)');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const initials = inviteName
      ? inviteName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : inviteEmail.slice(0, 2).toUpperCase();

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      organization: inviteOrg,
      tenantType: inviteRole.includes('Platform') ? 'Platform' : inviteRole.includes('AA') ? 'Audit Firm' : inviteRole.includes('Client') ? 'Client Company' : 'Distributor',
      status: 'Pending Invitation',
      lastActive: 'Invitation sent just now',
      avatarInitials: initials,
      assignedAuditsCount: 0
    };

    setUsers([newUser, ...users]);
    setInviteSuccessMsg(`Invitation email successfully dispatched to ${inviteEmail}`);
    setTimeout(() => {
      setInviteSuccessMsg('');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
    }, 1200);
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-100 animate-fade-in">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Platform Governance & RBAC
            </div>
            <span className="text-xs text-slate-400">• Data360 Multi-Tenant Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-indigo-400" />
            <span>Master Control & User Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control platform hierarchy, active user sessions, role-based access permissions (RBAC), client tenant configurations, and global security logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite New User</span>
          </button>
          
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Key className="h-4 w-4 text-slate-400" />
            <span>Switch Role / Sign In</span>
          </button>
        </div>
      </div>

      {/* Admin Control Scope Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
          Admin Control Scope
        </p>
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Role Scope:</span>
            <span className="text-amber-300 font-bold">Admin Dashboard Only</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your account is restricted exclusively to reviewing, approving, and provisioning user signups.
          </p>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'storage' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="h-4 w-4 text-purple-300" />
          <span>Storage & Supabase DB (Live Diagnostics)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Active Users Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'hierarchy' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Organization Hierarchy (7 Roles)</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rbac' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>RBAC Permission Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'system' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Tenant & System Status</span>
        </button>
      </div>

      {/* TAB 0: STORAGE & SUPABASE DB */}
      {activeTab === 'storage' && (
        <div className="space-y-5">
          <GoogleDriveStorageCard />
        </div>
      )}

      {/* TAB 1: ACTIVE USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search user name, email, or tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <Filter className="h-4 w-4 text-slate-500 shrink-0" />
              <span className="text-xs text-slate-400 shrink-0 font-medium">Filter Role:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Roles (7 Types)</option>
                <option value="Platform Super Admin">Platform Super Admin</option>
                <option value="AA Super Admin">AA Super Admin</option>
                <option value="AA Auditor">AA Auditor</option>
                <option value="Client Super Admin">Client Super Admin</option>
                <option value="Client Employee">Client Employee</option>
                <option value="Distributor Admin">Distributor Admin</option>
                <option value="Distributor Employee">Distributor Employee</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Platform Role</th>
                    <th className="py-3 px-4">Tenant Entity</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center border shrink-0 ${
                            user.role.includes('Platform') 
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : user.role.includes('AA') 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                              : user.role.includes('Client')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {user.avatarInitials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100 flex items-center gap-1.5">
                              {user.name}
                              {currentUser?.email === user.email && (
                                <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] rounded font-semibold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          user.role.includes('Platform')
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : user.role.includes('AA')
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : user.role.includes('Client')
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>{user.organization}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{user.tenantType} Level</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Pending Activation</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {user.lastActive}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => user.role.includes('Auditor') ? openManageAccess(user) : onOpenAuth()}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          {user.role.includes('Auditor') ? 'Manage Distributor Access' : 'Manage Permissions'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATION HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <span>Multi-Tenant Architecture & 7-Level User Hierarchy</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Data360 isolates data securely across the hierarchy while allowing audit teams to seamlessly manage clients and distributors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Level 1 */}
            <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-xl relative">
              <div className="p-2 bg-purple-500/20 text-purple-300 w-fit rounded-lg mb-2">
                <Server className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase text-purple-400">Level 1: Platform</p>
              <h4 className="font-bold text-white text-sm">Platform Super Admin</h4>
              <p className="text-xs text-slate-400 mt-1">Owns Data360 core system. Manages licenses, audit firm tenants, system monitoring & security logs.</p>
            </div>

            {/* Level 2 */}
            <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-xl relative">
              <div className="p-2 bg-indigo-500/20 text-indigo-300 w-fit rounded-lg mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase text-indigo-400">Level 2: Audit Firm (AA)</p>
              <h4 className="font-bold text-white text-sm">AA Super Admin & Auditors</h4>
              <p className="text-xs text-slate-400 mt-1">Highest audit authority. Creates client tenants, audits, audit teams, questionnaires & reports.</p>
            </div>

            {/* Level 3 */}
            <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-xl relative">
              <div className="p-2 bg-amber-500/20 text-amber-300 w-fit rounded-lg mb-2">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase text-amber-400">Level 3: Client Company</p>
              <h4 className="font-bold text-white text-sm">Client Super Admin & Employees</h4>
              <p className="text-xs text-slate-400 mt-1">Apex, XYZ, ABC. Views audit progress, final reports, CAPA tracking & executive analytics.</p>
            </div>

            {/* Level 4 */}
            <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-xl relative">
              <div className="p-2 bg-emerald-500/20 text-emerald-300 w-fit rounded-lg mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold uppercase text-emerald-400">Level 4: Distributors</p>
              <h4 className="font-bold text-white text-sm">Distributor Admin & Employees</h4>
              <p className="text-xs text-slate-400 mt-1">Isolated portal. Responds to IRL document requests, uploads evidence files & submits clarifications.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC PERMISSION MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-400" />
              <span>Role-Based Access Control (RBAC) Master Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configurable granular capability permissions mapped across Data360 platform roles.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-950 text-slate-300 text-[10px] uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Platform Capability / Action</th>
                  <th className="p-3 text-purple-400">Platform Admin</th>
                  <th className="p-3 text-indigo-400">AA Super Admin</th>
                  <th className="p-3 text-indigo-300">AA Auditor</th>
                  <th className="p-3 text-amber-400">Client Admin</th>
                  <th className="p-3 text-emerald-400">Distributor Admin</th>
                  <th className="p-3 text-emerald-300">Distributor Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/20">
                  <td className="p-3 font-semibold text-slate-200">Create & Manage Audit Engagements</td>
                  <td className="p-3 text-slate-500">❌</td>
                  <td className="p-3 text-emerald-400">✅ Full</td>
                  <td className="p-3 text-emerald-400">✅ Assigned</td>
                  <td className="p-3 text-slate-500">View Only</td>
                  <td className="p-3 text-slate-500">❌</td>
                  <td className="p-3 text-slate-500">❌</td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="p-3 font-semibold text-slate-200">IRL Document Requests & Uploads</td>
                  <td className="p-3 text-slate-500">❌</td>
                  <td className="p-3 text-emerald-400">✅ Full</td>
                  <td className="p-3 text-emerald-400">✅ Review</td>
                  <td className="p-3 text-slate-500">View Only</td>
                  <td className="p-3 text-emerald-400">✅ Upload</td>
                  <td className="p-3 text-emerald-400">✅ Upload</td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="p-3 font-semibold text-slate-200">Forensic Anomaly AI & Sampling Controls</td>
                  <td className="p-3 text-slate-500">❌</td>
                  <td className="p-3 text-emerald-400">✅ Full</td>
                  <td className="p-3 text-emerald-400">✅ Execute</td>
                  <td className="p-3 text-slate-500">View Summary</td>
                  <td className="p-3 text-slate-500">❌</td>
                  <td className="p-3 text-slate-500">❌</td>
                </tr>
                <tr className="hover:bg-slate-800/20">
                  <td className="p-3 font-semibold text-slate-200">User Invitation & Tenant Management</td>
                  <td className="p-3 text-emerald-400">✅ All Tenants</td>
                  <td className="p-3 text-emerald-400">✅ Firm & Dist</td>
                  <td className="p-3 text-slate-500">❌</td>
                  <td className="p-3 text-emerald-400">✅ Client Staff</td>
                  <td className="p-3 text-emerald-400">✅ Dist Staff</td>
                  <td className="p-3 text-slate-500">❌</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TENANT LOGS & SYSTEM STATUS */}
      {activeTab === 'system' && (
        <div className="space-y-5">
          {/* Google Drive Storage Card */}
          <GoogleDriveStorageCard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Multi-Tenant Isolation</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">Active & Isolated</p>
              <p className="text-xs text-slate-400">Strict database tenant key verification enabled for Apex Electronics, Midwest Trading & Horizon Logistics.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">AI Copilot Engine</span>
                <Activity className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-indigo-300">Gemini 2.5 Flash</p>
              <p className="text-xs text-slate-400">Automated Forensic Document OCR & Anomaly Detection active across IRL file streams.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Audit Logging</span>
                <Database className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white">100% Captured</p>
              <p className="text-xs text-slate-400">Immutable audit trial tracking every document upload, review decision, and permission change.</p>
            </div>
          </div>
        </div>
      )}


      {/* DISTRIBUTOR ACCESS MODAL */}
      {selectedAuditorForAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <span>Manage Distributor Access</span>
              </h3>
              <button onClick={() => setSelectedAuditorForAccess(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-2">
               <p className="text-sm text-slate-300">
                 Authorized distributors for <strong>{selectedAuditorForAccess.name}</strong> ({selectedAuditorForAccess.email}):
               </p>
               
               {isLoadingAccess ? (
                 <div className="text-xs text-slate-400 animate-pulse py-4 text-center">Loading distributor access...</div>
               ) : (
                 <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {allDistributorsList.map(dist => {
                       const isActive = auditorAccessMap[dist.name] || false;
                       return (
                         <div key={dist.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-sm font-semibold text-slate-200">{dist.name}</span>
                            <button 
                               onClick={() => toggleDistributorAccess(selectedAuditorForAccess.id, dist.name, !isActive)}
                               className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                               <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                         </div>
                       );
                    })}
                 </div>
               )}
            </div>
            
            <div className="pt-4 border-t border-slate-800 text-right">
              <button onClick={() => setSelectedAuditorForAccess(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITATION MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-400" />
                <span>Invite New User to Data360</span>
              </h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-semibold">
                {inviteSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Email Address (Invitation Target)</label>
                <input 
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="AA Super Admin">AA Super Admin</option>
                  <option value="AA Auditor">AA Auditor</option>
                  <option value="Client Super Admin">Client Super Admin</option>
                  <option value="Client Employee">Client Employee</option>
                  <option value="Distributor Admin">Distributor Admin</option>
                  <option value="Distributor Employee">Distributor Employee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Organization Entity</label>
                <input 
                  type="text"
                  required
                  value={inviteOrg}
                  onChange={(e) => setInviteOrg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-2"
              >
                Send Secure Invitation Email
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
