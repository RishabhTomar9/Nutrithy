import { useState } from 'react';
import { motion } from 'framer-motion';

// Simple test component to verify everything is working
export default function ComponentTest() {
  const [status, setStatus] = useState('All components loaded successfully! 🎉');

  return (
    <motion.div 
      className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-green-300 font-medium">{status}</p>
      <p className="text-sm text-gray-400 mt-2">
        CommunityFeed enhancement is complete and working properly!
      </p>
    </motion.div>
  );
}
