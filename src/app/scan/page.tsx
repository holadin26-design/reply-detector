'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Scan, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Filter
} from 'lucide-react';
import { EmailAccount, ScanJob } from '@/types';

export default function ScanPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanJob | null>(null);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => setAccounts([]));
  }, []);

  const handleStartScan = async () => {
    setScanning(true);
    setProgress({ status: 'running', fetched: 0, analyzed: 0, positives: 0 });
    
    const accountIds = selectedAccount === 'all' 
      ? accounts.map(a => a.id)
      : [selectedAccount];

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds, dateFrom, dateTo }),
      });

      if (!res.body) throw new Error('No readable stream available');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const pData = JSON.parse(line);
              if (pData.error && !pData.status) {
                pData.status = 'error';
              }
              setProgress(pData);
              if (pData.status === 'completed') {
                setTimeout(() => router.push('/results'), 1500);
                return;
              }
              if (pData.status === 'error') {
                return;
              }
            } catch (e) {
              console.error('Error parsing stream:', e);
            }
          }
        }
        if (done) break;
      }
    } catch (err: any) {
      setProgress(prev => ({ 
        ...(prev || { fetched: 0, analyzed: 0, positives: 0 }),
        status: 'error', 
        error: err.message || 'Stream failed' 
      }));
    }
  };

  useEffect(() => {
    // Cleanup not required for standard fetch stream unless aborted
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manual Scanner</h1>
        <p className="text-slate-400">Trigger a fresh scan across your inboxes for positive replies</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm">
        {!scanning ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Select Account(s)
              </label>
              <select 
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Active Accounts ({accounts.length})</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.label} ({acc.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none w-full"
                />
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <input 
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none w-full"
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-6 border-t border-slate-800">
              <button 
                onClick={handleStartScan}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
              >
                <Scan className="w-6 h-6" />
                Scan Now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              {progress?.status === 'running' && (
                <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
              {progress?.status === 'completed' && (
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              )}
              {progress?.status === 'error' && (
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                  <AlertCircle className="w-10 h-10" />
                </div>
              )}
              <h2 className="text-2xl font-bold capitalize">
                {progress?.status || 'Starting...'}
              </h2>
              <p className="text-slate-400">
                {progress?.status === 'running' 
                  ? 'Connecting to IMAP and analyzing replies with AI...' 
                  : progress?.status === 'completed'
                  ? 'Scan finished! Redirecting to results...'
                  : 'Something went wrong during the scan.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Fetched', count: progress?.fetched || 0, color: 'text-blue-400' },
                { label: 'Analyzed', count: progress?.analyzed || 0, color: 'text-indigo-400' },
                { label: 'Positives', count: progress?.positives || 0, color: 'text-emerald-400 font-bold' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">{stat.label}</p>
                  <p className={`text-3xl ${stat.color}`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {progress?.status === 'running' && (
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                  style={{ width: progress.fetched > 0 ? `${Math.min(100, (progress.analyzed / progress.fetched) * 100)}%` : '5%' }}
                />
              </div>
            )}

            {progress?.status === 'error' && (
              <p className="text-red-400 text-center bg-red-400/10 p-4 rounded-lg border border-red-400/20">
                {progress.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
