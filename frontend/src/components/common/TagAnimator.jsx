import React, { useEffect, useRef } from 'react';
import { Chip, Stack, Box } from '@mui/material';
import { green, orange, blue, purple, red } from '@mui/material/colors';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

// Animation variants
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
      delay: i * 0.08,
    },
  }),
  hover: {
    scale: 1.1,
    rotate: [0, -5, 5, 0],
    transition: { rotate: { duration: 0.5 } },
  },
  tap: { scale: 0.95 },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

// Get a color based on tag text
const getTagColor = (tag) => {
  const colors = [green, blue, purple, orange, red];
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function TagAnimator({ tags }) {
  const containerRef = useRef(null);

  // GSAP entry animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        p: 2.5,
        borderRadius: 3,
        background: 'rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
        mx: 'auto',
        width: 'fit-content',
      }}
    >
      {/* Subtle animated background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-green-400/20 to-blue-500/20"
            style={{
              width: Math.random() * 80 + 60,
              height: Math.random() * 80 + 60,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </Box>

      {/* Tag list */}
      <Stack
        direction="row"
        spacing={1.2}
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        sx={{
          position: 'relative',
          zIndex: 1,
          p: 0.5,
          rowGap: 1.2,
        }}
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
                    color: '#fff',
                    borderRadius: '9999px',
                    px: 1,
                    py: 0.2,
                    background: `linear-gradient(135deg, ${tagColor[700]} 0%, ${tagColor[900]} 100%)`,
                    border: `1.5px solid ${tagColor[800]}`,
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    boxShadow: `0 4px 10px rgba(0,0,0,0.15)`,
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
