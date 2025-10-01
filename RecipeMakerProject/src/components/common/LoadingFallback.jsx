import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingFallback = ({ 
  message = 'Loading...', 
  size = 'default',
  minimal = false 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  if (minimal) {
    return (
      <div className="flex items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 
            className={`${sizeClasses[size]} text-emerald-400`}
            aria-hidden="true"
          />
        </motion.div>
        <span className="sr-only">{message}</span>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        {/* App Logo/Icon */}
        <motion.div 
          className="relative mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
        >
          {/* Outer Ring */}
          <motion.div
            className="w-20 h-20 rounded-full border-4 border-gray-700 mx-auto relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-emerald-400 rounded-full -translate-x-1/2 -translate-y-1"></div>
          </motion.div>
          
          {/* Inner Content */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* Nutrithy Icon - Simple N */}
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">N</span>
            </div>
          </motion.div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-light text-white mb-2 tracking-wide">
            Nutrithy
          </h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 mx-auto rounded-full"></div>
        </motion.div>

        {/* Loading Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gray-400 text-sm font-medium mb-8 tracking-wide"
          id="loading-message"
        >
          {message}
        </motion.p>

        {/* Loading Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center space-x-1.5"
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-emerald-400 rounded-full"
              animate={{ 
                y: [-4, 4, -4],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

// Route-specific loading component
export const RouteLoadingFallback = ({ routeName }) => {
  const loadingMessages = {
    'recipes': 'Preparing healthy recipes...',
    'community': 'Loading nutrition community...',
    'profile': 'Loading your profile...',
    'diet-planner': 'Starting nutrition planner...',
    'register-profile': 'Setting up your profile...',
    'login': 'Connecting to Nutrithy...',
    'default': 'Loading...'
  };

  const message = loadingMessages[routeName] || loadingMessages.default;

  return <LoadingFallback message={message} />;
};

// Suspense boundary component
export const SuspenseBoundary = ({ children, fallback, routeName }) => {
  const fallbackComponent = fallback || <RouteLoadingFallback routeName={routeName} />;
  
  return (
    <React.Suspense fallback={fallbackComponent}>
      {children}
    </React.Suspense>
  );
};

export default LoadingFallback;
