import React, { useState, useEffect } from 'react';
import CookStep from './CookStep';
import {
  Box, Typography, Grid, Paper, Divider, Checkbox, Button,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';

export default function CookModeView({ steps = [], description = '', ingredients = [], cookTime = 'Unknown' }) {
  const [checkedStates, setCheckedStates] = useState([]);
  const [ingredientChecked, setIngredientChecked] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Initialize state arrays when steps or ingredients change
  useEffect(() => {
    setCheckedStates(Array(steps.length).fill(false));
    setIngredientChecked(Array(ingredients.length).fill(false));
    setTimerActive(false);
    setSeconds(0);
  }, [steps, ingredients]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (timerActive) {
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleToggleStep = (index) => {
    setCheckedStates((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const handleToggleIngredient = (index) => {
    setIngredientChecked((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: '20px',
        background: 'linear-gradient(to bottom right, #161825, #1d1f31)',
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontWeight: 'bold',
          mb: 3,
          color: '#fff',
          textAlign: 'center',
          letterSpacing: 1,
          textShadow: '0 2px 12px #161825',
        }}
      >
        👨‍🍳 Cook Mode
      </Typography>

      {/* --- Timer --- */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 2, borderRadius: 3, py: 2, px: 3 }}>
        <Button
          variant={timerActive ? 'contained' : 'outlined'}
          color="success"
          startIcon={<TimerIcon />}
          onClick={() => setTimerActive((active) => !active)}
          sx={{
            fontWeight: 'bold',
            px: 3,
            py: 1.5,
            borderRadius: 2,
            color: '#fff',
            background: '#16a34a',
            border: 'none',
            boxShadow: timerActive ? '0 0 12px #16a34a' : 'none',
            '&:hover': { background: '#15803d' },
          }}
        >
          {timerActive ? 'Pause Cooking' : 'Start Cooking'}
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 2, minWidth: '90px' }}>
          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 'bold', letterSpacing: 1, mb: 0.5 }}>
            Timer
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textAlign: 'center',
              background: 'rgba(22,24,37,0.8)',
              px: 2,
              py: 1,
              borderRadius: 2,
              fontSize: '2rem',
              letterSpacing: 2,
            }}
          >
            {formatTime(seconds)}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="success"
          onClick={() => { setSeconds(0); setTimerActive(false); }}
          sx={{
            borderRadius: 2,
            color: '#16a34a',
            background: 'transparent',
            ml: 0.5,
            '&:hover': { background: '#16a34a', color: '#fff' },
          }}
        >
          Reset Timer
        </Button>
      </Box>

      {/* --- Recipe Info --- */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'rgba(30,41,59,0.22)', borderRadius: 3 }}>
        <Typography variant="body1" sx={{ color: '#fff', fontStyle: 'italic', textAlign: 'center', mb: 2, fontSize: '1.15rem' }}>
          {description}
        </Typography>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.12)', mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#fff', gap: 1 }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              <Typography sx={{ fontWeight: 'bold', mr: 1 }}>Total Cook Time:</Typography>
              <Typography>{cookTime}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={7}>
            <Typography sx={{ fontWeight: 'bold', color: '#fff', mb: 1, fontSize: '1.1rem' }}>
              Ingredients:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, bgcolor: 'rgba(56,189,248,0.04)', borderRadius: 2, px: 1, py: 1 }}>
              {ingredients.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', borderRadius: 2, px: 2, py: 1 }}>
                  <Checkbox
                    checked={ingredientChecked[index] || false}
                    onChange={() => handleToggleIngredient(index)}
                    sx={{
                      color: '#fff',
                      '&.Mui-checked': { color: '#1d1f31' },
                      mr: 1,
                    }}
                  />
                  <Typography
                    sx={{
                      color: '#fff',
                      textDecoration: ingredientChecked[index] ? 'line-through' : 'none',
                      fontWeight: ingredientChecked[index] ? 'bold' : 'normal',
                      fontSize: '1rem',
                    }}
                  >
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* --- Cooking Steps --- */}
      <Box
        sx={{
          maxHeight: '70vh',
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.05)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(56,189,248,0.18)', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(56,189,248,0.28)' },
        }}
      >
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', mb: 2, textAlign: 'center', letterSpacing: 1 }}>
          Instructions
        </Typography>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <CookStep
                index={index}
                step={step}
                checked={checkedStates[index] || false}
                onToggle={() => handleToggleStep(index)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}