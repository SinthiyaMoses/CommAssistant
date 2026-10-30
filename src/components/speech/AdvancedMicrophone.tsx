import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Volume2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { LiveAudioVisualizer } from './LiveAudioVisualizer';
import { MicState } from '../../types';

export const AdvancedMicrophone: React.FC = () => {
  const { micState, isRecording, startRecording, stopRecording, setOnTranscriptReceived, errorMessage } = useAudio();
  const { detectedSourceLanguageInfo } = useLanguage();
  const { performTranslation, setInterimTranscript } = useTranslation();
  const [recordSeconds, setRecordSeconds] = useState<number>(0);

  // Recording timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      setRecordSeconds(0);
      timer = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Hook transcript received from audio context
  useEffect(() => {
    setOnTranscriptReceived((transcript: string, isFinal: boolean) => {
      if (isFinal) {
        // Automatically dispatch translation upon final speech segment
        stopRecording();
        performTranslation(transcript, 'voice');
      } else {
        setInterimTranscript(transcript);
      }
    });
  }, [setOnTranscriptReceived, stopRecording, performTranslation, setInterimTranscript]);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateDetails = (state: MicState) => {
    switch (state) {
      case 'LISTENING':
        return {
          label: 'Listening & Detecting Speech...',
          subtext: 'Speak in Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, or English',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          icon: <Mic className="animate-pulse" size={44} />,
        };
      case 'PROCESSING':
        return {
          label: 'Processing Audio Stream...',
          subtext: 'Extracting multilingual acoustics & phonemes',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
          icon: <Loader2 className="animate-spin" size={42} />,
        };
      case 'LANGUAGE_DETECTED':
        return {
          label: `Source Detected: ${detectedSourceLanguageInfo?.name || 'Indic'}`,
          subtext: 'Translating with context preservation...',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
          icon: <Sparkles className="animate-bounce" size={42} />,
        };
      case 'TRANSLATING':
        return {
          label: 'Neural Translation in Progress...',
          subtext: 'Preserving semantic idioms and emotional nuance',
          badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-400/40',
          icon: <Loader2 className="animate-spin text-violet-400" size={42} />,
        };
      case 'GENERATING_VOICE':
        return {
          label: 'Synthesizing Target Speech...',
          subtext: 'Generating natural neural audio output',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          icon: <Volume2 className="animate-pulse text-emerald-400" size={42} />,
        };
      case 'COMPLETE':
        return {
          label: 'Translation Complete',
          subtext: 'Tap mic or press Space to speak again',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          icon: <CheckCircle2 size={42} className="text-emerald-400" />,
        };
      case 'ERROR':
        return {
          label: 'Speech Recognition Notice',
          subtext: errorMessage || 'Microphone error or permission denied. You can also type text directly.',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          icon: <AlertTriangle size={42} className="text-rose-400" />,
        };
      default:
        return {
          label: 'Ready to Translate',
          subtext: 'Tap the microphone or press Spacebar to begin speaking',
          badgeColor: 'bg-slate-800/80 text-slate-300 border-white/10',
          icon: <Mic size={42} />,
        };
    }
  };

  const stateInfo = getStateDetails(micState);

  return (
    <div className="mic-hero-wrapper" role="region" aria-label="Speech Input Controller">
      {/* Visual Pulsing Rings */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <div className="mic-pulse-ring mic-pulse-ring-1" />
            <div className="mic-pulse-ring mic-pulse-ring-2" />
            <div className="mic-pulse-ring mic-pulse-ring-3" />
          </>
        )}

        {/* Central Hero Button */}
        <button
          type="button"
          id="hero-microphone-button"
          onClick={handleMicClick}
          aria-label={isRecording ? 'Stop Recording' : 'Start Speaking'}
          aria-pressed={isRecording}
          className={`mic-hero-button ${isRecording ? 'listening' : ''} ${
            micState === 'TRANSLATING' || micState === 'PROCESSING' ? 'processing' : ''
          }`}
          style={{
            cursor: 'pointer',
          }}
        >
          {isRecording ? <MicOff size={42} /> : stateInfo.icon}
        </button>
      </div>

      {/* Recording Duration Timer Pill */}
      {isRecording && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-900/90 px-3.5 py-1 font-mono text-sm font-bold text-cyan-300 shadow-lg backdrop-blur-md animate-pulse">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>REC {formatTimer(recordSeconds)}</span>
        </div>
      )}

      {/* State Status Text */}
      <div className="mt-3 flex flex-col items-center text-center px-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider ${stateInfo.badgeColor} shadow-sm`}
        >
          {stateInfo.label}
        </span>
        <p className="mt-1 text-xs text-slate-400 max-w-sm">{stateInfo.subtext}</p>
      </div>

      {/* 60fps Live Audio Visualizer */}
      <LiveAudioVisualizer isActive={isRecording} />
    </div>
  );
};
