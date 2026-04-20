import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { wishAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function TossWishPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Material',
    budget: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await wishAPI.createWish(formData);
      
      if (result.success) {
        setSuccess(true);
        toast.success('Wish created successfully!');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast.error(result.message || 'Failed to create wish');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1 }}
          >
            <Check className="w-24 h-24 text-green-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white mb-2">Wish Tossed! ✨</h2>
          <p className="text-purple-200">Returning to dashboard...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900 pt-24 px-4 pb-12"
    >
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8"
        >
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Toss Your Wish 🌟
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Wish Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                rows={4}
                required
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="material">Material Wish</option>
                <option value="message">Message Delivery</option>
                <option value="creative">Creative Gift</option>
                <option value="custom">Custom Idea</option>
              </select>
            </div>

            {formData.category === 'material' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">Budget (₹)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                  min="0"
                  required
                />
              </motion.div>
            )}

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setCurrentPage('dashboard')}
                className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Tossing...' : 'Toss Wish ✨'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}