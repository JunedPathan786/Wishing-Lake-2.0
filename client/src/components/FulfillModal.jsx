import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Heart } from 'lucide-react';
import { fulfillmentAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function FulfillModal({ wish, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (message.length < 20) {
      toast.error('Please write at least 20 characters explaining how you can help.', { className: 'toast-dark' });
      return;
    }
    setLoading(true);
    try {
      await fulfillmentAPI.offerFulfillment(wish._id, { message });
      toast.success('Your offer has been sent! ✨', { className: 'toast-dark' });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send offer', { className: 'toast-dark' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {wish && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="w-full max-w-md glass rounded-3xl p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl text-white mb-1">Fulfill This Wish</h2>
                <p className="text-slate-400 text-sm font-body">Tell them how you can help</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wish preview */}
            <div className="glass-card p-4 rounded-xl mb-6">
              <p className="text-xs text-slate-500 font-body mb-1 uppercase tracking-widest">The Wish</p>
              <p className="font-heading text-lg text-white">{wish.title}</p>
              <p className="text-sm text-slate-400 font-body mt-1 line-clamp-2">{wish.description}</p>
            </div>

            <div className="mb-6">
              <label className="label">Your offer</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe how you can make this wish come true..."
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-xs text-slate-600 mt-1 font-body text-right">{message.length}/1000</p>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || message.length < 20}
                className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-lake-bg border-t-transparent animate-spin" />
                ) : (
                  <><Heart className="w-4 h-4" /> Send Offer</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
