'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { 
  Download, 
  Search, 
  ChevronRight, 
  ChevronDown,
  CheckCircle,
  MessageSquare,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { EmailAccount, ScannedEmail } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categoryColors: Record<string, string> = {
  interested: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  meeting_request: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  referral: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  not_now: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  negative: 'bg-red-500/10 text-red-500 border-red-500/20',
  unsubscribe: 'bg-red-500/10 text-red-500 border-red-500/20',
  auto_reply: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  other: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export default function ResultsPage() {
  const [emails, setEmails] = useState<ScannedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    accountId: 'all',
    category: 'all',
    isPositive: 'all'
  });
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters as Record<string, string>);
      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      setEmails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch('/api/accounts').then(res => res.json()).then(setAccounts);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    total: emails.length,
    positives: emails.filter(e => e.is_positive).length,
    meetings: emails.filter(e => e.category === 'meeting_request').length,
    rate: emails.length > 0 ? ((emails.filter(e => e.is_positive).length / emails.length) * 100).toFixed(1) : 0
  };

  const handleExport = () => {
    const params = new URLSearchParams(filters as Record<string, string>);
    window.location.href = `/api/results/export?${params}`;
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Results Dashboard</h1>
          <p className="text-slate-400">Analyze detected positive responses and AI classifications</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Download className="w-5 h-5"/>
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Scanned', value: stats.total, icon: Clock, color: 'text-indigo-400' },
          { label: 'Positives Found', value: stats.positives, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Meetings Requested', value: stats.meetings, icon: ArrowUpRight, color: 'text-blue-400' },
          { label: 'Positive Rate %', value: `${stats.rate}%`, icon: MessageSquare, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-2 relative overflow-hidden">
            <stat.icon className="absolute top-4 right-4 w-12 h-12 text-slate-800/10 -rotate-12" />
            <p className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2">
              <stat.icon className="w-4 h-4" />
              {stat.label}
            </p>
            <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] uppercase font-bold text-slate-500 px-1">Source Account</label>
          <select 
            value={filters.accountId}
            onChange={e => setFilters({...filters, accountId: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none text-sm focus:border-indigo-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.label}</option>)}
          </select>
        </div>
        <div className="w-48">
          <label className="text-[10px] uppercase font-bold text-slate-500 px-1">Category</label>
          <select 
            value={filters.category}
            onChange={e => setFilters({...filters, category: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none text-sm focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {Object.keys(categoryColors).map(cat => <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="w-48">
          <label className="text-[10px] uppercase font-bold text-slate-500 px-1">Sentiment</label>
          <select 
            value={filters.isPositive}
            onChange={e => setFilters({...filters, isPositive: e.target.value})}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none text-sm focus:border-indigo-500"
          >
            <option value="all">All Sentiment</option>
            <option value="true">Positive Only</option>
            <option value="false">Negative Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
              <th className="px-6 py-4">From</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Conf.</th>
              <th className="px-6 py-4">Received</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-medium">
                  No replies found matching current filters.
                </td>
              </tr>
            ) : (emails || []).map((email) => (
              <Fragment key={email.id}>
                <tr 
                  onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                  className="table-row-hover cursor-pointer transition-colors"
                >
                  <td className="px-6 py-5">
                    <p className="font-bold text-sm">{email.from_name}</p>
                    <p className="text-slate-500 text-xs">{email.from_email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm truncate max-w-xs">{email.subject}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider",
                      categoryColors[email.category] || 'bg-slate-800 text-slate-400 border-slate-700'
                    )}>
                      {email.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${email.confidence_score * 100}%` }} />
                       </div>
                       <span className="text-xs text-slate-400">{(email.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-400">
                    {new Date(email.received_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    {expandedId === email.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </td>
                </tr>
                {expandedId === email.id && (
                  <tr className="bg-slate-950/50">
                    <td colSpan={6} className="px-10 py-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <h4 className="flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-tight">
                                <MessageSquare className="w-4 h-4" />
                                Email Content
                             </h4>
                             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-sm leading-relaxed text-slate-300 max-h-96 overflow-y-auto font-mono whitespace-pre-wrap whitespace-normal">
                                {email.full_body}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <h4 className="flex items-center gap-2 text-indigo-400 text-sm font-bold uppercase tracking-tight">
                                <Search className="w-4 h-4" />
                                AI Analysis
                             </h4>
                             <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-xl space-y-4">
                                <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sentiment</p>
                                   <p className={cn("text-sm font-bold", email.is_positive ? "text-emerald-400" : "text-red-400")}>
                                      {email.is_positive ? 'Positive / Interested' : 'Negative / No Interest'}
                                   </p>
                                </div>
                                <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Reasoning</p>
                                   <p className="text-sm text-slate-300 italic">&quot;{email.ai_reasoning}&quot;</p>
                                </div>
                                <div>
                                   <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Account</p>
                                   <p className="text-xs text-slate-400">{email.email_accounts?.label} ({email.account_id})</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
