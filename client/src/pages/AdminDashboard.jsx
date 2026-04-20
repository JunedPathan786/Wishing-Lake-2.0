// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, MessageCircle, BarChart2, ShieldCheck, Flag, Bell, User } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [reportedWishes, setReportedWishes] = useState([]);
  const [pendingChats, setPendingChats] = useState([]);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', targetRole: '' });

  useEffect(() => {
    adminAPI.getStats().then(({ data }) => { setStats(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users') adminAPI.getUsers({ limit: 20 }).then(({ data }) => setUsers(data.data.users)).catch(() => {});
    if (tab === 'moderation') adminAPI.getReportedWishes().then(({ data }) => setReportedWishes(data.data.wishes)).catch(() => {});
    if (tab === 'chats') adminAPI.getPendingChats().then(({ data }) => setPendingChats(data.data.chats)).catch(() => {});
  }, [tab]);

  const handleModerateWish = async (wishId, action) => {
    try {
      await adminAPI.moderateWish(wishId, action, '');
      setReportedWishes(prev => prev.filter(w => w._id !== wishId));
      toast.success(`Wish ${action}d`, { className: 'toast-dark' });
    } catch { toast.error('Failed', { className: 'toast-dark' }); }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await adminAPI.updateUser(userId, updates);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...updates } : u));
      toast.success('User updated', { className: 'toast-dark' });
    } catch { toast.error('Failed', { className: 'toast-dark' }); }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return;
    try {
      const { data } = await adminAPI.broadcast(broadcastForm);
      toast.success(data.message, { className: 'toast-dark' });
      setBroadcastForm({ title: '', message: '', targetRole: '' });
    } catch { toast.error('Broadcast failed', { className: 'toast-dark' }); }
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Flag },
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'broadcast', label: 'Broadcast', icon: Bell },
  ];

  return (
    <div className="page-container pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-gold" />
          <h1 className="font-heading text-4xl text-white tracking-tighter">Admin Panel</h1>
        </div>
        <p className="text-slate-500 font-body text-sm">Lake Guardian Control Center</p>
      </div>

      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all ${
              tab === id ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        loading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
        : stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.users.total, sub: `+${stats.users.newThisWeek} this week`, color: '#38BDF8' },
                { label: 'Active Users', value: stats.users.active, sub: `${stats.users.verified} verified`, color: '#34D399' },
                { label: 'Total Wishes', value: stats.wishes.total, sub: `+${stats.wishes.newThisWeek} this week`, color: '#FBBF24' },
                { label: 'Fulfilled', value: stats.wishes.fulfilled, sub: `${stats.fulfillments.pending} pending`, color: '#A78BFA' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="glass-card p-5 rounded-2xl">
                  <p className="text-2xl font-heading text-white">{value?.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 font-body mt-0.5">{label}</p>
                  <p className="text-xs mt-1 font-body" style={{ color }}>{sub}</p>
                </div>
              ))}
            </div>

            {stats.wishes.reported > 0 && (
              <div className="glass-card p-4 rounded-xl border-red-500/20 border bg-red-500/5">
                <p className="text-red-400 font-body text-sm font-medium">⚠️ {stats.wishes.reported} reported wishes need review</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl">
                <p className="label text-slate-400 mb-3">Wishes by Category</p>
                <div className="space-y-2">
                  {stats.charts.categories.slice(0, 6).map(({ _id, count }) => (
                    <div key={_id} className="flex items-center justify-between">
                      <span className="text-sm font-body text-slate-400 capitalize">{_id?.replace('_',' ')}</span>
                      <span className="text-sm font-body text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <p className="label text-slate-400 mb-3">Wishes by Emotion</p>
                <div className="space-y-2">
                  {stats.charts.emotions.slice(0, 6).map(({ _id, count }) => (
                    <div key={_id} className="flex items-center justify-between">
                      <span className="text-sm font-body text-slate-400 capitalize">{_id}</span>
                      <span className="text-sm font-body text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 flex items-center justify-center text-sm font-body text-white overflow-hidden">
                  {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.displayName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white font-body">{u.displayName} <span className="text-slate-500">@{u.username}</span></p>
                  <p className="text-xs text-slate-500 font-body">{u.email} • {u.role} • {u.karmaPoints} karma</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge text-xs ${u.isActive ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleUpdateUser(u._id, { isActive: !u.isActive })}
                  className="text-xs btn-ghost px-3 py-1">
                  {u.isActive ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'moderation' && (
        <div className="space-y-4">
          {reportedWishes.length === 0 ? (
            <div className="text-center py-16">
              <ShieldCheck className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
              <p className="text-slate-500 font-body">No reported wishes — the lake is clean ✨</p>
            </div>
          ) : reportedWishes.map(wish => (
            <div key={wish._id} className="glass-card p-5 rounded-xl border-red-500/10">
              <p className="font-medium text-white font-body mb-1">{wish.title}</p>
              <p className="text-sm text-slate-400 font-body mb-2 line-clamp-2">{wish.description}</p>
              <p className="text-xs text-slate-500 font-body mb-3">{wish.reports?.length} reports • by @{wish.author?.username}</p>
              <div className="flex gap-2">
                <button onClick={() => handleModerateWish(wish._id, 'approve')}
                  className="btn-ghost text-xs px-4 py-1.5">Keep</button>
                <button onClick={() => handleModerateWish(wish._id, 'reject')}
                  className="btn-danger text-xs px-4 py-1.5">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'chats' && (
        <div className="space-y-3">
          {pendingChats.length === 0 ? (
            <p className="text-center text-slate-500 font-body py-12">No pending chat requests</p>
          ) : pendingChats.map(chat => (
            <div key={chat._id} className="glass-card p-4 rounded-xl">
              <p className="text-sm font-body text-white mb-1">
                {chat.participants?.map(p => p.displayName || p.username).join(' ↔ ')}
              </p>
              {chat.relatedWish && <p className="text-xs text-slate-500 font-body mb-2">re: {chat.relatedWish.title}</p>}
              <div className="flex gap-2">
                <button onClick={() => adminAPI.approveChat(chat._id, 'approve', '').then(() => setPendingChats(prev => prev.filter(c => c._id !== chat._id)))}
                  className="btn-ghost text-xs px-3 py-1">Approve</button>
                <button onClick={() => adminAPI.approveChat(chat._id, 'reject', '').then(() => setPendingChats(prev => prev.filter(c => c._id !== chat._id)))}
                  className="btn-danger text-xs px-3 py-1">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'broadcast' && (
        <div className="max-w-lg glass-card p-8 rounded-2xl space-y-4">
          <h2 className="font-heading text-2xl text-white">Broadcast Message</h2>
          <div>
            <label className="label">Title</label>
            <input value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Announcement title" className="input-field" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
              rows={3} className="input-field resize-none" placeholder="Your message to the lake..." />
          </div>
          <div>
            <label className="label">Target (optional)</label>
            <select value={broadcastForm.targetRole} onChange={e => setBroadcastForm(f => ({ ...f, targetRole: e.target.value }))}
              className="input-field">
              <option value="" style={{ background: '#0F172A' }}>All users</option>
              <option value="user" style={{ background: '#0F172A' }}>Regular users</option>
              <option value="moderator" style={{ background: '#0F172A' }}>Moderators</option>
            </select>
          </div>
          <button onClick={handleBroadcast} className="btn-primary">
            <Bell className="w-4 h-4" /> Send Broadcast
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
