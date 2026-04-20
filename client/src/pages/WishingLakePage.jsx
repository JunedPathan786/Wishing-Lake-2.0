import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { wishAPI, fulfillmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import WishCard from '../components/WishCard';
import CoinDropModal from '../components/CoinDropModal';
import FulfillModal from '../components/FulfillModal';
import toast from 'react-hot-toast';

const ORB_IMG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/14f585043dd5f541c93a9002f48c4fe5e53106e673238d3b2b2b573d1567ba33.png';
const HERO_BG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/551640e87425f247df4ff054683acfcf0b32ec86d8781185480bd73c4b340037.png';

const EMOTIONS = ['hopeful','dreamy','joyful','urgent','grateful','anxious','sad'];
const CATEGORIES = ['health','love','career','family','travel','education','financial','personal_growth','community','creative'];
const SORTS = [
  { value: '-createdAt', label: 'Newest' },
  { value: '-likeCount', label: 'Most Liked' },
  { value: '-viewCount', label: 'Most Viewed' },
];

function LiveOrb({ wish, onDismiss }) {
  const color = '#FBBF24';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: Math.random() > 0.5 ? 80 : -80 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: [0, -10, 0] }}
      exit={{ opacity: 0, scale: 0, y: -40 }}
      transition={{ duration: 0.5, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      className="cursor-pointer relative group"
      onClick={onDismiss}
    >
      <div className="relative w-14 h-14">
        <img src={ORB_IMG} alt="" className="w-full h-full object-contain"
          style={{ filter: `drop-shadow(0 0 12px ${color}) hue-rotate(${getHueRotate(wish?.emotion)}deg)` }} />
      </div>
    </motion.div>
  );
}

function getHueRotate(emotion) {
  const map = { hopeful: 0, sad: 200, urgent: 340, dreamy: 270, joyful: 140, anxious: 30, grateful: 260 };
  return map[emotion] || 0;
}

