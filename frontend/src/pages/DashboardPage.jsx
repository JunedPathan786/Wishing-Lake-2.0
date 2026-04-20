import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ made: 0, fulfilled: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      if (user) {
        const result = await userAPI.getStats();
        if (result.success) {
          setStats(result.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 pt-24 px-4 pb-12"
    >
      <div className="container mx-auto max-w-6xl">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-5xl font-bold text-center mb-4"
        >
          Welcome, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{user?.name}</span>! ✨
        </motion.h1>

        <motion.p
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center text-gray-600 dark:text-gray-300 mb-12"
        >
          Your magical dashboard awaits
        </motion.p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Wishes Made', value: stats.made, icon: Send, color: 'from-blue-500 to-cyan-500' },
            { label: 'Wishes Fulfilled', value: stats.fulfilled, icon: Heart, color: 'from-pink-500 to-rose-500' },
            { label: 'Pending Wishes', value: stats.pending, icon: Star, color: 'from-purple-500 to-indigo-500' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2 dark:text-white">{stat.value}</h3>
              <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Toss a Wish', page: '/toss-wish', gradient: 'from-purple-600 to-pink-600' },
            { label: 'Fulfill a Wish', page: '/fulfill-wish', gradient: 'from-pink-600 to-rose-600' },
            { label: 'My Wishes', page: '/my-wishes', gradient: 'from-indigo-600 to-purple-600' }
          ].map((btn, i) => (
            <motion.button
              key={btn.label}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(btn.page)}
              className={`bg-gradient-to-r ${btn.gradient} text-white rounded-2xl p-8 shadow-2xl hover:shadow-purple-500/50 transition-all`}
            >
              <span className="text-4xl mb-4 block">✨</span>
              <h3 className="text-2xl font-bold">{btn.label}</h3>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}