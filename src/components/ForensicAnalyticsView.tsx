import React, { useState } from 'react';
import { ForensicAnomaly } from '../types';
import { 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Sliders, 
  Sparkles, 
  FileSearch, 
  Building2, 
  DollarSign, 
  CheckCircle2, 
  HelpCircle,
  BarChart3
} from 'lucide-react';

import { formatCurrency, CurrencyMode } from '../utils/currencyFormatter';

interface ForensicAnalyticsViewProps {
  anomalies: ForensicAnomaly[];
  currencyMode?: CurrencyMode;
}

export const ForensicAnalyticsView: React.FC<ForensicAnalyticsViewProps> = ({
  anomalies,
  currencyMode = 'INR'
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [activeAnomalyList, setActiveAnomalyList] = useState<ForensicAnomaly[]>(anomalies);

  // Benford's Law Digit Frequency Comparison Data (Expected vs Observed)
  const benfordData = [
    { digit: '1', expected: 30.1, observed: 28.5 },
    { digit: '2', expected: 17.6, observed: 16.8 },
    { digit: '3', expected: 12.5, observed: 11.2 },
    { digit: '4', expected: 9.7, observed: 8.9 },
    { digit: '5', expected: 7.9, observed: 7.1 },
    { digit: '6', expected: 6.7, observed: 6.0 },
    { digit: '7', expected: 5.8, observed: 12.4 }, // Spike!
    { digit: '8', expected: 5.1, observed: 9.8 },  // Spike!
    { digit: '9', expected: 4.6, observed: 9.3 },  // Spike!
  ];

  const filtered = filterType === 'All' 
    ? activeAnomalyList 
    : activeAnomalyList.filter(a => a.anomalyType.includes(filterType));

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 text-slate-200">
      
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
              AI Forensic Intelligence Engine
            </span>
            <span className="text-xs text-slate-400">142,000 General Ledger Rows Analyzed</span>
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">Benford\'s Law & Fraud Pattern Intelligence</h1>
          <p className="text-xs text-slate-400">Continuous anomaly detection for split approvals, duplicate vendors, and out-of-pattern discounts.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-md flex items-center gap-1.5 cursor-pointer">
            <Sparkles className="h-4 w-4" />
            <span>Run Deep Forensic Sweep</span>
          </button>
        </div>
      </div>

      {/* Top Section: Benford's Law Bar Chart & Risk Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Benford's Law Digit Frequency Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                <span>Benford\'s Law First-Digit Analysis</span>
              </h2>
              <p className="text-xs text-slate-400">Compares expected logarithmic frequency against observed AP transaction first digits</p>
            </div>
            <span className="text-[10px] bg-red-500/20 text-red-300 font-mono font-bold px-2 py-1 rounded border border-red-500/30">
              Anomalous Spikes at Digits 7, 8, 9
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-9 gap-2 items-end h-44 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {benfordData.map((d) => (
                <div key={d.digit} className="flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] text-slate-200 p-1.5 rounded border border-slate-700 shadow-lg pointer-events-none z-20 whitespace-nowrap">
                    Digit {d.digit}: Observed {d.observed}% (Exp: {d.expected}%)
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    {/* Expected Logarithmic Bar */}
                    <div 
                      className="w-2.5 bg-slate-700 rounded-t"
                      style={{ height: `${(d.expected / 35) * 100}%` }}
                    ></div>
                    
                    {/* Observed Frequency Bar */}
                    <div 
                      className={`w-3.5 rounded-t transition-all ${
                        d.observed > d.expected + 3 ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'
                      }`}
                      style={{ height: `${(d.observed / 35) * 100}%` }}
                    ></div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-300 mt-2">{d.digit}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-slate-700 rounded-sm"></span>
                <span>Expected Benford Curve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-indigo-500 rounded-sm"></span>
                <span>Normal Ledger Frequencies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-red-500 rounded-sm"></span>
                <span>Statistically Anomalous Spike (Potential Fraud)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: AI Forensic Risk Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <span>Forensic Pattern Summary</span>
          </h2>

          <div className="space-y-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-300">Split Below Approval Cap</span>
                <span className="text-xs font-mono font-bold text-white">$149,550 Total</span>
              </div>
              <p className="text-[11px] text-slate-300">3 payments of $49,850 made within 45 mins to bypass VP $50k sign-off limit.</p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300">Shell Company Routing Match</span>
                <span className="text-xs font-mono font-bold text-white">$420,000 Exposure</span>
              </div>
              <p className="text-[11px] text-slate-300">Vendor V-9918 bank routing number matches employee-linked Delaware entity.</p>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-300">Off-Hours Ledger Entries</span>
                <span className="text-xs font-mono font-bold text-white">4 Transactions</span>
              </div>
              <p className="text-[11px] text-slate-300">Credit memos posted after midnight on weekends without standard support ticket.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Flagged Forensic Anomalies Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Flagged Ledger Anomalies ({filtered.length})</h2>
            <p className="text-xs text-slate-400">High risk score transactions requiring immediate audit testing and evidence request</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Split', 'Benford', 'Duplicate', 'Off-Hours'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  filterType === f 
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-y border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Txn Ref / Date</th>
                <th className="py-2.5 px-3">Vendor / Entity</th>
                <th className="py-2.5 px-3">Anomaly Pattern</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((anom) => (
                <tr key={anom.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-indigo-300">{anom.transactionRef}</div>
                    <div className="text-[10px] text-slate-500">{anom.date}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-100">{anom.vendorOrPartner}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-red-500/10 text-red-300 border border-red-500/30">
                      {anom.anomalyType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      anom.riskScore >= 90 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {anom.riskScore} / 100
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    ${anom.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {anom.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-2.5 py-1 rounded transition-colors cursor-pointer">
                      Flag for Finding
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
