import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Loader2, ExternalLink, Zap } from 'lucide-react';
import { projectId } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-715f71b9`;
const STATUSES = ['new', 'reviewed', 'accepted', 'rejected'] as const;
const STATUS_COLOR: Record<string, string> = { new: '#FFD700', reviewed: '#C080FF', accepted: '#00FF88', rejected: '#FF4D6D' };

interface Submission {
  id: string; name: string; email: string; soundcloudUrl: string; note: string;
  status: typeof STATUSES[number]; fastTrack: boolean; createdAt: string;
}

/** Admin "Inbox": track submissions + weekly-chart subscribers. `getToken` returns a fresh admin session token. */
export function AdminInbox({ getToken }: { getToken: () => Promise<string | null> }) {
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [filter, setFilter] = useState<'all' | typeof STATUSES[number]>('new');

  const authed = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    if (!r.ok) throw new Error(await r.text());
    return r;
  }, [getToken]);

  const load = useCallback(async () => {
    try {
      const d = await (await authed('/admin/submissions')).json();
      setSubs(d.submissions); setSubscriberCount(d.subscriberCount);
    } catch (e) { toast.error('Could not load the inbox: ' + String(e)); setSubs([]); }
  }, [authed]);
  useEffect(() => { load(); }, [load]);

  const update = async (id: string, patch: Partial<Pick<Submission, 'status' | 'fastTrack'>>) => {
    try {
      await authed(`/admin/submissions/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
      setSubs(prev => prev?.map(s => (s.id === id ? { ...s, ...patch } : s)) ?? null);
    } catch (e) { toast.error('Update failed: ' + String(e)); }
  };

  const exportCsv = async () => {
    try {
      const blob = await (await authed('/admin/subscribers.csv')).blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `rising-now-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { toast.error('Export failed: ' + String(e)); }
  };

  if (!subs) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-[#9D00FF] animate-spin" /></div>;
  const shown = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="px-4 py-3 rounded-xl" style={{ background: '#0A0716', border: '1px solid rgba(80,30,140,0.3)' }}>
          <p className="text-2xl font-black text-white leading-none">{subscriberCount}</p>
          <p className="text-[10px] text-[#7B6F90] mt-1">chart email subscribers</p>
        </div>
        <div className="px-4 py-3 rounded-xl" style={{ background: '#0A0716', border: '1px solid rgba(80,30,140,0.3)' }}>
          <p className="text-2xl font-black text-white leading-none">{subs.filter(s => s.status === 'new').length}</p>
          <p className="text-[10px] text-[#7B6F90] mt-1">new submissions</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white" style={{ background: 'rgba(157,0,255,0.2)', border: '1px solid rgba(157,0,255,0.4)' }}>
          <Download className="w-3.5 h-3.5" /> Export subscribers (CSV)
        </button>
        <div className="flex gap-1 ml-auto">
          {(['new', 'reviewed', 'accepted', 'rejected', 'all'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
              style={{ background: filter === s ? 'rgba(157,0,255,0.2)' : 'transparent', color: filter === s ? '#fff' : '#5B4F70' }}>{s}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-[#5B4F70] text-center py-10">No {filter === 'all' ? '' : filter} submissions.</p>
      ) : shown.map(s => (
        <div key={s.id} className="p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-3" style={{ background: '#0A0716', border: '1px solid rgba(80,30,140,0.3)' }}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              {s.name}
              {s.fastTrack && <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}><Zap className="w-2.5 h-2.5" />FAST-TRACK</span>}
            </p>
            <a href={s.soundcloudUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C080FF] hover:text-white break-all inline-flex items-center gap-1">{s.soundcloudUrl}<ExternalLink className="w-3 h-3 shrink-0" /></a>
            {s.note && <p className="text-xs text-[#9B8FB0] mt-1 break-words">{s.note}</p>}
            <p className="text-[10px] text-[#5B4F70] mt-1">{s.email} · {new Date(s.createdAt).toLocaleString()} · ID {s.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1 text-[10px] text-[#9B8FB0]" title="Tick when their Stripe fast-track payment arrives (match the Client reference ID)">
              <input type="checkbox" checked={s.fastTrack} onChange={e => update(s.id, { fastTrack: e.target.checked })} /> Paid fast-track
            </label>
            <select value={s.status} onChange={e => update(s.id, { status: e.target.value as Submission['status'] })}
              className="text-xs font-bold rounded-lg px-2 py-1.5 bg-[#06000F]" style={{ color: STATUS_COLOR[s.status], border: '1px solid rgba(157,0,255,0.3)' }}>
              {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
