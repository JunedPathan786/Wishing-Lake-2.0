// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Heart, Sparkles, Star, ExternalLink } from 'lucide-react';
import { usersAPI } from '../services/api';
import WishCard from '../components/WishCard';

export function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    usersAPI.getProfile(username)
      .then(({ data }) => {
        setProfile(data.data.user);
        setWishes(data.data.wishes);
      })
      .catch(err => setError(err.response?.data?.message || 'Profile not found'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div className="page-container"><div className="skeleton h-48 rounded-3xl mb-8" /><div className="grid grid-cols-3 gap-6">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-48" />)}</div></div>
  );
  if (error) return (
    <div className="page-container flex items-center justify-center min-h-screen">
      <div className="text-center">
        <span className="text-5xl block mb-4">🌊</span>
        <p className="font-heading text-2xl text-slate-400">{error}</p>
        <Link to="/lake" className="btn-primary mt-6 inline-flex">Back to the Lake</Link>
      </div>
    </div>
  );

  return (
    <div className="page-container pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 border-2 border-white/20 flex items-center justify-center text-3xl font-body font-medium text-white overflow-hidden flex-shrink-0">
            {profile?.avatar ? <img src={profile.avatar} alt={profile.displayName} className="w-full h-full object-cover" /> : profile?.displayName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-heading text-3xl text-white">{profile?.displayName}</h1>
              {profile?.isVerified && <span className="badge text-xs text-emerald-400 border-emerald-400/20 bg-emerald-400/10">✓ Verified</span>}
            </div>
            <p className="text-slate-500 font-body text-sm mt-0.5">@{profile?.username}</p>
            {profile?.bio && <p className="text-slate-300 font-body text-sm mt-2 max-w-lg">{profile.bio}</p>}

            <div className="flex gap-6 mt-4">
              {[
                { label: 'Wishes', value: profile?.wishCount || 0, icon: Sparkles },
                { label: 'Fulfilled', value: profile?.fulfillmentCount || 0, icon: Heart },
                { label: 'Karma', value: profile?.karmaPoints || 0, icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-gold" />
                  <span className="font-body text-white text-sm font-medium">{value.toLocaleString()}</span>
                  <span className="text-slate-500 text-xs font-body">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {profile?.badges?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="label text-slate-400 mb-3">Badges</p>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((badge, i) => (
                <span key={i} className="badge px-4 py-1.5 text-sm border-gold/20 bg-gold/5 text-gold">
                  {badge.icon} {badge.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {wishes.length > 0 && (
        <div>
          <p className="label text-slate-400 mb-4">Public Wishes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishes.map(wish => <WishCard key={wish._id} wish={wish} showActions={false} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// NotFoundPage
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <span className="text-6xl block mb-6">🌊</span>
        <h1 className="font-heading text-6xl text-white mb-4">404</h1>
        <p className="font-heading text-2xl text-slate-400 mb-2">Lost in the lake</p>
        <p className="text-slate-600 font-body text-sm mb-8">The page you seek is somewhere beneath the waters.</p>
        <Link to="/" className="btn-primary">
          <Sparkles className="w-4 h-4" /> Return to the Lake
        </Link>
      </motion.div>
    </div>
  );
}

export default ProfilePage;
