import { useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mic, Square, Volume2 } from 'lucide-react';
import { gsap } from 'gsap';

export default function VoiceInput({ onVoiceAdd }) {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const audioWaveRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!listening && transcript.trim()) {
      onVoiceAdd(transcript.trim());
      toast.success('Task added from voice 🎤');
      resetTranscript();
    }
  }, [listening]);

  useEffect(() => {
    if (listening && audioWaveRef.current) {
      gsap.to(audioWaveRef.current.children, {
        scaleY: () => 0.5 + Math.random() * 1.5,
        duration: 0.2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: { each: 0.1, from: "center" }
      });
    }

    if (containerRef.current) {
      gsap.fromTo(containerRef.current, { y: 30 }, { y: 0, duration: 0.5, ease: "power2.out" });
    }

    return () => {
      gsap.killTweensOf(audioWaveRef.current?.children);
    };
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 rounded-lg border border-red-500 bg-red-900 text-red-200">
        Your browser does not support speech recognition.
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl shadow-xl text-white flex flex-col gap-4 border border-gray-700 backdrop-blur-sm w-full mx-auto"
    >
      <h2 className="text-lg md:text-xl font-bold flex flex-wrap items-center gap-2 justify-center md:justify-start">
        <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Voice-Controlled</span>
        <span className="relative">
          <Mic size={24} className="text-green-400 animate-pulse" />
        </span>
        <span>Task Input</span>
      </h2>

      {/* Unified Button + Transcript Box */}
      <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
        <div className="flex-1 min-w-0 relative">
          <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-lg p-4 font-mono min-h-[3rem] text-gray-300 shadow-inner flex items-center gap-2 overflow-hidden">
            {/* Transcript or placeholder */}
            {transcript ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 flex-1 truncate"
              >
                {transcript}
              </motion.p>
            ) : (
              <span className="text-gray-500 italic flex items-center gap-2 flex-1 truncate">
                <Volume2 size={16} className="text-gray-500" />
                Say something…
              </span>
            )}

            {/* Action button inside the box */}
            <div className="flex-shrink-0">
              {!listening ? (
                <motion.button
                  onClick={() => SpeechRecognition.startListening({ continuous: false })}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 text-sm md:text-base"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Mic size={18} className="animate-pulse text-black" />
                  Speak
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => SpeechRecognition.stopListening()}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 text-sm md:text-base"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Square size={18} className='text-black bg-black mr-2'/>
                  Stop
                </motion.button>
              )}
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 pointer-events-none rounded-lg"></div>
          </div>
        </div>
      </div>

      {listening && (
        <div className="flex flex-col items-center mt-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-400 font-medium flex items-center gap-2"
          >
            <span className="relative inline-flex">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Listening...
          </motion.div>

          {/* Audio wave */}
          <div ref={audioWaveRef} className="flex items-center justify-center gap-[2px] h-8 mt-4">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="w-1 h-6 bg-gradient-to-t from-green-500 to-blue-400 rounded-full"
                style={{ transformOrigin: 'bottom' }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
