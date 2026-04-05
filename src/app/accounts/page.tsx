'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Mail, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { EmailAccount } from '@/types';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    label: '',
    email: '',
    imap_user: '',
    imap_password: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/accounts/test', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert('Connection Successful!');
      } else {
        alert('Connection Failed: ' + data.error);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAdd(false);
        setFormData({
          label: '', email: '', imap_user: '', imap_password: '', imap_host: 'imap.gmail.com', imap_port: 993
        });
        fetchAccounts();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return;
    await fetch('/api/accounts/' + id, { method: 'DELETE' });
    fetchAccounts();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Accounts</h1>
          <p className="text-slate-400">Manage your outreach accounts and IMAP connections</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showAdd ? <XCircle className="w-5 h-5"/> : <Plus className="w-5 h-5" />}
          {showAdd ? 'Cancel' : 'Add Account'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            Connect New Inbox
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Account Label</label>
              <input 
                value={formData.label}
                onChange={e => setFormData({...formData, label: e.target.value})}
                placeholder="e.g. Outreach One"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value, imap_user: e.target.value})}
                placeholder="name@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                Gmail App Password
                <Lock className="w-3 h-3 text-slate-500" />
              </label>
              <input 
                type="password"
                required
                value={formData.imap_password}
                onChange={e => setFormData({...formData, imap_password: e.target.value})}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-slate-500">Enable 2FA and create an &apos;App Password&apos; in your Google Security settings.</p>
            </div>
            
            <div className="md:col-span-2 flex items-center gap-4 pt-4">
              <button 
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCcw className="w-4 h-4" />}
                Test Connection
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-900/50 rounded-xl animate-pulse" />
          ))
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <Mail className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No accounts added yet</p>
            <p className="text-sm text-slate-600">Add your first inbox to start scanning</p>
          </div>
        ) : accounts.map((account) => (
          <div key={account.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 group hover:border-indigo-500/50 transition-all shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-indigo-500/10 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-indigo-500" />
              </div>
              <button 
                onClick={() => handleDelete(account.id)}
                className="text-slate-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-bold text-lg">{account.label}</h3>
            <p className="text-slate-400 text-sm mb-4">{account.email}</p>
            
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Active
              </div>
              <div>•</div>
              <div>Last scan: {account.last_scanned_at ? new Date(account.last_scanned_at).toLocaleDateString() : 'Never'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
