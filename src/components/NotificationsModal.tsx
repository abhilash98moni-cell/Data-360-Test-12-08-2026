import React, { useState } from 'react';
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
  ExternalLink 
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Distributor Documents Uploaded',
    message: 'Midwest Trading Co. submitted 3 files for IRL section #2 ERP Sales Register.',
    category: 'Documents Uploaded',
    timestamp: '10 mins ago',
    isRead: false,
    linkTab: 'evidence'
  },
  {
    id: 'notif-2',
    title: 'Clarification Requested',
    message: 'Sarah Jenkins requested clarification on MDF Rebate Credit Note #CN-9042.',
    category: 'Clarification Requested',
    timestamp: '45 mins ago',
    isRead: false,
    linkTab: 'communication'
  },
  {
    id: 'notif-3',
    title: 'New User Invited',
    message: 'Invitation email successfully dispatched to Karan Patel (Distributor Employee).',
    category: 'User Invited',
    timestamp: '2 hours ago',
    isRead: true,
    linkTab: 'master_control'
  },
  {
    id: 'notif-4',
    title: 'Distributor Entity Assigned',
    message: 'Horizon Logistics India assigned to Audit Engagement #AUD-2026-002.',
    category: 'Distributor Assigned',
    timestamp: 'Yesterday',
    isRead: true,
    linkTab: 'audits'
  },
  {
    id: 'notif-5',
    title: 'IRL Submission Completed',
    message: 'All 24 mandatory requirements completed and signed off for Midwest Trading Co.',
    category: 'Submission Completed',
    timestamp: '2 days ago',
    isRead: true,
    linkTab: 'irl'
  }
];

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <span>In-App Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Updates across invitations, uploads & clarifications</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-slate-950/40 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={markAllAsRead}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all as read</span>
          </button>
          <span className="text-slate-500">{notifications.length} total alerts</span>
        </div>

        {/* Notifications Feed */}
        <div className="p-4 space-y-2.5 max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No active notifications in your queue.
            </div>
          ) : (
            notifications.map((n) => {
              const getIcon = () => {
                switch (n.category) {
                  case 'User Invited': return <UserPlus className="h-4 w-4 text-purple-400" />;
                  case 'Distributor Assigned': return <Building2 className="h-4 w-4 text-emerald-400" />;
                  case 'Documents Uploaded': return <UploadCloud className="h-4 w-4 text-indigo-400" />;
                  case 'Clarification Requested': return <HelpCircle className="h-4 w-4 text-amber-400" />;
                  case 'Submission Completed': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
                  default: return <Bell className="h-4 w-4 text-slate-400" />;
                }
              };

              return (
                <div 
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    !n.isRead 
                      ? 'bg-indigo-950/30 border-indigo-500/30' 
                      : 'bg-slate-950 border-slate-800 opacity-80'
                  }`}
                >
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg shrink-0 mt-0.5">
                    {getIcon()}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-100">{n.title}</h4>
                      <span className="text-[10px] text-slate-500">{n.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    
                    {n.linkTab && onNavigateToTab && (
                      <button
                        onClick={() => {
                          onNavigateToTab(n.linkTab!);
                          onClose();
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <span>View Details</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
