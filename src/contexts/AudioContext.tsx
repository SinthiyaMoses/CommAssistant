import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MicState, SupportedLanguageCode } from '../types';
import { getLanguageByCode } from '../services/languageService';
import { transcribeAudioAPI } from '../services/api';

interface AudioContextType {
  micState: MicState;
  setMicState: (state: MicState) => void;
  isRecording: boolean;
  startRecording: (langCode?: SupportedLanguageCode) => Promise<void>;
  stopRecording: () => void;
  audioFrequencyData: Uint8Array;
  errorMessage: string | null;
  speakText: (text: string, langCode: SupportedLanguageCode, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  onTranscriptReceived?: (transcript: string, isFinal: boolean) => void;
  setOnTranscriptReceived: (cb: (transcript: string, isFinal: boolean) => void) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechPitch: number;
  setSpeechPitch: (pitch: number) => void;
  transcribeAudioFile: (file: File | Blob, langHint?: string) => Promise<{ transcript: string; detectedLanguage: string; provider: string }>;
}

const AudioContextInstance = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [micState, setMicState] = useState<MicState>('IDLE');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioFrequencyData, setAudioFrequencyData] = useState<Uint8Array>(new Uint8Array(64));
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);

  const transcriptCallbackRef = useRef<((transcript: string, isFinal: boolean) => void) | null>(null);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Transcribe recorded audio with Whisper/Gemini STT
  const transcribeAudioFile = async (
    file: File | Blob,
    langHint?: string
  ): Promise<{ transcript: string; detectedLanguage: string; provider: string }> => {
    setMicState('PROCESSING');
    try {
      const result = await transcribeAudioAPI(file, langHint);
      setMicState('COMPLETE');
      return result;
    } catch (err: any) {
      setMicState('ERROR');
      setErrorMessage(err.message || 'Audio transcription failed');
      throw err;
    }
  };

  // Initialize Speech Recognition
  const initSpeechRecognition = useCallback((langCode?: SupportedLanguageCode) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported on this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    if (langCode) {
      const langInfo = getLanguageByCode(langCode);
      recognition.lang = langInfo.bcp47;
    } else {
      recognition.lang = 'en-US';
    }

    recognition.onstart = () => {
      setMicState('LISTENING');
      setIsRecording(true);
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (transcriptCallbackRef.current) {
        if (final.length > 0) {
          transcriptCallbackRef.current(final.trim(), true);
        } else if (interim.length > 0) {
          transcriptCallbackRef.current(interim.trim(), false);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      if (event.error !== 'no-speech') {
        setErrorMessage(`Audio input notice: ${event.error}. You can also type directly or upload audio.`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (micState === 'LISTENING') {
        setMicState('PROCESSING');
      }
    };

    return recognition;
  }, [micState]);

  // Start real-time audio visualization with Web Audio API & MediaRecorder
  const startVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // MediaRecorder to capture audio for Whisper/Gemini STT backup
      audioChunksRef.current = [];
      try {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(500);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('MediaRecorder init error:', recErr);
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateFrame = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioFrequencyData(new Uint8Array(dataArray));
        }
        animationFrameRef.current = requestAnimationFrame(updateFrame);
      };

      updateFrame();
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      setMicState('ERROR');
      setErrorMessage('Microphone access is required for voice input. Please enable permissions.');
    }
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAudioFrequencyData(new Uint8Array(64));
  };

  const startRecording = async (langCode?: SupportedLanguageCode) => {
    stopSpeaking();
    setErrorMessage(null);
    setMicState('LISTENING');

    await startVisualizer();

    try {
      const recognition = initSpeechRecognition(langCode);
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setIsRecording(true);
      }
    } catch (err) {
      console.warn('Recognition start exception:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    stopVisualizer();
    setIsRecording(false);
  };

  // Text-to-Speech Synthesis with Google TTS stream fallback
  const speakText = (text: string, langCode: SupportedLanguageCode, onEnd?: () => void) => {
    if (!text) return;

    stopSpeaking();
    setIsSpeaking(true);

    const langInfo = getLanguageByCode(langCode);

    // Try Web Speech API if supported
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(langCode) ||
          v.lang.replace('_', '-').toLowerCase() === langInfo.bcp47.toLowerCase()
      );

      // If matching voice exists or English
      if (matchingVoice || langCode === 'en' || !langInfo.indic) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langInfo.bcp47;
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        if (matchingVoice) utterance.voice = matchingVoice;

        utterance.onend = () => {
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };

        utterance.onerror = () => {
          // Failover to Google TTS audio proxy
          playGoogleTTS(text, langCode, onEnd);
        };

        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    // High quality natural Google TTS fallback for Indic languages
    playGoogleTTS(text, langCode, onEnd);
  };

  const playGoogleTTS = (text: string, langCode: string, onEnd?: () => void) => {
    try {
      const audioUrl = `/api/v1/tts?text=${encodeURIComponent(text.slice(0, 200))}&lang=${encodeURIComponent(
        langCode
      )}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = speechRate;
      fallbackAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      audio.play().catch(() => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      });
    } catch {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current.currentTime = 0;
      fallbackAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const setOnTranscriptReceived = (cb: (transcript: string, isFinal: boolean) => void) => {
    transcriptCallbackRef.current = cb;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopSpeaking();
    };
  }, []);

  return (
    <AudioContextInstance.Provider
      value={{
        micState,
        setMicState,
        isRecording,
        startRecording,
        stopRecording,
        audioFrequencyData,
        errorMessage,
        speakText,
        stopSpeaking,
        isSpeaking,
        onTranscriptReceived: transcriptCallbackRef.current || undefined,
        setOnTranscriptReceived,
        speechRate,
        setSpeechRate,
        speechPitch,
        setSpeechPitch,
        transcribeAudioFile,
      }}
    >
      {children}
    </AudioContextInstance.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContextInstance);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
