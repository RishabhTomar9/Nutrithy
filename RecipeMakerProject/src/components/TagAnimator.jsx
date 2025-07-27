import React from 'react';
import { Grow, Chip, Stack } from '@mui/material';
import { green, orange } from '@mui/material/colors';

export default function TagAnimator({ tags }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      justifyContent="center"
      alignItems="center"
    >
      {tags.map((tag, index) => (
        <Grow
          in
          key={tag}
          timeout={{
            enter: 400 + index * 100,
            exit: 200,
          }}
          style={{ transformOrigin: '0 0 0' }}
        >
          <Chip
            label={tag}
            sx={{
              color: 'white',
              borderRadius: '9999px',
              px: 2,
              py: 0.5,
              border: `2px solid ${green[800]}`,
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: `0 6px 12px rgba(0, 0, 0, 0.89)`,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
        </Grow>
      ))}
    </Stack>
  );
}
