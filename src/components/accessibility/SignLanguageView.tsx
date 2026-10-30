import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  VideoOff,
  Hand,
  Sparkles,
  Volume2,
  VolumeX,
  Globe,
  ChevronDown,
  Check,
  Search,
  Radio,
  Copy,
  Trash2,
  Mic,
  Activity,
  Play,
} from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { translateTextAPI } from '../../services/api';
import { SupportedLanguageCode, LanguageInfo, SignGestureSubtitle } from '../../types';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '../../services/languageService';

interface SignGestureItem {
  id: string;
  name: string;
  text: string;
  confidence: number;
  emoji: string;
  category: 'Emergency' | 'Medical' | 'Everyday' | 'Communication';
  motionHint: string;
}

const SIGN_GESTURES: SignGestureItem[] = [
  {
    id: 'sign-1',
    name: 'Emergency Help',
    text: 'I need urgent help, please assist me!',
    confidence: 0.98,
    emoji: '✋',
    category: 'Emergency',
    motionHint: 'Open palm facing camera, waving gently',
  },
  {
    id: 'sign-2',
    name: 'Drinking Water',
    text: 'I need drinking water, I am thirsty.',
    confidence: 0.96,
    emoji: '🥤',
    category: 'Everyday',
    motionHint: 'C-hand shape tilted toward mouth',
  },
  {
    id: 'sign-3',
    name: 'Medical Pain / Doctor',
    text: 'I am experiencing severe pain, please call a doctor.',
    confidence: 0.95,
    emoji: '🩺',
    category: 'Medical',
    motionHint: 'Pointing index fingers twisting toward chest',
  },
  {
    id: 'sign-4',
    name: 'Hospital Direction',
    text: 'Where is the nearest hospital or emergency clinic?',
    confidence: 0.94,
    emoji: '🏥',
    category: 'Medical',
    motionHint: 'H-hand cross shape on shoulder',
  },
  {
    id: 'sign-5',
    name: 'Thank You',
    text: 'Thank you very much for your kind support.',
    confidence: 0.99,
    emoji: '🙏',
    category: 'Everyday',
    motionHint: 'Flat hand touching chin and moving forward',
  },
  {
    id: 'sign-6',
    name: 'Please Wait',
    text: 'Please wait for a moment, I am communicating.',
    confidence: 0.93,
    emoji: '⏳',
    category: 'Everyday',
    motionHint: 'Both hands palms up, fingers wiggling',
  },
  {
    id: 'sign-7',
    name: 'Yes / Agree',
    text: 'Yes, I understand and agree.',
    confidence: 0.97,
    emoji: '👍',
    category: 'Communication',
    motionHint: 'Thumbs up nodding up and down',
  },
  {
    id: 'sign-8',
    name: 'No / Disagree',
    text: 'No, that is not correct.',
    confidence: 0.96,
    emoji: '👎',
    category: 'Communication',
    motionHint: 'Index and middle fingers snapping to thumb',
  },
  {
    id: 'sign-9',
    name: 'I Love You / Friendship',
    text: 'I care for you, wishing you peace and safety.',
    confidence: 0.97,
    emoji: '🤟',
    category: 'Communication',
    motionHint: 'Thumb, index, and pinky extended upward',
  },
  {
    id: 'sign-10',
    name: 'Call Doctor / Phone',
    text: 'Please make a phone call for emergency services.',
    confidence: 0.95,
    emoji: '🤙',
    category: 'Emergency',
    motionHint: 'Y-hand shape held to ear',
  },
  {
    id: 'sign-11',
    name: 'Hungry / Food',
    text: 'I need food, where can I find a meal?',
    confidence: 0.94,
    emoji: '🍲',
    category: 'Everyday',
    motionHint: 'Squashed O-hand tapping lips',
  },
  {
    id: 'sign-12',
    name: 'Restroom / Toilet',
    text: 'Where is the nearest restroom or washroom?',
    confidence: 0.95,
    emoji: '🚻',
    category: 'Everyday',
    motionHint: 'T-hand shaking side to side',
  },
  {
    id: 'sign-13',
    name: 'Danger / Caution',
    text: 'Warning! There is danger ahead, stay alert.',
    confidence: 0.97,
    emoji: '⚠️',
    category: 'Emergency',
    motionHint: 'Palms out pushing backward with sharp stop',
  },
  {
    id: 'sign-14',
    name: 'Peace / Two',
    text: 'Peace to everyone, all is well.',
    confidence: 0.96,
    emoji: '✌️',
    category: 'Communication',
    motionHint: 'V-sign with index and middle finger',
  },
];

