import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AnimatedLogo() {
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setReloadKey(prev => prev + 1); // increment key every 60s
    }, 5000); // 60 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      key={reloadKey} // re-mounts every 60s
      className="flex items-center justify-center flex-1"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <motion.span 
        className="text-sm text-gray-600/80 dark:text-gray-400/80 font-medium px-4 py-1.5"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.h1 
          className="text-lg font-bold bg-gradient-to-r from-gray-800 to-emerald-600 dark:from-white dark:to-emerald-400 bg-clip-text text-transparent group-hover:from-emerald-600 group-hover:to-blue-600 dark:group-hover:from-emerald-400 dark:group-hover:to-blue-400 transition-all duration-300"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 200%' }}
        >
          <div className="flex justify-center">
            <motion.svg
              viewBox="0 0 180 60"
              width="180"
              height="45"
              initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 6, delay: 0.3 }}
            >
              <text
                x="-20"
                y="45"
                fontSize="40"
                className="font-bold"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.5"
              >
                Nutrithy 🍳
              </text>
            </motion.svg>
          </div>
        </motion.h1>
      </motion.span>
    </motion.div>
  );
}
