import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { wishAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function MyWishesPage() {
  const { user } = useAuth();
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    try {
      const result = await wishAPI.getMyWishes();
      if (result.success) {
        setWishes(result.wishes);
      } else {
        toast.error('Failed to load your wishes');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
      'in-progress': 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      fulfilled: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      cancelled: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || colors.pending;
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
            My Wishes ⭐
          </span>
        </h2>

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
            You haven't made any wishes yet
          </div>
        ) : (
          <div className="space-y-6">
            {wishes.map((wish, i) => (
              <motion.div
                key={wish._id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold dark:text-white">{wish.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(wish.status)}`}>
                        {wish.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {wish.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full">
                        {wish.category}
                      </span>
                      {wish.budget > 0 && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full">
                          ₹{wish.budget}
                        </span>
                      )}
                      {wish.fulfiller && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                          Being fulfilled
                        </span>
                      )}
                    </div>
                  </div>

                  {wish.status === 'fulfilled' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    >
                      <Check className="w-8 h-8 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}