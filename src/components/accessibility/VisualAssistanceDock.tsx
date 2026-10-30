import React from 'react';
import { Eye, Sun, Type, Volume2, Check, Radio } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAudio } from '../../contexts/AudioContext';

export const VisualAssistanceDock: React.FC = () => {
  const {
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    autoPlayAudio,
    setAutoPlayAudio,
    screenReaderAnnouncements,
    setScreenReaderAnnouncements,
    announceToScreenReader,
  } = useAccessibility();

  const { speakText } = useAudio();

  const handleToggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    announceToScreenReader(`High contrast mode ${next ? 'enabled' : 'disabled'}`);
  };

  const handleCycleFontSize = () => {
    const sizes: ('normal' | 'large' | 'xlarge')[] = ['normal', 'large', 'xlarge'];
    const nextIdx = (sizes.indexOf(fontSize) + 1) % sizes.length;
    const nextSize = sizes[nextIdx];
    setFontSize(nextSize);
    announceToScreenReader(`Font size set to ${nextSize}`);
  };

  const handleVoiceGuidanceDemo = () => {
    speakText(
      'Visual assistance mode active. High contrast, large typography, and voice feedback are configured.',
      'en'
    );
  };

  return (
    <div className="glass-panel p-6 space-y-6" role="region" aria-label="Visual Assistance Controls">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
          <Eye size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Visual Assistance Engine (Module 07A)</h2>
          <p className="text-xs text-slate-400">
            Tailored for low-vision and visually impaired users with maximum contrast and voice guidance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* High Contrast Toggle Button */}
        <button
          type="button"
          onClick={handleToggleContrast}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            highContrast
              ? 'bg-yellow-400 text-black border-white font-bold shadow-lg'
              : 'bg-white/5 text-white border-white/10 hover:border-yellow-400/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sun size={24} />
            <div className="text-left">
              <span className="text-sm font-bold block">High Contrast</span>
              <span className="text-xs opacity-75">{highContrast ? 'Active (OLED)' : 'Standard Theme'}</span>
            </div>
          </div>
          {highContrast && <Check size={18} />}
        </button>

        {/* Font Size Scaler */}
        <button
          type="button"
          onClick={handleCycleFontSize}
          className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:border-cyan-400/50 transition-all"
        >
          <div className="flex items-center gap-3">
            <Type size={24} className="text-cyan-400" />
            <div className="text-left">
              <span className="text-sm font-bold block">Text Scaling</span>
              <span className="text-xs text-cyan-300 uppercase font-mono">{fontSize} (Tap to scale)</span>
            </div>
          </div>
        </button>

        {/* Auto Voice Feedback */}
        <button
          type="button"
          onClick={() => setAutoPlayAudio(!autoPlayAudio)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            autoPlayAudio
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Volume2 size={24} />
            <div className="text-left">
              <span className="text-sm font-bold block text-white">Auto Speech</span>
              <span className="text-xs text-slate-400">{autoPlayAudio ? 'Enabled' : 'Manual Trigger'}</span>
            </div>
          </div>
          {autoPlayAudio && <Check size={18} />}
        </button>

        {/* Screen Reader Announcements */}
        <button
          type="button"
          onClick={() => setScreenReaderAnnouncements(!screenReaderAnnouncements)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            screenReaderAnnouncements
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Radio size={24} />
            <div className="text-left">
              <span className="text-sm font-bold block text-white">ARIA Live</span>
              <span className="text-xs text-slate-400">{screenReaderAnnouncements ? 'Active' : 'Muted'}</span>
            </div>
          </div>
          {screenReaderAnnouncements && <Check size={18} />}
        </button>
      </div>

      {/* Test Voice Guidance Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleVoiceGuidanceDemo}
          className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-2"
        >
          <Volume2 size={14} className="text-cyan-400" />
          <span>Test Voice Feedback</span>
        </button>
      </div>
    </div>
  );
};