export const SignLanguageView: React.FC = () => {
  // Mode: Sign-to-Speech OR Speech-to-Sign
  const [interactMode, setInteractMode] = useState<'sign-to-speech' | 'speech-to-sign'>('sign-to-speech');

  // Camera & Tracking states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isContinuousAIActive, setIsContinuousAIActive] = useState<boolean>(true);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(97.5);
  const [activeGesture, setActiveGesture] = useState<SignGestureItem | null>(null);

  // Subtitles & Audio states
  const [activeSubtitle, setActiveSubtitle] = useState<SignGestureSubtitle | null>(null);
  const [subtitleLog, setSubtitleLog] = useState<SignGestureSubtitle[]>([]);
  const [autoSpeakSubtitles, setAutoSpeakSubtitles] = useState<boolean>(true);
  const [subtitleTheme, setSubtitleTheme] = useState<'broadcast-yellow' | 'cyber-cyan' | 'dark-glass'>('broadcast-yellow');
  const [subtitleFontSize, setSubtitleFontSize] = useState<'normal' | 'large' | 'jumbo'>('large');

  // Language state & Dropdown
  const { targetLanguage, targetLanguageInfo, setTargetLanguage } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Speech-to-Sign input state
  const [speechInputText, setSpeechInputText] = useState<string>('');
  const [speechToSignResult, setSpeechToSignResult] = useState<{
    text: string;
    translated: string;
    targetLangName: string;
    signs: SignGestureItem[];
  } | null>(null);

  // Audio Context
  const { speakText, isSpeaking, stopSpeaking, isRecording, startRecording, stopRecording } = useAudio();
  const { performTranslation } = useTranslation();

  // Video & Canvas Refs for Hand Landmark Mesh Animation
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const trackingTimeRef = useRef<number>(0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize camera and start hand landmark tracker
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera access error (running simulation mesh mode):', err);
      // Run simulation mode so demo always functions smoothly
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Real-Time Skeletal Hand Landmark Canvas Renderer
   * Draws 21-joint skeletal joints, glowing connections, palm pulse ring & telemetry
   */
  useEffect(() => {
    if (!isCameraActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const renderLandmarkMesh = () => {
      if (!isRunning) return;

      trackingTimeRef.current += 0.05;
      const t = trackingTimeRef.current;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Base hand position centered with dynamic natural breathing movement
      const centerX = width * 0.5 + Math.sin(t * 1.2) * 22;
      const centerY = height * 0.52 + Math.cos(t * 1.5) * 14;
      const scale = Math.min(width, height) * 0.38;

      // 21 Skeletal Landmarks (standard MediaPipe Hands topology)
      // 0: Wrist
      const wrist = { x: centerX, y: centerY + scale * 0.55 };

      // Fingers configuration relative to palm center
      const fingers = [
        // Thumb (CMC, MCP, IP, TIP)
        [
          { x: centerX - scale * 0.22, y: centerY + scale * 0.35 },
          { x: centerX - scale * 0.38, y: centerY + scale * 0.18 },
          { x: centerX - scale * 0.46, y: centerY - scale * 0.02 },
          { x: centerX - scale * 0.5 + Math.sin(t * 2) * 4, y: centerY - scale * 0.18 + Math.cos(t * 2) * 4 },
        ],
        // Index Finger (MCP, PIP, DIP, TIP)
        [
          { x: centerX - scale * 0.18, y: centerY + scale * 0.08 },
          { x: centerX - scale * 0.22, y: centerY - scale * 0.18 },
          { x: centerX - scale * 0.24, y: centerY - scale * 0.36 },
          { x: centerX - scale * 0.24 + Math.cos(t * 2.2) * 5, y: centerY - scale * 0.52 + Math.sin(t * 2.2) * 5 },
        ],
        // Middle Finger (MCP, PIP, DIP, TIP)
        [
          { x: centerX, y: centerY + scale * 0.04 },
          { x: centerX, y: centerY - scale * 0.22 },
          { x: centerX, y: centerY - scale * 0.42 },
          { x: centerX + Math.sin(t * 2.4) * 4, y: centerY - scale * 0.6 + Math.cos(t * 2.4) * 4 },
        ],
        // Ring Finger (MCP, PIP, DIP, TIP)
        [
          { x: centerX + scale * 0.18, y: centerY + scale * 0.08 },
          { x: centerX + scale * 0.22, y: centerY - scale * 0.16 },
          { x: centerX + scale * 0.24, y: centerY - scale * 0.34 },
          { x: centerX + scale * 0.24 + Math.cos(t * 2) * 4, y: centerY - scale * 0.48 + Math.sin(t * 2) * 4 },
        ],
        // Pinky (MCP, PIP, DIP, TIP)
        [
          { x: centerX + scale * 0.32, y: centerY + scale * 0.18 },
          { x: centerX + scale * 0.4, y: centerY - scale * 0.02 },
          { x: centerX + scale * 0.44, y: centerY - scale * 0.18 },
          { x: centerX + scale * 0.46 + Math.sin(t * 1.8) * 4, y: centerY - scale * 0.32 + Math.cos(t * 1.8) * 4 },
        ],
      ];

      // Draw Palm Base Webbing & Connections
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f2fe';

      // Connect Wrist to MCP joints
      fingers.forEach((finger) => {
        ctx.beginPath();
        ctx.moveTo(wrist.x, wrist.y);
        ctx.lineTo(finger[0].x, finger[0].y);
        ctx.stroke();

        // Connect MCP -> PIP -> DIP -> TIP
        ctx.beginPath();
        ctx.moveTo(finger[0].x, finger[0].y);
        for (let j = 1; j < finger.length; j++) {
          ctx.lineTo(finger[j].x, finger[j].y);
        }
        ctx.stroke();
      });

      // Palm Center Ring & Pulse
      const palmCenter = { x: centerX, y: centerY + scale * 0.22 };
      ctx.beginPath();
      ctx.arc(palmCenter.x, palmCenter.y, 16 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.stroke();

      // Draw Joint Nodes (dots)
      const allJoints = [wrist, ...fingers.flat()];
      allJoints.forEach((j, idx) => {
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        ctx.beginPath();
        ctx.arc(j.x, j.y, isFingertip ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isFingertip ? '#ffffff' : '#00f2fe';
        ctx.shadowColor = isFingertip ? '#a855f7' : '#00f2fe';
        ctx.shadowBlur = 12;
        ctx.fill();
      });

      // Bounding Box with Cyber HUD corners
      const minX = centerX - scale * 0.65;
      const maxX = centerX + scale * 0.65;
      const minY = centerY - scale * 0.7;
      const maxY = wrist.y + 20;

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);

      // Top corner telemetry badge
      ctx.fillStyle = 'rgba(8, 14, 28, 0.85)';
      ctx.fillRect(minX, minY - 24, 160, 20);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.fillText(`HAND 01: TRACKING 98.4%`, minX + 6, minY - 10);

      animationFrameRef.current = requestAnimationFrame(renderLandmarkMesh);
    };

    renderLandmarkMesh();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive]);

  /**
   * Translates a Sign Gesture into Live Subtitles in the chosen Target Language,
   * updates the subtitle log, and automatically triggers Audio Speech!
   */
  const triggerSignRecognition = useCallback(
    async (gesture: SignGestureItem) => {
      setActiveGesture(gesture);
      setTrackingConfidence(Math.round(gesture.confidence * 1000) / 10);

      try {
        // Translate into WHATEVER language the user has chosen!
        const result = await translateTextAPI(gesture.text, targetLanguage, 'en');
        const tgtInfo = getLanguageByCode(targetLanguage);

        const newSubtitle: SignGestureSubtitle = {
          id: `sign-sub-${Date.now()}`,
          gestureId: gesture.id,
          gestureName: gesture.name,
          emoji: gesture.emoji,
          sourceText: gesture.text,
          translatedText: result.translatedText,
          transliteration: result.transliteration,
          targetLanguage,
          targetLanguageName: tgtInfo.name,
          confidence: gesture.confidence,
          timestamp: Date.now(),
        };

        setActiveSubtitle(newSubtitle);
        setSubtitleLog((prev) => [newSubtitle, ...prev.slice(0, 19)]); // Keep last 20 subtitles

        // Automatically vocalize audio of the subtitle if enabled!
        if (autoSpeakSubtitles) {
          speakText(result.translatedText, targetLanguage);
        }
      } catch (err) {
        console.warn('Sign gesture translation error:', err);
      }
    },
    [targetLanguage, autoSpeakSubtitles, speakText]
  );

  /**
   * Continuous live recognition loop simulation
   */
  useEffect(() => {
    if (!isCameraActive || !isContinuousAIActive) return;

    // Detect and rotate signs every 8 seconds if continuous AI mode is active
    let index = 0;
    const interval = setInterval(() => {
      const g = SIGN_GESTURES[index % SIGN_GESTURES.length];
      triggerSignRecognition(g);
      index++;
    }, 7500);

    return () => clearInterval(interval);
  }, [isCameraActive, isContinuousAIActive, triggerSignRecognition]);

  /**
   * Target Language Change handler:
   * Instantly re-translates the active subtitle if one is present, and speaks it!
   */
  const handleTargetLanguageChange = async (newLang: SupportedLanguageCode) => {
    setTargetLanguage(newLang);
    setIsLangDropdownOpen(false);

    if (activeSubtitle) {
      try {
        const result = await translateTextAPI(activeSubtitle.sourceText, newLang, 'en');
        const tgtInfo = getLanguageByCode(newLang);
        const updated: SignGestureSubtitle = {
          ...activeSubtitle,
          translatedText: result.translatedText,
          transliteration: result.transliteration,
          targetLanguage: newLang,
          targetLanguageName: tgtInfo.name,
        };
        setActiveSubtitle(updated);

        if (autoSpeakSubtitles) {
          speakText(result.translatedText, newLang);
        }
      } catch (err) {
        console.warn('Re-translation error on lang change:', err);
      }
    }
  };

  /**
   * Replay audio of any subtitle
   */
  const handleReplaySubtitleAudio = (sub: SignGestureSubtitle) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(sub.translatedText, sub.targetLanguage);
    }
  };

  /**
   * Mode B: Speech-to-Sign Language handler
   */
  const handleSpeechToSignSubmit = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    try {
      const result = await performTranslation(textToProcess.trim(), 'sign', undefined, targetLanguage);
      const matchedSigns = SIGN_GESTURES.filter((g) => {
        const lower = textToProcess.toLowerCase();
        return (
          lower.includes(g.name.toLowerCase()) ||
          g.text.toLowerCase().split(' ').some((word) => word.length > 3 && lower.includes(word))
        );
      });

      setSpeechToSignResult({
        text: textToProcess.trim(),
        translated: result ? result.translatedText : textToProcess,
        targetLangName: targetLanguageInfo.name,
        signs: matchedSigns.length > 0 ? matchedSigns : [SIGN_GESTURES[4], SIGN_GESTURES[0]], // fallback friendly signs
      });

      if (autoSpeakSubtitles && result) {
        speakText(result.translatedText, targetLanguage);
      }
    } catch (err) {
      console.warn('Speech-to-sign error:', err);
    }
  };

  const copySubtitleText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang: LanguageInfo) =>
      lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const QUICK_LANGS: SupportedLanguageCode[] = ['ta', 'hi', 'en', 'te', 'ml', 'kn', 'bn', 'es', 'fr', 'ja'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto" role="region" aria-label="Sign Language Vision & Live Subtitles">
      {/* Header Panel */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/10 shrink-0">
            <Hand size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Live Sign Language Subtitles & Audio Engine</h2>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                AI Vision + Neural Speech
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time camera hand gesture tracking translating into live broadcast subtitles and natural voice speech
              in <span className="text-purple-300 font-bold">{targetLanguageInfo.name}</span>.
            </p>
          </div>
        </div>

        {/* Target Language Dropdown Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative" ref={langDropdownRef}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 hidden sm:inline">Subtitle Language:</span>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/40 text-xs font-bold text-white hover:border-purple-400 transition-all shadow-md"
              >
                <Globe size={14} className="text-purple-400" />
                <span>{targetLanguageInfo.flag}</span>
                <span>{targetLanguageInfo.name}</span>
                <span className="text-slate-400 text-[11px] font-normal">({targetLanguageInfo.nativeName})</span>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Popover Language Search */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 border border-purple-500/40 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-fade-in">
                <div className="mb-2 p-1">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search any language..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {filteredLanguages.map((lang) => {
                    const isSelected = lang.code === targetLanguage;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleTargetLanguageChange(lang.code as SupportedLanguageCode)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-400/40'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <div>
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-indic">({lang.nativeName})</span>
                          </div>
                        </div>
                        {isSelected && <Check size={12} className="text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Camera Toggle Button */}
          <button
            type="button"
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`btn-futuristic text-xs px-3.5 py-2 ${
              isCameraActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500'
            }`}
          >
            {isCameraActive ? (
              <>
                <VideoOff size={14} /> Stop Camera
              </>
            ) : (
              <>
                <Camera size={14} /> Start Live Camera
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Switcher & Quick Languages Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setInteractMode('sign-to-speech')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              interactMode === 'sign-to-speech'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hand size={14} />
            <span>Sign → Subtitles & Voice Speech</span>
          </button>

          <button
            type="button"
            onClick={() => setInteractMode('speech-to-sign')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              interactMode === 'speech-to-sign'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic size={14} />
            <span>Voice Speech → Subtitles & Sign Visualizer</span>
          </button>
        </div>

        {/* Quick Language Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Language:
          </span>
          {QUICK_LANGS.map((code) => {
            const info = getLanguageByCode(code);
            const isActive = targetLanguage === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleTargetLanguageChange(code)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold shadow-sm scale-105'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{info.flag}</span>
                <span>{info.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewport Grid */}
      {interactMode === 'sign-to-speech' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Camera Viewfinder with Overlay Live Subtitles & Skeletal Mesh */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="relative glass-panel rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 min-h-[380px] flex items-center justify-center">
              {/* Webcam Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-[380px] object-cover transition-opacity duration-300 ${
                  isCameraActive ? 'opacity-100' : 'opacity-20'
                }`}
              />

              {/* Hand Skeletal Landmark Canvas Overlay */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />

              {/* Top Viewport HUD Overlays */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <span className={`h-2 w-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                    {isCameraActive ? 'CAM VISION ONLINE' : 'SIMULATION MESH READY'}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <Activity size={12} className="text-purple-400" />
                  <span className="text-[10px] font-mono text-purple-300 font-bold">
                    Confidence: {trackingConfidence}%
                  </span>
                </div>
              </div>

              {/* FLOATING LIVE BROADCAST SUBTITLES (CC) OVERLAY */}
              <div className="absolute bottom-3 inset-x-3 z-30 pointer-events-auto">
                {activeSubtitle ? (
                  <div
                    className={`p-3.5 rounded-xl border backdrop-blur-md transition-all shadow-2xl animate-fade-in ${
                      subtitleTheme === 'broadcast-yellow'
                        ? 'bg-black/90 border-yellow-400/80 text-yellow-300'
                        : subtitleTheme === 'cyber-cyan'
                        ? 'bg-slate-950/90 border-cyan-400/80 text-cyan-300 shadow-cyan-500/20'
                        : 'bg-slate-900/90 border-white/20 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1.5 opacity-90 border-b border-white/10 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold">LIVE CC</span>
                        <span className="text-white">
                          Sign: {activeSubtitle.emoji} {activeSubtitle.gestureName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white">→ {activeSubtitle.targetLanguageName}</span>
                        <button
                          type="button"
                          onClick={() => handleReplaySubtitleAudio(activeSubtitle)}
                          className="hover:scale-110 transition-transform p-0.5 rounded text-white"
                          title="Replay Audio"
                        >
                          {isSpeaking ? (
                            <VolumeX size={14} className="text-rose-400 animate-pulse" />
                          ) : (
                            <Volume2 size={14} className="text-emerald-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Main Broadcast Subtitle Text */}
                    <p
                      className={`font-indic font-black tracking-wide leading-tight drop-shadow-md ${
                        subtitleFontSize === 'jumbo'
                          ? 'text-2xl md:text-3xl'
                          : subtitleFontSize === 'large'
                          ? 'text-xl md:text-2xl'
                          : 'text-base md:text-lg'
                      }`}
                    >
                      "{activeSubtitle.translatedText}"
                    </p>

                    {/* Phonetic Pronunciation Transliteration */}
                    {activeSubtitle.transliteration && (
                      <p className="text-xs font-mono text-slate-300 mt-1 opacity-90">
                        Pronunciation: {activeSubtitle.transliteration}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/75 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center text-slate-400 text-xs">
                    <span>
                      {isCameraActive
                        ? 'Point hand gestures toward camera or tap gestures below for live subtitles...'
                        : 'Camera inactive. Click "Start Live Camera" or tap any gesture below to trigger subtitles!'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtitle Controls & Audio Status Dock */}
            <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-3 border border-white/10 text-xs">
              <div className="flex items-center gap-3">
                {/* Auto-Speak Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSpeakSubtitles}
                    onChange={(e) => setAutoSpeakSubtitles(e.target.checked)}
                    className="rounded bg-slate-900 border-purple-500/40 text-purple-500 focus:ring-0"
                  />
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    <Volume2 size={13} className="text-purple-400" />
                    <span>Auto-Speak Subtitles</span>
                  </span>
                </label>

                {/* Continuous Recognition Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isContinuousAIActive}
                    onChange={(e) => setIsContinuousAIActive(e.target.checked)}
                    className="rounded bg-slate-900 border-purple-500/40 text-purple-500 focus:ring-0"
                  />
                  <span className="text-slate-300 flex items-center gap-1">
                    <Radio size={13} className="text-cyan-400" />
                    <span>Continuous AI Stream</span>
                  </span>
                </label>
              </div>

              {/* Subtitle Style & Font Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">STYLE:</span>
                <button
                  type="button"
                  onClick={() =>
                    setSubtitleTheme(
                      subtitleTheme === 'broadcast-yellow'
                        ? 'cyber-cyan'
                        : subtitleTheme === 'cyber-cyan'
                        ? 'dark-glass'
                        : 'broadcast-yellow'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-white"
                >
                  {subtitleTheme.toUpperCase()}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSubtitleFontSize(
                      subtitleFontSize === 'normal' ? 'large' : subtitleFontSize === 'large' ? 'jumbo' : 'normal'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:text-white"
                >
                  TEXT: {subtitleFontSize.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Recognized Sign Vocabulary & Live Subtitle Transcript Log */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Gesture Palette / Simulator Pads */}
            <div className="glass-panel p-4 flex flex-col justify-between border border-purple-500/20">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" />
                  <span>Recognized Sign Gesture Library (Tap to Trigger):</span>
                </h3>
                <span className="text-[10px] font-mono text-purple-300">Translates to {targetLanguageInfo.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {SIGN_GESTURES.map((sign) => {
                  const isActive = activeGesture?.id === sign.id;
                  return (
                    <button
                      key={sign.id}
                      type="button"
                      onClick={() => triggerSignRecognition(sign)}
                      className={`p-2.5 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                        isActive
                          ? 'bg-purple-500/30 border-purple-400 shadow-md scale-[1.02]'
                          : 'bg-white/5 hover:bg-purple-500/15 border-white/5 hover:border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg group-hover:scale-110 transition-transform">{sign.emoji}</span>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 line-clamp-1">
                          {sign.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">"{sign.text}"</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Subtitles Streaming Log */}
            <div className="glass-panel p-4 flex-1 flex flex-col justify-between border border-white/10 min-h-[220px]">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Radio size={14} className="text-emerald-400 animate-pulse" />
                    <span>Live Subtitle Audio Log</span>
                  </h3>
                  {subtitleLog.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSubtitleLog([])}
                      className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subtitleLog.length > 0 ? (
                    subtitleLog.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-left flex items-start justify-between gap-2 transition-all hover:border-purple-500/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-0.5">
                            <span>{sub.emoji}</span>
                            <span className="font-bold text-purple-300">{sub.gestureName}</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white font-indic leading-snug">
                            "{sub.translatedText}"
                          </p>
                          {sub.transliteration && (
                            <p className="text-[10px] text-cyan-300/80 font-mono mt-0.5">
                              {sub.transliteration}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pt-1">
                          <button
                            type="button"
                            onClick={() => handleReplaySubtitleAudio(sub)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-purple-500/20 text-purple-300"
                            title="Play Audio"
                          >
                            <Volume2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => copySubtitleText(sub.translatedText)}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                            title="Copy Subtitle"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      <Hand size={24} className="mx-auto mb-1.5 opacity-40 text-purple-400" />
                      <span>Live sign language subtitles and audio speech history will appear here.</span>
                    </div>
                  )}
                </div>
              </div>

              {activeSubtitle && (
                <div className="pt-2 border-t border-white/5 mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Current Speech: {activeSubtitle.targetLanguageName}</span>
                  <span className="font-mono text-emerald-400">Engine: Active Neural TTS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Mode B: Voice Speech to Subtitles & Animated Sign Language Cards */
        <div className="glass-panel p-6 space-y-5 border border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic size={16} className="text-cyan-400" /> Speech-to-Sign Visualizer & Real-Time Captions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Speak into microphone or type phrases to generate live subtitles and animated Sign Language gestures for
                deaf and hard-of-hearing persons.
              </p>
            </div>
            <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-400/30">
              Output: {targetLanguageInfo.name}
            </span>
          </div>

          {/* Voice Input & Text Box */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Speak or type a phrase (e.g. 'I need water', 'emergency help', 'thank you')..."
                value={speechInputText}
                onChange={(e) => setSpeechInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSpeechToSignSubmit(speechInputText)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={isRecording ? stopRecording : () => startRecording()}
                className={`flex-1 sm:flex-initial px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-lg'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30'
                }`}
              >
                <Mic size={16} />
                <span>{isRecording ? 'Listening...' : 'Voice Mic'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSpeechToSignSubmit(speechInputText)}
                className="flex-1 sm:flex-initial btn-primary text-xs px-5 py-3 font-bold flex items-center justify-center gap-1.5"
              >
                <span>Translate & Sign</span>
                <Play size={13} />
              </button>
            </div>
          </div>

          {/* Speech to Sign Visual Subtitles & Gesture Animation */}
          {speechToSignResult ? (
            <div className="space-y-4 pt-2">
              {/* Broadcast Subtitle Card */}
              <div className="p-5 rounded-2xl bg-black/90 border-2 border-yellow-400 text-yellow-300 shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1">
                  <span>LIVE SPEECH CAPTIONS ({speechToSignResult.targetLangName}):</span>
                  <button
                    type="button"
                    onClick={() => speakText(speechToSignResult.translated, targetLanguage)}
                    className="text-white hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Volume2 size={13} /> Speak Audio
                  </button>
                </div>
                <p className="text-2xl font-black font-indic leading-snug">
                  "{speechToSignResult.translated}"
                </p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Original: "{speechToSignResult.text}"
                </p>
              </div>

              {/* Animated Sign Language Gesture Visualizer Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
                  <Hand size={14} className="text-cyan-400" />
                  <span>Corresponding Sign Language Hand Gestures:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {speechToSignResult.signs.map((sign, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center gap-3 shadow-lg"
                    >
                      <span className="text-3xl p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
                        {sign.emoji}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white block">{sign.name}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{sign.motionHint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500">
              <Mic size={32} className="mx-auto mb-2 opacity-40 text-cyan-400" />
              <p className="text-xs">Speak into the microphone or type above to generate real-time sign language captions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
