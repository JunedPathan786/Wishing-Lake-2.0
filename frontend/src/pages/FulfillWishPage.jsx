import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { wishAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function FulfillWishPage() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadWishes();
  }, [selectedCategory]);

  const loadWishes = async () => {
    setLoading(true);
    try {
      let result;
      if (selectedCategory === 'all') {
        result = await wishAPI.getAllWishes({ page: 1, limit: 20 });
      } else {
        result = await wishAPI.filterWishes({ category: selectedCategory, page: 1, limit: 20 });
      }
      
      if (result.success) {
        setWishes(result.wishes);
      }
    } catch (err) {
      toast.error('Failed to load wishes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (wishId) => {
    const result = await api.acceptWish(token, wishId);
    if (result.success) {
      alert('Wish accepted! Check My Wishes to track progress.');
      loadWishes();
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
        <h2 className="text-4xl font-bold mb-8 text-center">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Fulfill a Wish 💝
          </span>
        </h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          {['all', 'material', 'message', 'creative', 'custom'].map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"
            />
          </div>
        ) : wishes.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No wishes available in this category
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishes.map((wish, i) => (
              <motion.div
                key={wish._id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold dark:text-white">{wish.title}</h3>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-sm">
                    {wish.category}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {wish.description}
                </p>

                {wish.budget > 0 && (
                  <p className="text-lg font-semibold text-green-600 mb-4">
                    ₹{wish.budget}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAccept(wish._id)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
                >
                  Accept & Fulfill ✨
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}