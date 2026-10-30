import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Navigation,
  Compass,
  Volume2,
  VolumeX,
  Eye,
  Ear,
  Radio,
  MapPin,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowUpLeft,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Globe,
  ChevronDown,
  Search,
  Check,
  Locate,
  Footprints,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { translateTextAPI } from '../../services/api';
import { SupportedLanguageCode, LanguageInfo, WayfindingRoute, TurnDirection } from '../../types';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '../../services/languageService';

// Preset accessible routes for hospitals, metro, airports, universities, and cities
const PRESET_ROUTES: WayfindingRoute[] = [
  {
    id: 'route-hospital',
    title: 'City General Hospital & Medical Clinic',
    origin: 'Main Street Gate & Tactile Drop-off',
    destination: 'Room 204 Eye Clinic & Radiology',
    category: 'Hospital',
    totalDistanceMeters: 140,
    estimatedMinutes: 3,
    icon: '🏥',
    steps: [
      {
        id: 'h-1',
        stepNumber: 1,
        instruction: 'Walk straight along the tactile sensory paving for 35 meters toward the Main Entrance.',
        distanceMeters: 35,
        turnDirection: 'straight',
        landmarkIcon: '🚪',
        landmarkName: 'Automatic Glass Sliding Doors',
        hazardAlert: 'Caution: Sliding glass doors open automatically. Maintain steady forward walking.',
        signCue: 'Straight ahead',
      },
      {
        id: 'h-2',
        stepNumber: 2,
        instruction: 'Enter the main lobby, then turn slightly right toward the Information & Triage Desk.',
        distanceMeters: 20,
        turnDirection: 'slight-right',
        landmarkIcon: 'ℹ️',
        landmarkName: 'Information & Triage Desk',
        hazardAlert: 'High acoustic area with echo. Staff available on immediate right.',
        signCue: 'Slight Right',
      },
      {
        id: 'h-3',
        stepNumber: 3,
        instruction: 'Continue straight past the Emergency Pharmacy on your left for 40 meters.',
        distanceMeters: 40,
        turnDirection: 'straight',
        landmarkIcon: '💊',
        landmarkName: '24/7 Hospital Pharmacy',
        signCue: 'Straight past Pharmacy',
      },
      {
        id: 'h-4',
        stepNumber: 4,
        instruction: 'Turn left into Corridor B toward the Accessible Elevator and Eye Clinic.',
        distanceMeters: 25,
        turnDirection: 'turn-left',
        landmarkIcon: '🛗',
        landmarkName: 'Braille Voice Elevator Bank',
        hazardAlert: 'Braille buttons on right wall at 1.1 meters height. Voice announcements active.',
        signCue: 'Turn Left into Corridor B',
      },
      {
        id: 'h-5',
        stepNumber: 5,
        instruction: 'Arrived at your destination! Room 204 Eye Clinic & Ophthalmology is directly on your right.',
        distanceMeters: 20,
        turnDirection: 'destination',
        landmarkIcon: '🎯',
        landmarkName: 'Room 204 Eye Hospital Reception',
        signCue: 'Destination Reached',
      },
    ],
  },
  {
    id: 'route-metro',
    title: 'Central Metro Station & Transit Hub',
    origin: 'Street Concourse North Entrance',
    destination: 'Platform 2 (Airport Line Subway)',
    category: 'Metro',
    totalDistanceMeters: 180,
    estimatedMinutes: 4,
    icon: '🚆',
    steps: [
      {
        id: 'm-1',
        stepNumber: 1,
        instruction: 'Follow yellow tactile paving straight for 45 meters toward the Fare Gate and Smart Card Readers.',
        distanceMeters: 45,
        turnDirection: 'straight',
        landmarkIcon: '🎫',
        landmarkName: 'Wide Accessible Smart Gate',
        hazardAlert: 'Audio chime at Gate 1 for blind card tap.',
        signCue: 'Straight to Fare Gates',
      },
      {
        id: 'm-2',
        stepNumber: 2,
        instruction: 'Pass through the wide accessible gate and turn right toward the elevator lobby.',
        distanceMeters: 30,
        turnDirection: 'turn-right',
        landmarkIcon: '🛗',
        landmarkName: 'Subway Platform Elevator',
        hazardAlert: 'Avoid escalators if carrying white cane or guide dog.',
        signCue: 'Turn Right to Elevator',
      },
      {
        id: 'm-3',
        stepNumber: 3,
        instruction: 'Take elevator down to Level B2. Exit elevator and proceed straight for 50 meters.',
        distanceMeters: 50,
        turnDirection: 'straight',
        landmarkIcon: '🚇',
        landmarkName: 'Platform 2 Tactile Warning Edge',
        hazardAlert: 'Yellow knurled tactile border 1 meter from train platform edge. Do not cross.',
        signCue: 'Straight on Platform',
      },
      {
        id: 'm-4',
        stepNumber: 4,
        instruction: 'Arrived at Coach 4 accessible boarding zone with audio train departure announcements.',
        distanceMeters: 55,
        turnDirection: 'destination',
        landmarkIcon: '🛑',
        landmarkName: 'Coach 4 Boarding Point',
        signCue: 'Arrived at Train Door',
      },
    ],
  },
  {
    id: 'route-university',
    title: 'University Campus & Accessible Library',
    origin: 'Main Gate & Bus Drop-off',
    destination: 'Central Library Audio Learning Center',
    category: 'University',
    totalDistanceMeters: 210,
    estimatedMinutes: 5,
    icon: '🎓',
    steps: [
      {
        id: 'u-1',
        stepNumber: 1,
        instruction: 'Walk straight along the shaded pedestrian walkway with continuous guide handrail for 70 meters.',
        distanceMeters: 70,
        turnDirection: 'straight',
        landmarkIcon: '🌳',
        landmarkName: 'Campus Palm Promenade',
        signCue: 'Follow Handrail Straight',
      },
      {
        id: 'u-2',
        stepNumber: 2,
        instruction: 'Turn slight left toward the Library gentle accessible ramp.',
        distanceMeters: 45,
        turnDirection: 'slight-left',
        landmarkIcon: '♿',
        landmarkName: 'Gentle Slope Accessible Ramp',
        hazardAlert: '1:12 ADA-compliant ramp slope with dual handrails.',
        signCue: 'Slight Left to Ramp',
      },
      {
        id: 'u-3',
        stepNumber: 3,
        instruction: 'Ascend ramp and enter through the sensory sound chime entrance into the Library Rotunda.',
        distanceMeters: 45,
        turnDirection: 'straight',
        landmarkIcon: '📚',
        landmarkName: 'Library Rotunda Help Desk',
        signCue: 'Enter Library Entrance',
      },
      {
        id: 'u-4',
        stepNumber: 4,
        instruction: 'Arrived! The Assistive Audio Learning Center & Screen Reader Lab is on your immediate left.',
        distanceMeters: 50,
        turnDirection: 'destination',
        landmarkIcon: '🎧',
        landmarkName: 'Assistive Tech & Audio Lab',
        signCue: 'Destination on Left',
      },
    ],
  },
  {
    id: 'route-airport',
    title: 'International Airport Concourse',
    origin: 'Departure Terminal Gate 3',
    destination: 'Boarding Gate 18B (Priority Zone)',
    category: 'Airport',
    totalDistanceMeters: 260,
    estimatedMinutes: 6,
    icon: '✈️',
    steps: [
      {
        id: 'a-1',
        stepNumber: 1,
        instruction: 'Proceed forward 60 meters past airline check-in counters toward Security Checkpoint C.',
        distanceMeters: 60,
        turnDirection: 'straight',
        landmarkIcon: '🛡️',
        landmarkName: 'Accessible Security Lane C',
        signCue: 'Straight to Security',
      },
      {
        id: 'a-2',
        stepNumber: 2,
        instruction: 'Exit security and turn right into the main international departure concourse.',
        distanceMeters: 80,
        turnDirection: 'turn-right',
        landmarkIcon: '🏬',
        landmarkName: 'Main Concourse Walkway',
        signCue: 'Turn Right to Gates',
      },
      {
        id: 'a-3',
        stepNumber: 3,
        instruction: 'Walk straight along moving walkway for 80 meters passing Restrooms on left.',
        distanceMeters: 80,
        turnDirection: 'straight',
        landmarkIcon: '🚻',
        landmarkName: 'Accessible Restroom & Water',
        signCue: 'Straight along Walkway',
      },
      {
        id: 'a-4',
        stepNumber: 4,
        instruction: 'Arrived at Gate 18B. Priority boarding seating area and assistance desk are in front of you.',
        distanceMeters: 40,
        turnDirection: 'destination',
        landmarkIcon: '🛫',
        landmarkName: 'Boarding Gate 18B',
        signCue: 'Arrived at Boarding Gate',
      },
    ],
  },
];

