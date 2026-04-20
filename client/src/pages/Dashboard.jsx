import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Star, Bell, Settings, Plus, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { wishAPI, fulfillmentAPI, notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import WishCard from '../components/WishCard';
import CoinDropModal from '../components/CoinDropModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'wishes',        icon: Sparkles,     label: 'My Wishes'    },
  { id: 'fulfillments',  icon: Heart,         label: 'Fulfilled'    },
  { id: 'notifications', icon: Bell,          label: 'Notifications'},
  { id: 'profile',       icon: Settings,      label: 'Profile'      },
];

export default function Dashboard() {
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState('wishes');
  const [wishes, setWishes] = useState([]);
  const [fulfillments, setFulfillments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfileForm({ displayName: user.displayName || user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
  }, [user]);

  const handleAvatarBrowse = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.', { className: 'toast-dark' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB.', { className: 'toast-dark' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm(f => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  const loadTabData = async (t) => {
    setLoading(true);
    try {
      if (t === 'wishes') {
        const { data } = await wishAPI.getMyWishes({ limit: 20 });
        const list = data?.data?.wishes || data?.wishes || [];
        setWishes(list);
      } else if (t === 'fulfillments') {
        const { data } = await fulfillmentAPI.getMyFulfillments();
        const list = data?.data?.requests || data?.requests || data?.asFulfiller || [];
        setFulfillments(list);
      } else if (t === 'notifications') {
        const { data } = await notificationAPI.getAll({ limit: 30 });
        setNotifications(data?.data?.notifications || []);
      }
    } catch {
      toast.error('Could not load data', { className: 'toast-dark' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWish = async (id) => {
    try {
      await wishAPI.deleteWish(id);
      setWishes(prev => prev.filter(w => w._id !== id));
      toast.success('Wish removed from the lake.', { className: 'toast-dark' });
    } catch {
      toast.error('Could not delete wish.', { className: 'toast-dark' });
    }
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({ ...profileForm, name: profileForm.displayName });
    setSaving(false);
  };

  const stats = [
    { label: 'Wishes Made', value: user?.wishCount || 0,        icon: Sparkles, color: '#FBBF24' },
    { label: 'Wishes Fulfilled', value: user?.fulfillmentCount || 0, icon: Heart,    color: '#34D399' },
    { label: 'Karma Points', value: user?.karmaPoints || 0,     icon: Star,      color: '#A78BFA' },
    { label: 'Badges Earned', value: user?.badges?.length || 0,  icon: Award,     color: '#38BDF8' },
  ];

  return (
    <div className="page-container pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <p className="label text-gold mb-2">Your Space</p>
          <h1 className="font-heading text-4xl md:text-5xl text-white tracking-tighter">
            Welcome back, <span className="gradient-gold italic">{user?.displayName || user?.name || 'Wisher'}</span>
          </h1>
        </div>
        <button onClick={() => setCoinOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Wish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-5 h-5" style={{ color }} />
              <TrendingUp className="w-4 h-4 text-slate-700" />
            </div>
            <p className="font-heading text-3xl text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 font-body mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      {user?.badges?.length > 0 && (
        <div className="glass-card p-5 rounded-2xl mb-8">
          <p className="label text-slate-400 mb-3">Your Badges</p>
          <div className="flex flex-wrap gap-2">
            {user.badges.map((badge, i) => (
              <span key={i} className="badge px-4 py-1.5 text-sm border-gold/20 bg-gold/5 text-gold">
                {badge.icon} {badge.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body whitespace-nowrap transition-all ${
              tab === id
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* ── My Wishes ── */}
          {tab === 'wishes' && (
            loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-64" />)}
              </div>
            ) : wishes.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl block mb-4">🌊</span>
                <p className="font-heading text-2xl text-slate-400 mb-2">No wishes yet</p>
                <p className="text-slate-600 text-sm font-body mb-6">Drop your first wish into the lake</p>
                <button onClick={() => setCoinOpen(true)} className="btn-primary">
                  <Sparkles className="w-4 h-4" /> Drop a Wish
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishes.map(wish => (
                  <WishCard key={wish._id} wish={wish} onDelete={handleDeleteWish} showActions={false} />
                ))}
              </div>
            )
          )}

          {/* ── Fulfillments ── */}
          {tab === 'fulfillments' && (
            loading ? <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
            : fulfillments.length === 0 ? (
              <div className="text-center py-20">
                <Heart className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="font-heading text-2xl text-slate-400 mb-2">No fulfillments yet</p>
                <p className="text-slate-600 text-sm font-body">Browse the lake and fulfill someone's wish</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fulfillments.map(req => (
                  <div key={req._id} className="glass-card p-5 rounded-2xl flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      req.status === 'completed' ? 'bg-emerald-500/20' :
                      req.status === 'author_approved' ? 'bg-blue-500/20' :
                      req.status === 'rejected' ? 'bg-red-500/20' : 'bg-slate-500/20'
                    }`}>
                      <CheckCircle className={`w-5 h-5 ${
                        req.status === 'completed' ? 'text-emerald-400' :
                        req.status === 'author_approved' ? 'text-blue-400' :
                        req.status === 'rejected' ? 'text-red-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-body font-medium truncate">
                        {req.wish?.title || 'Wish'}
                      </p>
                      <p className="text-sm text-slate-400 font-body line-clamp-1 mt-0.5">{req.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-body px-2 py-0.5 rounded-full ${
                          req.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
                          req.status === 'author_approved' ? 'bg-blue-500/15 text-blue-400' :
                          req.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-slate-500/15 text-slate-400'
                        }`}>{req.status.replace('_', ' ')}</span>
                        <span className="text-xs text-slate-600 font-body flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </span>
                        {req.karmaAwarded > 0 && (
                          <span className="text-xs text-gold font-body flex items-center gap-1">
                            <Star className="w-3 h-3" /> +{req.karmaAwarded} karma
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Notifications ── */}
          {tab === 'notifications' && (
            <>
              {notifications.some(n => !n.isRead) && (
                <button onClick={handleMarkAllRead}
                  className="btn-ghost text-sm mb-4">
                  Mark all as read
                </button>
              )}
              {loading ? <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
              : notifications.length === 0 ? (
                <div className="text-center py-20">
                  <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="font-heading text-2xl text-slate-400">All quiet here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n._id}
                      className={`glass-card p-4 rounded-xl flex items-start gap-3 ${!n.isRead ? 'border-gold/10' : ''}`}>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white font-body">{n.title}</p>
                        <p className="text-xs text-slate-400 font-body mt-0.5">{n.message}</p>
                        <p className="text-xs text-slate-600 font-body mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Profile Settings ── */}
          {tab === 'profile' && (
            <div className="max-w-lg">
              <div className="glass-card p-8 rounded-2xl space-y-5">
                <h2 className="font-heading text-2xl text-white">Profile Settings</h2>

                <div>
                  <label className="label">Display Name</label>
                  <input value={profileForm.displayName}
                    onChange={e => setProfileForm(f => ({ ...f, displayName: e.target.value }))}
                    className="input-field" placeholder="Your display name" />
                </div>

                <div>
                  <label className="label">Bio</label>
                  <textarea value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                    rows={3} className="input-field resize-none"
                    placeholder="Tell the lake about yourself..." />
                </div>

                <div>
                  <label className="label">Avatar URL</label>
                  <input value={profileForm.avatar}
                    onChange={e => setProfileForm(f => ({ ...f, avatar: e.target.value }))}
                    className="input-field" placeholder="https://..." />
                  <div className="mt-2 flex items-center gap-3">
                    <label className="btn-ghost text-xs px-3 py-1.5 cursor-pointer">
                      Browse Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarBrowse} />
                    </label>
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                      <img
                        src={profileForm.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.displayName || user?.displayName || user?.name || 'User')}&background=0F172A&color=F8FAFC&size=128`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? <div className="w-4 h-4 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" /> : 'Save Changes'}
                </button>
              </div>

              {/* Account info */}
              <div className="glass-card p-6 rounded-2xl mt-4 space-y-2">
                <h3 className="font-heading text-lg text-white mb-3">Account Info</h3>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-slate-500">Username</span>
                  <span className="text-white">@{user?.username}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-slate-500">Email</span>
                  <span className="text-white">{user?.email}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-slate-500">Email verified</span>
                  <span className={user?.isVerified ? 'text-emerald-400' : 'text-yellow-500'}>
                    {user?.isVerified ? '✓ Verified' : 'Not verified'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-slate-500">Role</span>
                  <span className="text-white capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <CoinDropModal isOpen={coinOpen} onClose={() => setCoinOpen(false)}
        onSuccess={() => { setCoinOpen(false); loadTabData('wishes'); }} />
    </div>
  );
}
