import React, { useState } from 'react';
import { AuditEngagement, AuditType } from '../types';
import { X, Plus, Building2, Calendar, ShieldCheck, Briefcase } from 'lucide-react';

interface NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEngagement: (newEng: AuditEngagement) => void;
}

export const NewAuditModal: React.FC<NewAuditModalProps> = ({
  isOpen,
  onClose,
  onAddEngagement
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('Acme Global Retail');
  const [type, setType] = useState<AuditType>('Distributor');
  const [leadAuditor, setLeadAuditor] = useState('Sarah Jenkins');
  const [targetCompletion, setTargetCompletion] = useState('2026-10-30');
  const [location, setLocation] = useState('New York, NY & Remote');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAudit: AuditEngagement = {
      id: `eng-${Date.now()}`,
      code: `AUD-2026-${type.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      title,
      clientName,
      clientIndustry: 'Enterprise Retail & Distribution',
      type,
      status: 'Planning',
      riskRating: 'High',
      leadAuditor,
      teamSize: 3,
      startDate: new Date().toISOString().split('T')[0],
      targetCompletion,
      progressPercent: 10,
      financialExposure: 0,
      sampledRecordsCount: 0,
      totalPopulationCount: 15000,
      findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
      location
    };

    onAddEngagement(newAudit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 text-slate-200 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Initiate New Audit Engagement</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-slate-400 font-medium block mb-1">Engagement Title:</label>
            <input 
              type="text" 
              placeholder="e.g. FY26 Distributor Channel Integrity & Rebates" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Client Organization:</label>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Audit Stream Type:</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as AuditType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Distributor">Distributor Audit</option>
                <option value="Vendor">Vendor & Procurement</option>
                <option value="Dealer">Dealer Network</option>
                <option value="Franchise">Franchise Royalty</option>
                <option value="Compliance">Regulatory Compliance</option>
                <option value="Operational">Operational Audit</option>
                <option value="Financial">Financial General Ledger</option>
                <option value="Forensic">Forensic Investigation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Lead Auditor:</label>
              <input 
                type="text" 
                value={leadAuditor}
                onChange={(e) => setLeadAuditor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Target Sign-Off Date:</label>
              <input 
                type="date" 
                value={targetCompletion}
                onChange={(e) => setTargetCompletion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Audit Location / Reach:</label>
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
            >
              Launch Audit Engagement
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