export default function WishingLakePage() {
  const { isAuthenticated } = useAuth();
  const { lakeActivity, on } = useSocket();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [coinOpen, setCoinOpen] = useState(false);
  const [fulfillTarget, setFulfillTarget] = useState(null);
  const [liveOrbs, setLiveOrbs] = useState([]);
  const [filters, setFilters] = useState({ emotion: '', category: '', sort: '-createdAt', search: '' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const loaderRef = useRef(null);

  const fetchWishes = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const pg = reset ? 1 : page;
      const { data } = await wishAPI.getFeed({
        page: pg, limit: 12,
        ...(filters.emotion && { emotion: filters.emotion }),
        ...(filters.category && { category: filters.category }),
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
      });
      const nextWishes = data?.data?.wishes || data?.wishes || [];
      const totalCount = data?.total ?? data?.totalWishes ?? data?.data?.total ?? nextWishes.length;
      const totalPages = data?.pages ?? data?.totalPages ?? 1;

      setWishes(prev => reset ? nextWishes : [...prev, ...nextWishes]);
      setTotal(totalCount);
      setHasMore(pg < totalPages);
      if (reset) setPage(1);
    } catch {
      toast.error('Could not load wishes', { className: 'toast-dark' });
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchWishes(true); }, [filters]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) setPage(p => p + 1); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) fetchWishes(false);
  }, [page]);

  // Live orbs from socket
  useEffect(() => {
    const cleanup = on('new_wish', (wish) => {
      const id = Date.now();
      setLiveOrbs(prev => [...prev.slice(-6), { ...wish, _orbId: id }]);
      setTimeout(() => setLiveOrbs(prev => prev.filter(o => o._orbId !== id)), 8000);
    });
    return cleanup;
  }, [on]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, search: searchInput }));
  };

  const handleFulfill = (wish) => {
    if (!isAuthenticated) { toast('Sign in to fulfill wishes ✨', { className: 'toast-dark' }); return; }
    setFulfillTarget(wish);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #020617 0%, transparent 40%, #020617 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <p className="label text-gold mb-2">The Lake</p>
            <h1 className="font-heading text-4xl md:text-5xl text-white tracking-tighter">
              Wishes Adrift
            </h1>
            <p className="text-slate-400 font-body text-sm mt-1">
              {total.toLocaleString()} wishes floating in the lake
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live orbs strip */}
            <AnimatePresence>
              <div className="hidden md:flex items-end gap-3 h-14 overflow-hidden">
                {liveOrbs.slice(-4).map(orb => (
                  <LiveOrb key={orb._orbId} wish={orb}
                    onDismiss={() => setLiveOrbs(prev => prev.filter(o => o._orbId !== orb._orbId))} />
                ))}
              </div>
            </AnimatePresence>

            {isAuthenticated && (
              <button onClick={() => setCoinOpen(true)}
                className="btn-primary whitespace-nowrap"
                data-testid="drop-wish-button">
                <Plus className="w-4 h-4" />
                Drop a Wish
              </button>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search wishes..."
                className="input-field pl-10"
              />
            </div>
            <button type="submit" className="btn-ghost px-4">Search</button>
          </form>

          <button onClick={() => setFiltersOpen(o => !o)}
            className={`btn-ghost flex items-center gap-2 ${filtersOpen ? 'border-gold/40 text-gold' : ''}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {(filters.emotion || filters.category) && (
              <span className="w-2 h-2 rounded-full bg-gold" />
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass rounded-2xl p-5 mb-8 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="label">Emotion</label>
                  <div className="flex flex-wrap gap-2">
                    {['', ...EMOTIONS].map(em => (
                      <button key={em}
                        onClick={() => setFilters(f => ({ ...f, emotion: em }))}
                        className={`px-3 py-1 rounded-full text-xs font-body border transition-all ${
                          filters.emotion === em
                            ? 'border-gold/50 bg-gold/15 text-gold'
                            : 'border-white/10 text-slate-500 hover:text-slate-300'
                        }`}>
                        {em || 'All'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={filters.category}
                    onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
                    className="input-field capitalize">
                    <option value="" style={{ background: '#0F172A' }}>All categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} style={{ background: '#0F172A' }}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Sort By</label>
                  <select value={filters.sort}
                    onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                    className="input-field">
                    {SORTS.map(s => (
                      <option key={s.value} value={s.value} style={{ background: '#0F172A' }}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(filters.emotion || filters.category || filters.search) && (
                <button onClick={() => { setFilters({ emotion: '', category: '', sort: '-createdAt', search: '' }); setSearchInput(''); }}
                  className="mt-4 text-xs text-slate-500 hover:text-red-400 transition-colors font-body flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wish grid */}
        {loading && wishes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton h-64" />
            ))}
          </div>
        ) : wishes.length === 0 ? (
          <div className="text-center py-24">
            <span className="text-5xl block mb-4">🌊</span>
            <p className="font-heading text-2xl text-slate-400 mb-2">The lake is still</p>
            <p className="text-slate-600 font-body text-sm">No wishes match your search. Be the first to drop one.</p>
            {isAuthenticated && (
              <button onClick={() => setCoinOpen(true)} className="btn-primary mt-6">
                <Sparkles className="w-4 h-4" /> Drop the First Wish
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {wishes.map((wish, i) => (
                  <WishCard key={wish._id} wish={wish} onFulfill={handleFulfill}
                    className="animate-fade-up" style={{ animationDelay: `${(i % 12) * 50}ms` }} />
                ))}
              </AnimatePresence>
            </div>

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center mt-10">
              {loading && <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />}
              {!hasMore && wishes.length > 0 && (
                <p className="text-slate-600 font-body text-sm">
                  You've seen all {total.toLocaleString()} wishes 🌙
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <CoinDropModal
        isOpen={coinOpen}
        onClose={() => setCoinOpen(false)}
        onSuccess={() => { setCoinOpen(false); fetchWishes(true); }}
      />

      {fulfillTarget && (
        <FulfillModal
          wish={fulfillTarget}
          onClose={() => setFulfillTarget(null)}
          onSuccess={() => { setFulfillTarget(null); fetchWishes(true); }}
        />
      )}
    </div>
  );
}
