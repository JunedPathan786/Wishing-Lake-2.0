import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Eye, EyeOff, Lock } from 'lucide-react';
import { wishAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COIN_IMG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/f3ac1c43a94e1507aabbb1a1ce7f11249f296cf368379ad5cfeb4c1fb9b0d9d1.png';

const EMOTIONS = [
  { value: 'hopeful',  label: 'Hopeful',  icon: '✨', color: '#FBBF24' },
  { value: 'dreamy',   label: 'Dreamy',   icon: '🌙', color: '#E2E8F0' },
  { value: 'joyful',   label: 'Joyful',   icon: '🌟', color: '#34D399' },
  { value: 'urgent',   label: 'Urgent',   icon: '🔥', color: '#F87171' },
  { value: 'grateful', label: 'Grateful', icon: '💜', color: '#A78BFA' },
  { value: 'anxious',  label: 'Anxious',  icon: '🌊', color: '#FB923C' },
  { value: 'sad',      label: 'Wistful',  icon: '🌧', color: '#94A3B8' },
];

const CATEGORIES = [
  'health','love','career','family','travel',
  'education','financial','personal_growth','community','creative','other',
];

export default function CoinDropModal({ isOpen, onClose, onSuccess }) {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1); // 1=form 2=ritual 3=success
  const [dropping, setDropping] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'other',
    emotion: 'hopeful', visibility: 'public', tags: '',
  });
  const [errors, setErrors] = useState({});
  const rippleRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 5) e.title = 'Title needs at least 5 characters';
    if (!form.description.trim() || form.description.length < 20) e.description = 'Description needs at least 20 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCoinDrop = async () => {
    if (!validate()) return;
    setStep(2);
    setDropping(true);

    // Wait for animation (1.4s)
    await new Promise(r => setTimeout(r, 1400));

    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await wishAPI.createWish({ ...form, tags });
      setStep(3);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not drop wish', { className: 'toast-dark' });
      setStep(1);
    } finally {
      setDropping(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setForm({ title: '', description: '', category: 'other', emotion: 'hopeful', visibility: 'public', tags: '' });
    setErrors({});
    onClose();
  };

  const selectedEmotion = EMOTIONS.find(e => e.value === form.emotion);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-lg glass rounded-3xl overflow-hidden relative"
          >
            {/* Close */}
            {step !== 2 && (
              <button onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}

            {/* ── Step 1: Form ────────────────────────────────────── */}
            {step === 1 && (
              <div className="p-8">
                <div className="mb-6 text-center">
                  <h2 className="font-heading text-3xl text-white mb-1">Drop Your Wish</h2>
                  <p className="text-slate-400 text-sm font-body">Speak your desire into the lake</p>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="label">Your Wish</label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="I wish for..."
                      className="input-field"
                    />
                    {errors.title && <p className="text-xs text-red-400 mt-1 font-body">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Tell the lake more</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your wish in detail..."
                      rows={3}
                      className="input-field resize-none"
                    />
                    {errors.description && <p className="text-xs text-red-400 mt-1 font-body">{errors.description}</p>}
                  </div>

                  {/* Emotion selector */}
                  <div>
                    <label className="label">The feeling behind it</label>
                    <div className="flex flex-wrap gap-2">
                      {EMOTIONS.map(em => (
                        <button key={em.value}
                          onClick={() => setForm(f => ({ ...f, emotion: em.value }))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-all border"
                          style={{
                            borderColor: form.emotion === em.value ? em.color : 'rgba(255,255,255,0.1)',
                            background: form.emotion === em.value ? `${em.color}20` : 'transparent',
                            color: form.emotion === em.value ? em.color : '#94A3B8',
                          }}>
                          {em.icon} {em.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category + Visibility row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Category</label>
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="input-field capitalize"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c} style={{ background: '#0F172A' }}>
                            {c.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Visibility</label>
                      <select
                        value={form.visibility}
                        onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                        className="input-field"
                      >
                        <option value="public" style={{ background: '#0F172A' }}>🌊 Public</option>
                        <option value="anonymous" style={{ background: '#0F172A' }}>🎭 Anonymous</option>
                        <option value="private" style={{ background: '#0F172A' }}>🔒 Private</option>
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="label">Tags <span className="text-slate-600 normal-case tracking-normal">(comma-separated)</span></label>
                    <input
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="love, family, travel..."
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCoinDrop}
                  className="btn-primary w-full mt-6 justify-center text-base py-3.5"
                  style={{
                    background: `linear-gradient(135deg, ${selectedEmotion?.color || '#FDE047'}, #F59E0B)`,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Drop Wish Into the Lake
                </button>

                <p className="text-center text-xs text-slate-600 mt-3 font-body">
                  {form.visibility === 'private' ? '🔒 Only you will see this wish' :
                   form.visibility === 'anonymous' ? '🎭 Your identity will be hidden' :
                   '🌊 The whole lake will see your wish'}
                </p>
              </div>
            )}

            {/* ── Step 2: Coin Drop Ritual ─────────────────────── */}
            {step === 2 && (
              <div className="relative h-80 flex items-center justify-center overflow-hidden"
                ref={rippleRef}>
                {/* Ripple rings */}
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border border-white/20"
                    style={{ width: 80, height: 80 }}
                    animate={{
                      width: ['80px', '300px'],
                      height: ['80px', '300px'],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.3 + 0.7,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Coin */}
                <motion.img
                  src={COIN_IMG}
                  alt="Wishing coin"
                  className="w-24 h-24 object-contain relative z-10"
                  initial={{ scale: 0, y: -60, opacity: 0 }}
                  animate={[
                    { scale: 1.2, y: 0, opacity: 1, transition: { duration: 0.3 } },
                    { scale: 1, y: 0, opacity: 1, transition: { duration: 0.2, delay: 0.3 } },
                    { scale: 0.6, y: 180, opacity: 0, transition: { duration: 0.5, delay: 0.8 } },
                  ]}
                  style={{ filter: `drop-shadow(0 0 20px ${selectedEmotion?.color || '#FDE047'})` }}
                />

                <p className="absolute bottom-8 font-heading text-xl text-slate-300 tracking-wide">
                  The lake receives your wish...
                </p>
              </div>
            )}

            {/* ── Step 3: Success ──────────────────────────────── */}
            {step === 3 && (
              <div className="p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="text-6xl mb-6"
                >
                  🌟
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-heading text-3xl text-white mb-3"
                >
                  Your Wish Has Been Heard
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-400 font-body text-sm leading-relaxed mb-8 max-w-xs mx-auto"
                >
                  The Wishing Lake has received your wish. May the waters carry it to those who can make it real.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3 justify-center"
                >
                  <button onClick={handleClose} className="btn-ghost">Close</button>
                  <button onClick={() => { setStep(1); setForm({ title:'',description:'',category:'other',emotion:'hopeful',visibility:'public',tags:'' }); }}
                    className="btn-primary">
                    <Sparkles className="w-4 h-4" /> Another Wish
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
