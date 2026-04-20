import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Eye, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { wishAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EMOTION_CONFIG = {
  hopeful:  { color: '#FBBF24', glow: 'rgba(251,191,36,0.4)',  label: 'Hopeful',  icon: '✨' },
  sad:      { color: '#94A3B8', glow: 'rgba(148,163,184,0.3)', label: 'Wistful',  icon: '🌧' },
  urgent:   { color: '#F87171', glow: 'rgba(248,113,113,0.5)', label: 'Urgent',   icon: '🔥' },
  dreamy:   { color: '#E2E8F0', glow: 'rgba(226,232,240,0.4)', label: 'Dreamy',   icon: '🌙' },
  joyful:   { color: '#34D399', glow: 'rgba(52,211,153,0.4)',  label: 'Joyful',   icon: '🌟' },
  anxious:  { color: '#FB923C', glow: 'rgba(251,146,60,0.4)',  label: 'Anxious',  icon: '🌊' },
  grateful: { color: '#A78BFA', glow: 'rgba(167,139,250,0.4)', label: 'Grateful', icon: '💜' },
};

const STATUS_CONFIG = {
  active:    { label: 'Active',    bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  matched:   { label: 'Matched',   bg: 'bg-blue-500/15',    text: 'text-blue-400'    },
  fulfilled: { label: 'Fulfilled', bg: 'bg-gold/15',        text: 'text-gold'        },
  pending:   { label: 'Pending',   bg: 'bg-slate-500/15',   text: 'text-slate-400'   },
  archived:  { label: 'Archived',  bg: 'bg-slate-500/10',   text: 'text-slate-500'   },
};

export default function WishCard({ wish, onFulfill, onDelete, showActions = true, className = '' }) {
  const { isAuthenticated, user } = useAuth();
  const [liked, setLiked] = useState(wish.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(wish.likeCount || 0);
  const [liking, setLiking] = useState(false);

  const emotion = EMOTION_CONFIG[wish.emotion] || EMOTION_CONFIG.hopeful;
  const status = STATUS_CONFIG[wish.status] || STATUS_CONFIG.active;
  const isOwner = user?._id === wish.author?._id || user?._id === wish.author;

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast('Sign in to like wishes ✨', { className: 'toast-dark' }); return; }
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await wishAPI.toggleLike(wish._id);
      setLiked(data.data.liked);
      setLikeCount(data.data.likeCount);
    } catch {
      toast.error('Could not update like', { className: 'toast-dark' });
    } finally {
      setLiking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`relative glass-card rounded-2xl p-5 flex flex-col gap-3 overflow-hidden group ${className}`}
      style={{
        borderColor: `rgba(${hexToRgb(emotion.color)}, 0.15)`,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px ${emotion.glow}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Emotion accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${emotion.color}, transparent)` }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge" style={{ color: emotion.color, borderColor: `${emotion.color}30` }}>
            {emotion.icon} {emotion.label}
          </span>
          <span className={`badge ${status.bg} ${status.text} border-transparent`}>
            {status.label}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-body whitespace-nowrap flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(wish.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Title */}
      <Link to={`/lake?wish=${wish._id}`}>
        <h3 className="font-heading text-xl text-white leading-tight hover:text-gold transition-colors line-clamp-2">
          {wish.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-sm text-slate-400 font-body leading-relaxed line-clamp-3 flex-1">
        {wish.description}
      </p>

      {/* Tags */}
      {wish.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {wish.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-body">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        {/* Author */}
        <div className="flex items-center gap-2">
          {wish.author && wish.visibility !== 'anonymous' ? (
            <Link to={`/profile/${wish.author.username}`}
              className="flex items-center gap-1.5 hover:text-white transition-colors group/author">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold/30 to-silver/30 flex items-center justify-center text-xs font-body font-medium text-white overflow-hidden">
                {wish.author.avatar
                  ? <img src={wish.author.avatar} alt="" className="w-full h-full object-cover" />
                  : wish.author.displayName?.[0]?.toUpperCase()
                }
              </div>
              <span className="text-xs text-slate-500 group-hover/author:text-slate-300 font-body">
                {wish.author.displayName || wish.author.username}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="w-3.5 h-3.5" />
              <span className="text-xs font-body">Anonymous</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleLike}
            className={`flex items-center gap-1 text-xs font-body transition-all ${
              liked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
            }`}>
            <Heart className={`w-3.5 h-3.5 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
            {likeCount}
          </button>

          <div className="flex items-center gap-1 text-xs text-slate-500 font-body">
            <Eye className="w-3.5 h-3.5" />
            {wish.viewCount || 0}
          </div>

          {showActions && isAuthenticated && !isOwner && wish.status === 'active' && (
            <button
              onClick={(e) => { e.preventDefault(); onFulfill?.(wish); }}
              className="flex items-center gap-1 text-xs font-body px-3 py-1 rounded-full transition-all"
              style={{
                background: `${emotion.color}15`,
                color: emotion.color,
                border: `1px solid ${emotion.color}30`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${emotion.color}25`}
              onMouseLeave={e => e.currentTarget.style.background = `${emotion.color}15`}
            >
              <Sparkles className="w-3 h-3" />
              Fulfill
            </button>
          )}

          {isOwner && onDelete && (
            <button onClick={(e) => { e.preventDefault(); onDelete(wish._id); }}
              className="text-xs text-slate-600 hover:text-red-400 transition-colors font-body px-2 py-1">
              Delete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
