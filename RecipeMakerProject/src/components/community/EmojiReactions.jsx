import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaSmile, FaThumbsUp, FaStar } from 'react-icons/fa';

// Floating animation variants with rotation + scale
const floatVariants = {
  initial: { y: 0, scale: 1, opacity: 1, rotate: 0 },
  animate: (delay = 0) => ({
    y: -100 - Math.random() * 50,
    x: (Math.random() - 0.5) * 80,
    scale: 0.8 + Math.random() * 0.7,
    rotate: Math.random() * 360,
    opacity: 0,
    transition: { duration: 1.4, ease: 'easeOut', delay }
  })
};

export default function EmojiReactions() {
  const [counts, setCounts] = useState({ '👍': 0, '❤️': 0, '😄': 0, '🌟': 0, '😋': 0 });
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const containerRef = useRef(null);

  const emojiIcons = {
    '👍': <FaThumbsUp />,
    '❤️': <FaHeart />,
    '😄': <FaSmile />,
    '🌟': <FaStar />,
    '😋': '😋'
  };

  // Simple entrance animation using Framer Motion

  const handleReact = (emoji) => {
    const newCounts = { ...counts };
    let newSelected = selectedEmoji;

    if (selectedEmoji === emoji) {
      newCounts[emoji]--;
      newSelected = null;

      // Simple shake animation using CSS
    } else {
      if (selectedEmoji) newCounts[selectedEmoji]--;
      newCounts[emoji]++;
      newSelected = emoji;

      // Spawn multiple floating emojis with randomness
      for (let i = 0; i < 3; i++) {
        const newFloating = {
          id: Date.now() + i,
          emoji,
          delay: i * 0.15
        };
        setFloatingEmojis(prev => [...prev, newFloating]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(f => f.id !== newFloating.id));
        }, 1600);
      }

      // Simple scale animation
    }

    setCounts(newCounts);
    setSelectedEmoji(newSelected);
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative p-5 mt-4 inline-block rounded-2xl bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-md border border-gray-700/30 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-3 text-gray-300 text-sm font-medium">Rate this recipe</div>

      {/* Floating emojis */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        <AnimatePresence>
          {floatingEmojis.map(item => (
            <motion.div
              key={item.id}
              className="absolute left-1/2 top-0 text-3xl"
              custom={item.delay}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0 }}
              variants={floatVariants}
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction buttons */}
      <div className="flex justify-center gap-4">
        {Object.keys(counts).map((emoji) => (
          <motion.div
            key={emoji}
            className="relative group"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="relative">
              {counts[emoji] > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {counts[emoji]}
                </div>
              )}
              <motion.button
                onClick={() => handleReact(emoji)}
                aria-label={`react with ${emoji}`}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border transition-all duration-300 ${
                  selectedEmoji === emoji
                    ? 'bg-gradient-to-r from-blue-500/40 to-purple-500/40 border-blue-400 text-blue-200'
                    : 'bg-gray-800/40 border-gray-600 text-gray-300'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {emojiIcons[emoji]}
              </motion.button>
            </div>

            {/* Tooltip bubble */}
            <motion.div
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-md text-xs text-white bg-gray-700/90 opacity-0 group-hover:opacity-100 group-hover:translate-y-[-2px] transition-all duration-200"
            >
              {emoji === '👍' ? 'Like' :
               emoji === '❤️' ? 'Love' :
               emoji === '😄' ? 'Smile' :
               emoji === '🌟' ? 'Star' : 'Yummy'}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
