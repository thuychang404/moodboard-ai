// frontend/src/components/SpeechInput.tsx

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useSpeechToText } from '../hooks/useSpeechRecognition';

interface SpeechInputProps {
  onTranscriptChange: (transcript: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export const SpeechInput: React.FC<SpeechInputProps> = ({
  onTranscriptChange,
  isDisabled = false,
  className = '',
}) => {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Update parent component when transcript changes
  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);

  // Auto-stop listening after 30 seconds
  useEffect(() => {
    if (isListening) {
      const timeout = setTimeout(() => {
        stopListening();
      }, 30000); // 30 seconds

      return () => clearTimeout(timeout);
    }
  }, [isListening, stopListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-gray-100/80 rounded-lg ${className}`}>
        <AlertCircle size={16} className="text-gray-400" />
        <span className="text-xs text-gray-500">Speech not supported</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Speech Status Indicator */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-red-100/90 backdrop-blur-sm px-3 py-1 rounded-full border border-red-200"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Volume2 size={14} className="text-red-600" />
          </motion.div>
          <span className="text-xs text-red-700 font-medium">Listening...</span>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-orange-100/90 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-200"
        >
          <AlertCircle size={14} className="text-orange-600" />
          <span className="text-xs text-orange-700">Speech error</span>
        </motion.div>
      )}

      {/* Main Speech Button */}
      <motion.button
        onClick={handleToggleListening}
        disabled={isDisabled}
        className={`relative p-3 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
            : 'bg-white/70 hover:bg-white/90 text-gray-600 hover:text-gray-800 shadow-md hover:shadow-lg'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
        whileHover={!isDisabled ? { scale: 1.05 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
      >
        {isListening ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
        
        {/* Recording indicator ring */}
        {isListening && (
          <motion.div
            className="absolute inset-0 border-2 border-red-300 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Clear Transcript Button */}
      {transcript && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={resetTranscript}
          className="p-2 bg-gray-200/80 hover:bg-gray-300/80 text-gray-600 hover:text-gray-800 rounded-lg transition-all duration-300"
          title="Clear transcript"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-xs font-medium">Clear transcript</span>
        </motion.button>
      )}
    </div>
  );
};