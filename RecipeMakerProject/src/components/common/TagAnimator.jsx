import React, { useEffect, useRef } from 'react';
import { Chip, Stack, Box } from '@mui/material';
import { green, orange, blue, purple, red } from '@mui/material/colors';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

// Animation variants for tags
const tagVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      delay: i * 0.1,
    },
  }),
  hover: {
    scale: 1.1,
    rotate: [0, -5, 5, 0],
    transition: {
      rotate: {
        repeat: 0,
        duration: 0.5,
      },
    },
  },
  tap: { scale: 0.95 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

// Get a color based on tag content
const getTagColor = (tag) => {
  const colors = [green, blue, purple, orange, red];
  // Simple hash function to determine color
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  return colors[colorIndex];
};

export default function TagAnimator({ tags }) {
  const containerRef = useRef(null);
  
  // GSAP animation for the container
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: 'power3.out'
        }
      );
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        padding: 2,
        borderRadius: 4,
        background: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0 }}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-green-400/20 to-blue-500/20 py-15"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              zIndex: 0,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </Box>
      
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <AnimatePresence>
          {tags.map((tag, index) => {
            const tagColor = getTagColor(tag);
            
            return (
              <motion.div
                key={tag}
                custom={index}
                variants={tagVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
                layout
              >
                <Chip
                  label={tag}
                  sx={{
                    color: 'white',
                    borderRadius: '9999px',
                    px: 2,
                    py: 0.5,
                    background: `linear-gradient(135deg, ${tagColor[700]} 0%, ${tagColor[900]} 100%)`,
                    border: `2px solid ${tagColor[800]}`,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: `0 6px 12px rgba(0, 0, 0, 0.2)`,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}
