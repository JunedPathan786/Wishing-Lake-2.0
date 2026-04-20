import { motion } from 'framer-motion';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 to-purple-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
      />
    </div>
  );
};

export default Loading;