export const AccessibleMapGuide: React.FC = () => {
  // Accessible Persona: 'blind' (voice guide), 'deaf' (text/visual guide), or 'dual' (both)
  const [guideMode, setGuideMode] = useState<'blind' | 'deaf' | 'dual'>('dual');

  // Active Route & Step
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-hospital');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [userProgress, setUserProgress] = useState<number>(0); // 0 to 1 progress within step

  // Translated Step cache: stepId -> { translatedText, transliteration }
  const [translatedSteps, setTranslatedSteps] = useState<Record<string, { instruction: string; transliteration?: string }>>({});
  const [_isTranslatingRoute, setIsTranslatingRoute] = useState<boolean>(false);

  // Assistive Audio states (Blind mode)
  const [autoVoiceGuidance, setAutoVoiceGuidance] = useState<boolean>(true);
  const [sonarBeaconActive, setSonarBeaconActive] = useState<boolean>(false);
  const [audioCompassHeading] = useState<number>(45); // Degrees

  // Visual Alert states (Deaf mode)
  const [visualFlashAlert, setVisualFlashAlert] = useState<boolean>(false);
  const [textGuideExpanded, setTextGuideExpanded] = useState<boolean>(true);

  // Live Geolocation
  const [isLiveGpsActive, setIsLiveGpsActive] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  // Language Context
  const { targetLanguage, targetLanguageInfo, setTargetLanguage } = useLanguage();
  const { speakText, isSpeaking, stopSpeaking } = useAudio();

  // Language Dropdown states
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Web Audio Sonar Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sonarIntervalRef = useRef<any>(null);

  // Canvas Ref for Tactical Map
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const activeRoute = PRESET_ROUTES.find((r) => r.id === selectedRouteId) || PRESET_ROUTES[0];
  const activeStep = activeRoute.steps[currentStepIndex] || activeRoute.steps[0];

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

  /**
   * Translates all steps of the active route into the TARGET LANGUAGE
   */
  const translateActiveRoute = useCallback(async () => {
    setIsTranslatingRoute(true);
    const newTranslations: Record<string, { instruction: string; transliteration?: string }> = {};

    try {
      for (const step of activeRoute.steps) {
        const res = await translateTextAPI(step.instruction, targetLanguage, 'en');
        newTranslations[step.id] = {
          instruction: res.translatedText,
          transliteration: res.transliteration,
        };
      }
      setTranslatedSteps(newTranslations);
    } catch (err) {
      console.warn('Route translation notice:', err);
    } finally {
      setIsTranslatingRoute(false);
    }
  }, [activeRoute, targetLanguage]);

  useEffect(() => {
    translateActiveRoute();
  }, [translateActiveRoute]);

  /**
   * Speaks the current step instruction aloud in the targeted language
   */
  const speakCurrentInstruction = useCallback(() => {
    const stepTranslation = translatedSteps[activeStep.id]?.instruction || activeStep.instruction;
    const hazard = activeStep.hazardAlert ? `. ${activeStep.hazardAlert}` : '';
    const fullText = `Step ${activeStep.stepNumber}: ${stepTranslation}${hazard}`;

    speakText(fullText, targetLanguage);
  }, [activeStep, translatedSteps, targetLanguage, speakText]);

  /**
   * Sound Beacon (Sonar Ping) for Blind Navigation
   * Synthesizes audio pulses using Web Audio API that beep to orient blind users
   */
  const playSonarPing = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  // Manage Sonar beacon loop
  useEffect(() => {
    if (sonarBeaconActive && isNavigating) {
      sonarIntervalRef.current = setInterval(() => {
        playSonarPing();
      }, 1600);
    } else {
      if (sonarIntervalRef.current) {
        clearInterval(sonarIntervalRef.current);
        sonarIntervalRef.current = null;
      }
    }
    return () => {
      if (sonarIntervalRef.current) clearInterval(sonarIntervalRef.current);
    };
  }, [sonarBeaconActive, isNavigating, playSonarPing]);

  /**
   * Trigger turn event: Speaks audio for blind, flashes screen beacon for deaf, vibrates device
   */
  const triggerTurnArrivalEvent = useCallback(() => {
    // 1. Deaf mode: Flash visual alert beacon
    setVisualFlashAlert(true);
    setTimeout(() => setVisualFlashAlert(false), 900);

    // 2. Blind mode: Auto-speak in targeted language
    if (autoVoiceGuidance || guideMode === 'blind') {
      speakCurrentInstruction();
    }

    // 3. Tactile Vibration (for mobile users)
    if (navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Ignore
      }
    }
  }, [autoVoiceGuidance, guideMode, speakCurrentInstruction]);

  /**
   * Live Step advancement simulation
   */
  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      setUserProgress((prev) => {
        if (prev >= 1) {
          // Advance to next step
          setCurrentStepIndex((stepIdx) => {
            if (stepIdx < activeRoute.steps.length - 1) {
              const nextIdx = stepIdx + 1;
              return nextIdx;
            } else {
              setIsNavigating(false);
              return stepIdx;
            }
          });
          return 0;
        }
        return prev + 0.04;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isNavigating, activeRoute]);

  // Trigger arrival effects whenever currentStepIndex changes during navigation
  useEffect(() => {
    if (isNavigating) {
      triggerTurnArrivalEvent();
    }
  }, [currentStepIndex, isNavigating, triggerTurnArrivalEvent]);

  /**
   * Live GPS Geolocation
   */
  const toggleLiveGps = () => {
    if (isLiveGpsActive) {
      setIsLiveGpsActive(false);
      setGpsCoords(null);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy),
            });
            setIsLiveGpsActive(true);
          },
          (err) => {
            console.warn('Geolocation error:', err);
            // Simulated outdoor GPS fix
            setGpsCoords({ lat: 13.0827, lng: 80.2707, accuracy: 4 });
            setIsLiveGpsActive(true);
          }
        );
      }
    }
  };

  /**
   * Tactical Map Canvas Renderer
   * Renders high-contrast road grid, waypoint pathing, active user avatar & compass cone
   */
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    let t = 0;

    const renderMap = () => {
      if (!isRunning) return;
      t += 0.04;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Deep contrast map background
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, w, h);

      // Tactile Grid lines (High Contrast)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Waypoint coordinate calculation
      const numSteps = activeRoute.steps.length;
      const waypoints = activeRoute.steps.map((_s, idx) => {
        const px = 60 + (idx / (numSteps - 1)) * (w - 120);
        const py = h * 0.5 + Math.sin(idx * 1.5) * (h * 0.28);
        return { x: px, y: py };
      });

      // Draw Route Path Lines (Glowing Cyber Path)
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.stroke();

      // Active completed path
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      for (let i = 1; i <= currentStepIndex && i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Waypoint nodes
      waypoints.forEach((wp, idx) => {
        const isPast = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;

        // Node circle
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, isCurrent ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? '#a855f7' : isPast ? '#00f2fe' : '#334155';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = isCurrent ? '#00f2fe' : '#94a3b8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`P${idx + 1}`, wp.x - 7, wp.y - 16);
      });

      // Calculate Current User Position (interpolated with userProgress)
      const p1 = waypoints[currentStepIndex] || waypoints[0];
      const p2 = waypoints[Math.min(currentStepIndex + 1, waypoints.length - 1)];
      const userX = p1.x + (p2.x - p1.x) * userProgress;
      const userY = p1.y + (p2.y - p1.y) * userProgress;

      // Direction angle for compass orientation cone
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Orientation Vision Cone (Auditory/Visual Heading)
      ctx.save();
      ctx.translate(userX, userY);
      ctx.rotate(angle);

      const coneGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 55);
      coneGrad.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
      coneGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 55, -Math.PI / 4, Math.PI / 4);
      ctx.closePath();
      ctx.fill();

      // Heading indicator needle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();

      ctx.restore();

      // Pulsing User Avatar Node (Blue & White pulse)
      ctx.beginPath();
      ctx.arc(userX, userY, 14 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(userX, userY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Compass Bearing Tag
      ctx.fillStyle = 'rgba(8, 14, 28, 0.85)';
      ctx.fillRect(userX - 35, userY + 18, 70, 18);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#00f2fe';
      ctx.fillText(`HEADING ${Math.round(audioCompassHeading)}°`, userX - 30, userY + 30);

      animationFrameRef.current = requestAnimationFrame(renderMap);
    };

    renderMap();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeRoute, currentStepIndex, userProgress, audioCompassHeading]);

  /**
   * Helper to render turn icon
   */
  const renderTurnIcon = (dir: TurnDirection, size = 28) => {
    switch (dir) {
      case 'straight':
        return <ArrowUp size={size} className="text-cyan-400" />;
      case 'turn-right':
        return <ArrowRight size={size} className="text-amber-400" />;
      case 'slight-right':
        return <ArrowUpRight size={size} className="text-amber-300" />;
      case 'turn-left':
        return <ArrowLeft size={size} className="text-purple-400" />;
      case 'slight-left':
        return <ArrowUpLeft size={size} className="text-purple-300" />;
      case 'destination':
        return <CheckCircle size={size} className="text-emerald-400" />;
      default:
        return <Compass size={size} className="text-cyan-400" />;
    }
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (lang: LanguageInfo) =>
      lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(langSearch.toLowerCase())
  );

  const QUICK_LANGS: SupportedLanguageCode[] = ['ta', 'hi', 'en', 'te', 'ml', 'kn', 'bn', 'es', 'fr', 'ja'];

  // Current step translation
  const activeStepTranslation = translatedSteps[activeStep.id];
  const displayInstruction = activeStepTranslation?.instruction || activeStep.instruction;

  return (
    <div
      className={`space-y-6 max-w-5xl mx-auto transition-colors duration-300 ${
        visualFlashAlert ? 'bg-cyan-500/10 rounded-3xl p-1 border-2 border-cyan-400 shadow-2xl' : ''
      }`}
      role="region"
      aria-label="Accessible Map and Wayfinding Guide"
    >
      {/* Header & Accessible Mode Selector */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shrink-0">
            <Navigation size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Accessible Map Guide: Voice & Text Wayfinding</h2>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-400/30">
                Inclusive 07E
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Turn-by-turn auditory voice navigation for the blind & high-visibility visual text guidance for the deaf
              in <span className="text-cyan-300 font-bold">{targetLanguageInfo.name}</span>.
            </p>
          </div>
        </div>

        {/* Target Language Dropdown Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative" ref={langDropdownRef}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 hidden sm:inline">Target Language:</span>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-bold text-white hover:border-cyan-400 transition-all shadow-md"
              >
                <Globe size={14} className="text-cyan-400" />
                <span>{targetLanguageInfo.flag}</span>
                <span>{targetLanguageInfo.name}</span>
                <span className="text-slate-400 text-[11px] font-normal">({targetLanguageInfo.nativeName})</span>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Language Selection Popover */}
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-fade-in">
                <div className="mb-2 p-1">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search any language..."
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
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
                        onClick={() => {
                          setTargetLanguage(lang.code as SupportedLanguageCode);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40'
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
                        {isSelected && <Check size={12} className="text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Persona Switcher & Quick Languages Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Persona Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setGuideMode('blind')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              guideMode === 'blind'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye size={14} />
            <span>Blind Voice Guide (Audio & Sonar)</span>
          </button>

          <button
            type="button"
            onClick={() => setGuideMode('deaf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              guideMode === 'deaf'
                ? 'bg-indigo-500 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Ear size={14} />
            <span>Deaf Text Guide (Visual Captions)</span>
          </button>

          <button
            type="button"
            onClick={() => setGuideMode('dual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              guideMode === 'dual'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Navigation size={14} />
            <span>Dual Inclusive Mode</span>
          </button>
        </div>

        {/* Quick Language Pills */}
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
                onClick={() => setTargetLanguage(code)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm scale-105'
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

      {/* Preset Route Selector Bar */}
      <div className="glass-panel p-3.5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Footprints size={14} className="text-cyan-400" />
            <span>Select Destination & Wayfinding Scenario:</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-300">
            {activeRoute.totalDistanceMeters}m • ~{activeRoute.estimatedMinutes} mins walking
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_ROUTES.map((route) => {
            const isSelected = selectedRouteId === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => {
                  setSelectedRouteId(route.id);
                  setCurrentStepIndex(0);
                  setUserProgress(0);
                  setIsNavigating(false);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/50 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{route.icon}</span>
                  <span className="text-[10px] font-mono bg-white/10 text-cyan-300 px-1 rounded">
                    {route.category}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-200 line-clamp-1">{route.title}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{route.destination}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Map & Turn-by-Turn Guide Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Tactical Wayfinding Map & Navigation Stepper */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative glass-panel rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 min-h-[340px] flex items-center justify-center">
            {/* Tactical High-Contrast Canvas */}
            <canvas ref={mapCanvasRef} width={640} height={340} className="w-full h-[340px] object-cover" />

            {/* Map Top HUD Controls */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                <span className={`h-2 w-2 rounded-full ${isNavigating ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                  {isNavigating ? 'LIVE NAVIGATION ACTIVE' : 'TACTICAL MAP READY'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleLiveGps}
                  className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
                    isLiveGpsActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-slate-900/90 text-slate-400 border-white/10 hover:text-white'
                  }`}
                  title="Toggle Real GPS Geolocation"
                >
                  <Locate size={13} />
                  <span>{isLiveGpsActive ? `GPS ±${gpsCoords?.accuracy}m` : 'GPS'}</span>
                </button>
              </div>
            </div>

            {/* Map Bottom HUD Distance Status */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-10 text-[11px] font-mono text-slate-300 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-cyan-400" />
                <span>
                  Step {activeStep.stepNumber} of {activeRoute.steps.length}: {activeStep.distanceMeters}m
                </span>
              </div>
              <span className="text-cyan-300">
                Landmark: {activeStep.landmarkIcon} {activeStep.landmarkName}
              </span>
            </div>
          </div>

          {/* Navigation Control Bar */}
          <div className="glass-panel p-3.5 flex flex-wrap items-center justify-between gap-3 border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNavigating(!isNavigating)}
                className={`btn-futuristic px-4 py-2 text-xs font-bold flex items-center gap-1.5 ${
                  isNavigating ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950 shadow-lg'
                }`}
              >
                {isNavigating ? <Pause size={14} /> : <Play size={14} />}
                <span>{isNavigating ? 'Pause Walk' : 'Start Live Navigation'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentStepIndex < activeRoute.steps.length - 1) {
                    setCurrentStepIndex((prev) => prev + 1);
                    setUserProgress(0);
                    triggerTurnArrivalEvent();
                  }
                }}
                disabled={currentStepIndex >= activeRoute.steps.length - 1}
                className="btn-secondary px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-40"
                title="Next Step"
              >
                <span>Next Step</span>
                <SkipForward size={13} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStepIndex(0);
                  setUserProgress(0);
                  setIsNavigating(false);
                }}
                className="btn-icon h-8 w-8 text-slate-400 hover:text-white"
                title="Reset Route"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Blind Mode Quick Audio Toggles */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoVoiceGuidance}
                  onChange={(e) => setAutoVoiceGuidance(e.target.checked)}
                  className="rounded bg-slate-900 border-cyan-500/40 text-cyan-400 focus:ring-0"
                />
                <span className="text-slate-300 text-[11px] flex items-center gap-1">
                  <Volume2 size={12} className="text-cyan-400" />
                  <span>Auto-Voice</span>
                </span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sonarBeaconActive}
                  onChange={(e) => setSonarBeaconActive(e.target.checked)}
                  className="rounded bg-slate-900 border-cyan-500/40 text-cyan-400 focus:ring-0"
                />
                <span className="text-slate-300 text-[11px] flex items-center gap-1">
                  <Radio size={12} className="text-purple-400" />
                  <span>Sonar Ping</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Turn-by-Turn Accessible Cards (Voice for Blind & Text for Deaf) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Active Turn-by-Turn Card */}
          <div
            className={`p-5 rounded-2xl border transition-all shadow-2xl flex flex-col justify-between min-h-[260px] ${
              guideMode === 'blind'
                ? 'bg-amber-950/40 border-amber-400/80'
                : guideMode === 'deaf'
                ? 'bg-slate-950/95 border-2 border-yellow-400'
                : 'bg-slate-950/90 border-cyan-500/40'
            }`}
          >
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 text-cyan-300">
                    {renderTurnIcon(activeStep.turnDirection, 20)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      STEP {activeStep.stepNumber} of {activeRoute.steps.length} ({activeStep.distanceMeters}m)
                    </span>
                    <span className="text-xs font-bold text-white">{activeRoute.title}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={isSpeaking ? stopSpeaking : speakCurrentInstruction}
                    className={`btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1 ${
                      isSpeaking ? 'bg-cyan-400 text-slate-950 animate-pulse' : ''
                    }`}
                    title="Speak Step Aloud"
                  >
                    {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    <span>{isSpeaking ? 'Mute' : 'Speak'}</span>
                  </button>
                </div>
              </div>

              {/* Main Text Guide for Deaf Users (Prominent High Contrast Typography) */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-mono text-cyan-300 block">
                  Direction in {targetLanguageInfo.name}:
                </span>
                <p
                  className={`font-indic font-black tracking-wide leading-snug ${
                    guideMode === 'deaf' ? 'text-2xl text-yellow-300' : 'text-xl text-white'
                  }`}
                >
                  "{displayInstruction}"
                </p>

                {activeStepTranslation?.transliteration && (
                  <p className="text-xs font-mono text-cyan-200/80 mt-1">
                    Pronunciation: {activeStepTranslation.transliteration}
                  </p>
                )}
              </div>

              {/* Landmark Cue & Hazard Alert */}
              <div className="mt-3.5 pt-2.5 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-base">{activeStep.landmarkIcon}</span>
                  <span className="font-semibold">Landmark: {activeStep.landmarkName}</span>
                </div>

                {activeStep.hazardAlert && (
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 flex items-start gap-1.5 text-[11px]">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{activeStep.hazardAlert}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Blind Quick Voice Query Buttons */}
            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const locationAnnouncement = `You are at Step ${activeStep.stepNumber}. Heading ${Math.round(
                    audioCompassHeading
                  )} degrees near ${activeStep.landmarkName}. ${activeStep.distanceMeters} meters to next turn.`;
                  speakText(locationAnnouncement, targetLanguage);
                }}
                className="btn-secondary text-[11px] px-2.5 py-1 inline-flex items-center gap-1 text-cyan-300"
              >
                <Compass size={12} />
                <span>"Where Am I?" Audio</span>
              </button>

              <span className="text-[10px] font-mono text-slate-500">
                Sign Cue: {activeStep.signCue}
              </span>
            </div>
          </div>

          {/* Full Turn-by-Turn Text Itinerary for Deaf Users */}
          <div className="glass-panel p-4 flex-1 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Ear size={14} className="text-cyan-400" />
                <span>Complete Route Text Itinerary ({targetLanguageInfo.name}):</span>
              </h3>
              <button
                type="button"
                onClick={() => setTextGuideExpanded(!textGuideExpanded)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                {textGuideExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {textGuideExpanded && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeRoute.steps.map((st, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  const stTrans = translatedSteps[st.id]?.instruction || st.instruction;

                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setUserProgress(0);
                        triggerTurnArrivalEvent();
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                        isCurrent
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                          : isPast
                          ? 'bg-white/5 border-white/5 opacity-60 text-slate-400'
                          : 'bg-white/5 border-white/5 hover:border-cyan-500/30 text-slate-300'
                      }`}
                    >
                      <div className="p-1 rounded bg-black/40 shrink-0 mt-0.5">
                        {renderTurnIcon(st.turnDirection, 14)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                          <span className={isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                            Step {st.stepNumber} ({st.distanceMeters}m)
                          </span>
                          <span>{st.landmarkIcon}</span>
                        </div>
                        <p className="text-xs font-indic font-medium line-clamp-2">"{stTrans}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
