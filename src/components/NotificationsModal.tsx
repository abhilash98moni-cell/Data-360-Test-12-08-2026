import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  UserPlus, 
  Building2, 
  UploadCloud, 
  HelpCircle, 
  CheckCircle2, 
  Check, 
  Trash2, 
  ExternalLink,
  XCircle,
  FileText,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AppNotification, UserSession } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string, meta?: any) => void;
  currentUser?: UserSession | null;
  selectedDistributor?: string;
  onUpdateUnreadCount?: (count: number) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  currentUser,
  selectedDistributor,
  onUpdateUnreadCount
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
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
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          const unread = data.notifications.filter((n: any) => !n.isRead).length;
          if (onUpdateUnreadCount) onUpdateUnreadCount(unread);
          return;
        }
      }
      setNotifications([]);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, currentUser?.role, currentUser?.organization, selectedDistributor]);

  // Periodic background refresh when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [isOpen, currentUser?.role, currentUser?.organization, selectedDistributor]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    if (onUpdateUnreadCount) onUpdateUnreadCount(0);
    try {
      const params = new URLSearchParams();
      if (currentUser?.role) params.set('role', currentUser.role);
      const dist = currentUser?.organization || selectedDistributor;
      if (dist) params.set('distributor', dist);
      if (currentUser?.email) params.set('userEmail', currentUser.email);

      await fetch(`/api/notifications/read-all?${params.toString()}`, { 
        method: 'PUT',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-organization': dist || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.warn('Failed to mark all as read on server:', err);
    }
  };

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      const remaining = next.filter(n => !n.isRead).length;
      if (onUpdateUnreadCount) onUpdateUnreadCount(remaining);
      return next;
    });
    try {
      await fetch(`/api/notifications/${id}/read`, { 
        method: 'PUT',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || selectedDistributor || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (e) {
      console.warn('Failed to mark notification read:', e);
    }
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      const remaining = next.filter(n => !n.isRead).length;
      if (onUpdateUnreadCount) onUpdateUnreadCount(remaining);
      return next;
    });
    try {
      await fetch(`/api/notifications/${id}`, { 
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || selectedDistributor || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    const targetVoucher = n.targetVoucherNo || (n.metadata && (n.metadata.voucherNo || n.metadata.voucher_no));
    if (onNavigateToTab) {
      const destTab = n.linkTab || (currentUser?.role?.includes('Distributor') ? 'engagement_workspace' : 'sampling_review');
      onNavigateToTab(destTab, targetVoucher);
      onClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div 
      id="notifications-overlay"
      className="fixed inset-0 z-[100] overflow-hidden"
      onClick={onClose}
    >
      {/* Backdrop overlay for outside clicks */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity animate-fade-in" />

      {/* Notification Dropdown / Panel */}
      <div 
        id="notifications-panel"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed top-16 right-2 sm:right-4 md:right-8 z-[101] w-[calc(100vw-1rem)] sm:w-[500px] max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[calc(100vh-5rem)] animate-in fade-in slide-in-from-top-2 duration-150"
      >
        
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 relative">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>In-App Notifications</span>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-full border border-indigo-500/30">
                    {unreadCount} unread
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[11px] font-medium rounded-full">
                    All caught up
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Two-way updates across auditor reviews, submissions & clarifications</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchNotifications}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Refresh Notifications"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-950/60 px-5 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </button>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>All notifications marked as read</span>
            </span>
          )}
          <span className="text-slate-400">{notifications.length} total</span>
        </div>

        {/* Notifications Feed */}
        <div className="p-3.5 space-y-2.5 overflow-y-auto flex-1 divide-y divide-transparent">
          {notifications.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 text-slate-600 stroke-[1.5]" />
              <p>No active notifications in your queue.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const targetVoucher = n.targetVoucherNo || (n.metadata && (n.metadata.voucherNo || n.metadata.voucher_no));
              const sampleId = n.targetSampleId || (n.metadata && (n.metadata.sampleId || n.metadata.sample_id));
              const orgName = n.targetOrganization || (n.metadata && (n.metadata.distributorName || n.metadata.distributor_name || n.metadata.organization));

              const getIcon = () => {
                switch (n.category) {
                  case 'User Invited': return <UserPlus className="h-4 w-4 text-purple-400" />;
                  case 'Distributor Assigned': return <Building2 className="h-4 w-4 text-emerald-400" />;
                  case 'Documents Uploaded': return <UploadCloud className="h-4 w-4 text-indigo-400" />;
                  case 'Clarification Requested': return <HelpCircle className="h-4 w-4 text-amber-400" />;
                  case 'Submission Completed': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
                  case 'Required Data Resubmitted': return <CheckCircle2 className="h-4 w-4 text-cyan-400" />;
                  case 'Required Data Submitted': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
                  case 'Evidence Accepted': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
                  case 'Evidence Rejected': return <XCircle className="h-4 w-4 text-rose-400" />;
                  case 'Required Data Updated': return <FileText className="h-4 w-4 text-indigo-400" />;
                  default: return <Bell className="h-4 w-4 text-slate-400" />;
                }
              };

              return (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group hover:border-indigo-500/60 ${
                    !n.isRead 
                      ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm' 
                      : 'bg-slate-950/60 border-slate-800/80 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg shrink-0 mt-0.5 group-hover:border-indigo-500/40 transition-colors">
                    {getIcon()}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-bold text-xs text-slate-100 truncate">{n.title}</h4>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{n.timestamp}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed break-words">{n.message}</p>
                    
                    {/* Context tags and action link */}
                    <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                      {targetVoucher && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/90 text-slate-200 border border-slate-700/60 px-2 py-0.5 rounded font-mono font-semibold">
                          Voucher #{targetVoucher}
                        </span>
                      )}
                      {sampleId && sampleId !== targetVoucher && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/60 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          Sample #{sampleId}
                        </span>
                      )}
                      {orgName && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800/60 text-slate-300 px-1.5 py-0.5 rounded">
                          {orgName}
                        </span>
                      )}
                      {targetVoucher && (
                        <span className="text-[11px] text-indigo-400 group-hover:text-indigo-300 font-semibold inline-flex items-center gap-1 ml-auto">
                          <span>Open Transaction</span>
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Mark read & Dismiss */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {!n.isRead && (
                      <button
                        onClick={(e) => markAsRead(n.id, e)}
                        className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(n.id, e)}
                      className="text-slate-500 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Dismiss notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
