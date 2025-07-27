import React, { useState } from 'react';
import { Stack, Badge, IconButton, Box } from '@mui/material';

// Define the keyframe animation for the floating emoji
const floatUpKeyframe = {
  '@keyframes floatUp': {
    '0%': {
      transform: 'translateY(0) scale(1)',
      opacity: 1,
    },
    '100%': {
      transform: 'translateY(-50px) scale(1.5)',
      opacity: 0,
    },
  },
};

export default function EmojiReactions() {
  const [counts, setCounts] = useState({ '👍': 0, '😄': 0, '😋': 0 });
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  // State to manage the floating animation
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  const handleReact = (emoji) => {
    const newCounts = { ...counts };
    let newSelected = selectedEmoji;

    // --- New Reversible Logic ---
    if (selectedEmoji === emoji) {
      // User is deselecting their reaction
      newCounts[emoji]--;
      newSelected = null;
    } else {
      // If user had a previous selection, undo it
      if (selectedEmoji) {
        newCounts[selectedEmoji]--;
      }
      // Add the new reaction
      newCounts[emoji]++;
      newSelected = emoji;

      // --- Trigger Floating Animation ---
      const newFloating = { id: Date.now(), emoji: emoji };
      setFloatingEmojis(prev => [...prev, newFloating]);
      // Remove the emoji from the animation state after the animation ends
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(f => f.id !== newFloating.id));
      }, 1000); // Must match animation duration
    }

    setCounts(newCounts);
    setSelectedEmoji(newSelected);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        p: 1,
        mt: 1,
        display: 'inline-block',
        borderRadius: '20px',
      }}
    >
      {/* Container for the floating emojis */}
      <Box sx={{ ...floatUpKeyframe, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
        {floatingEmojis.map(item => (
          <Box
            key={item.id}
            component="span"
            sx={{
              position: 'absolute',
              fontSize: '2rem',
              animation: 'floatUp 1s ease-out forwards',
            }}
          >
            {item.emoji}
          </Box>
        ))}
      </Box>
      
      {/* The actual reaction buttons */}
      <Stack direction="row" spacing={1}>
        {Object.keys(counts).map((emoji) => (
          <Badge
            key={emoji}
            badgeContent={counts[emoji]}
            color="primary"
            sx={{ '& .MuiBadge-badge': { color: '#fff' } }}
          >
            <IconButton
              onClick={() => handleReact(emoji)}
              aria-label={`react with ${emoji}`}
              sx={{
                fontSize: '1rem',
                transform: selectedEmoji === emoji ? 'scale(1.2)' : 'scale(1)',
                color: selectedEmoji === emoji ? 'primary.main' : 'rgba(255, 255, 255, 0.7)',
                transition: 'transform 0.2s ease, color 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.2)',
                  color: 'primary.light',
                },
              }}
            >
              {emoji}
            </IconButton>
          </Badge>
        ))}
      </Stack>
    </Box>
  );
}