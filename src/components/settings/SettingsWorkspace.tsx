import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Volume2,
  ShieldCheck,
  Activity,
  Database,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Radio,
  Eye,
  Languages,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAudio } from '../../contexts/AudioContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { SUPPORTED_LANGUAGES } from '../../services/languageService';
import { SupportedLanguageCode } from '../../types';

export const SettingsWorkspace: React.FC = () => {
  const { targetLanguage, setTargetLanguage } = useLanguage();
  const {
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
    autoPlayAudio,
    setAutoPlayAudio,
  } = useAccessibility();

  const { speechRate, setSpeechRate, speechPitch, setSpeechPitch } = useAudio();
  const { clearAllHistory } = useTranslation();

  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    aiProviders?: {
      gemini?: string;
      googleTranslate?: string;
      whisper?: string;
      visionOCR?: string;
    };
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      } else {
        setSystemHealth({
          status: 'client-offline-mode',
          aiProviders: {
            gemini: 'fallback-mode',
            googleTranslate: 'active (client-gtx)',
            whisper: 'browser-speech-fallback',
          },
        });
      }
    } catch {
      setSystemHealth({
        status: 'client-offline-mode',
        aiProviders: {
          gemini: 'fallback-mode',
          googleTranslate: 'active (client-gtx)',
          whisper: 'browser-speech-fallback',
        },
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto" role="region" aria-label="System Settings and Preferences">
      {/* Header */}
      <div className="glass-panel p-4 flex items-center justify-between border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System Settings & Engine Diagnostics</h2>
            <p className="text-xs text-slate-400">Configure speech engine, accessibility, AI providers, and diagnostics.</p>
          </div>
        </div>
      </div>

      {/* Target Language Preference */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sliders size={16} className="text-cyan-400" /> Default Target Language
        </h3>
        <p className="text-xs text-slate-400">
          The default destination language selected when the system starts. Automatic source detection will translate into this language.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = targetLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setTargetLanguage(lang.code as SupportedLanguageCode)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-sm'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{lang.flag}</span>
                  <span className="text-sm font-bold">{lang.name}</span>
                </div>
                <span className="text-xs text-slate-400 font-indic">{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Gateway Diagnostics & Engine Health */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" /> AI Provider & Engine Diagnostics
          </h3>
          <button
            type="button"
            onClick={checkHealth}
            disabled={isCheckingHealth}
            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isCheckingHealth ? 'animate-spin' : ''} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Gemini 2.5 Flash */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-400" /> Google Gemini 2.5 Flash
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {systemHealth?.aiProviders?.gemini || 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Contextual translation, transliteration & multilingual nuances.</p>
          </div>

          {/* Google Translate GTX */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Languages size={14} className="text-blue-400" /> Google Translate GTX Engine
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {systemHealth?.aiProviders?.googleTranslate || 'Active (100+ langs)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Instant multi-tier fallback with 100+ language detection.</p>
          </div>

          {/* Whisper & Gemini STT */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Radio size={14} className="text-purple-400" /> Whisper & Multimodal STT
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {systemHealth?.aiProviders?.whisper || 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">High-accuracy audio recording & uploaded file transcription.</p>
          </div>

          {/* Vision OCR */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-amber-400" /> Vision OCR Translation
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {systemHealth?.aiProviders?.visionOCR || 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Gemini Vision signboard, document & menu translation.</p>
          </div>
        </div>
      </div>

      {/* Neural Speech & Audio Engine */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Volume2 size={16} className="text-cyan-400" /> Speech & Audio Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-200">Speech Rate (Speed)</span>
              <span className="font-mono text-cyan-400">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-200">Speech Pitch</span>
              <span className="font-mono text-cyan-400">{speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Accessibility & Visual Settings */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Activity size={16} className="text-cyan-400" /> Accessibility & Motion Options
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
            <span className="text-xs font-medium text-slate-200">Auto-Play Audio on Translation</span>
            <input
              type="checkbox"
              checked={autoPlayAudio}
              onChange={(e) => setAutoPlayAudio(e.target.checked)}
              className="h-4 w-4 rounded accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
            <span className="text-xs font-medium text-slate-200">High-Contrast OLED Theme</span>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="h-4 w-4 rounded accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
            <span className="text-xs font-medium text-slate-200">Reduced Motion & Smooth Transitions</span>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="h-4 w-4 rounded accent-cyan-400"
            />
          </label>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs font-medium text-slate-200">Font Scaling</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as any)}
              className="rounded-lg bg-slate-900 border border-white/10 px-2.5 py-1 text-xs text-white"
            >
              <option value="normal">Normal (100%)</option>
              <option value="large">Large (115%)</option>
              <option value="xlarge">Extra Large (130%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Management */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>Local IndexedDB Offline Cache & History Active</span>
          </div>
          <button
            type="button"
            onClick={clearAllHistory}
            className="text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1"
          >
            <Database size={13} /> Reset Local Cache & History
          </button>
        </div>
      </div>
    </div>
  );
};
