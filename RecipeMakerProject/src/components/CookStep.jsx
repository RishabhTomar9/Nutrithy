import React from 'react';
import { Card, CardHeader, CardContent, CardActions, Typography, Chip, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EmojiReactions from './EmojiReactions';

// Define the pulse animation for the tags
const pulseKeyframe = {
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.7 },
  },
};

/**
 * CookStep Component - Now a controlled component.
 * @param {object} props
 * @param {number} props.index - The step number.
 * @param {object} props.step - The step data { text, tags }.
 * @param {boolean} props.checked - The completion status of the step.
 * @param {Function} props.onToggle - Function to call when the check status is toggled.
 */
export default function CookStep({ index, step, checked, onToggle }) {
  return (
    <Card 
      elevation={checked ? 1 : 4}
      sx={{ 
        bgcolor: checked ? '#1A1C2C' : '#222439', 
        borderRadius: '12px',
        border: '1px solid',
        borderColor: checked ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'primary.main',
        }
      }}
    >
      <CardHeader
        title={
          <Typography variant="h6" component="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
            Step {index + 1}
          </Typography>
        }
        action={
          <Chip
            variant={checked ? 'filled' : 'outlined'}
            label={checked ? 'Completed' : 'Mark as Done'}
            onClick={onToggle}
            icon={checked ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
            color={checked ? 'success' : 'default'}
            sx={{
              color: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              '& .MuiChip-icon': {
                color: checked ? '#fff' : 'rgba(255, 255, 255, 0.5)',
              }
            }}
          />
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ 
        opacity: checked ? 0.5 : 1,
        transition: 'opacity 0.4s ease-in-out',
        }}>
        {/* Step Instructions */}
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            mt: 1,
            textDecoration: checked ? 'line-through' : 'none',
            textDecorationThickness: '2px',
          }}
        >
          {step.text}
        </Typography>

        {/* Tags */}
        <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {step.tags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              sx={{
                ...pulseKeyframe,
                bgcolor: 'primary.main',
                color: '#fff',
                fontWeight: '500',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          ))}
        </Box>
      </CardContent>
      
      {/* Emoji Reactions */}
      <CardActions sx={{ justifyContent: 'flex-start', px: 2, pt: 0 }}>
        <EmojiReactions stepId={index} />
      </CardActions>
    </Card>
  );
}