import { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import toast from 'react-hot-toast';
import { Button, Box, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { styled, keyframes } from '@mui/material/styles';


const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

const SpeakButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#4caf50',
  color: '#fff',
  padding: '10px 20px',
  animation: `${pulse} 1.5s infinite`,
  '&:hover': {
    backgroundColor: '#43a047'
  }
}));

const StopButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#f44336',
  color: '#fff',
  padding: '10px 20px',
  '&:hover': {
    backgroundColor: '#e53935'
  }
}));

export default function VoiceInput({ onVoiceAdd }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (!listening && transcript.trim()) {
      onVoiceAdd(transcript.trim());
      toast.success('Task added from voice 🎤');
      resetTranscript();
    }
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <Box sx={{ border: '1px solid red', borderRadius: 2, p: 2, backgroundColor: '#2a0000', color: '#ffcccc' }}>
        <Typography variant="body1">Your browser does not support speech recognition.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ boxShadow:10, borderRadius: 2, p: 3, background: 'linear-gradient(to bottom right, #161825, #1d1f31)', color: 'white' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>🎤 Voice-Controlled Task Input</Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        {!listening ? (
          <SpeakButton
            variant="contained"
            startIcon={<MicIcon />}
            onClick={() => SpeechRecognition.startListening({ continuous: false })}
          >
            Speak
          </SpeakButton>
        ) : (
          <StopButton
            variant="contained"
            startIcon={<StopIcon />}
            onClick={() => SpeechRecognition.stopListening()}
          >
            Stop
          </StopButton>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          backgroundColor: '#1a1c2e',
          border: '1px solid #555',
          borderRadius: 1,
          fontFamily: 'monospace',
          minHeight: '4rem'
        }}
      >
        {transcript || <span style={{ color: '#aaa' }}>Say something…</span>}
      </Box>

      {listening && (
        <Typography variant="body2" sx={{ color: 'lightgreen', mt: 2, fontStyle: 'italic' }}>
          🎧 Listening...
        </Typography>
      )}
    </Box>
  );
}
