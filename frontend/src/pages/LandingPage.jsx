import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Animated background */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              animate={{
                y: [0, -1000],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%'
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 1 }}
          >
            <Sparkles className="w-24 h-24 mx-auto text-yellow-400 mb-8" />
          </motion.div>

          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            The Wishing Lake of Smiles
          </motion.h1>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-purple-200 mb-12"
          >
            Where Dreams Meet Kindness ✨
          </motion.p>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/toss-wish')}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xl font-semibold shadow-2xl hover:shadow-purple-500/50"
            >
              🌟 Toss a Wish
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/fulfill-wish')}
              className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xl font-semibold shadow-2xl hover:shadow-pink-500/50"
            >
              💝 Fulfill a Wish
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}