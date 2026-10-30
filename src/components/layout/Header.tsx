import React from 'react';
import { Sparkles, Eye, Ear, MessageSquare, Hand, Navigation } from 'lucide-react';
import { TargetLanguageSelector } from '../translation/TargetLanguageSelector';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { AccessibilityMode } from '../../types';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const { accessibilityMode, setAccessibilityMode } = useAccessibility();

  const handleA11yToggle = (mode: AccessibilityMode) => {
    setAccessibilityMode(accessibilityMode === mode ? 'standard' : mode);
    if (activeView !== 'accessibility') {
      setActiveView('accessibility');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => setActiveView('translate')}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles size={20} className="text-slate-950 animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Voice<span className="text-cyan-400">Bridge</span>
              </span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                AI Core
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline leading-tight">
              Inclusive Multilingual Speech-to-Speech Assistant
            </span>
          </div>
        </div>

        {/* Right Section: Accessibility Quick Docks & Target Language Selector */}
        <div className="flex items-center gap-3">
          {/* Quick A11y Modes Pill */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveView('map')}
              title="Accessible Map Guide (Voice for Blind / Text for Deaf)"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeView === 'map'
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Navigation size={13} />
              <span>Map Guide</span>
            </button>

            <button
              type="button"
              onClick={() => handleA11yToggle('visual')}
              title="Visual Assistance Mode (07A)"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                accessibilityMode === 'visual'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Eye size={13} />
              <span>Visual</span>
            </button>

            <button
              type="button"
              onClick={() => handleA11yToggle('hearing')}
              title="Hearing Assistance Subtitles (07B)"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                accessibilityMode === 'hearing'
                  ? 'bg-indigo-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Ear size={13} />
              <span>Hearing</span>
            </button>

            <button
              type="button"
              onClick={() => handleA11yToggle('aac')}
              title="AAC Speech Board (07C)"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                accessibilityMode === 'aac'
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare size={13} />
              <span>AAC</span>
            </button>

            <button
              type="button"
              onClick={() => handleA11yToggle('sign')}
              title="Sign Gesture Mode (07D)"
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                accessibilityMode === 'sign'
                  ? 'bg-purple-500 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Hand size={13} />
              <span>Sign</span>
            </button>
          </div>

          {/* Locked Target Language Selector */}
          <TargetLanguageSelector />
        </div>
      </div>
    </header>
  );
};
