// PageLoader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-lake-bg flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-10 h-10 text-gold" />
        </motion.div>
        <p className="font-heading text-lg text-slate-400 tracking-widest">Loading</p>
      </motion.div>
    </div>
  );
}
