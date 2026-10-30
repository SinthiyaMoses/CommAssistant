import React from 'react';
import { ShieldCheck, Globe, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAudio } from '../../contexts/AudioContext';

export const StatusBar: React.FC = () => {
  const { targetLanguageInfo, detectedSourceLanguageInfo } = useLanguage();
  const { accessibilityMode, highContrast } = useAccessibility();
  const { micState } = useAudio();

  return (
    <footer
      className="w-full glass-panel border-t border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400 backdrop-blur-md"
      style={{
        background: 'rgba(6, 9, 15, 0.88)',
      }}
      role="contentinfo"
      aria-label="Application Status Bar"
    >
      <div className="flex items-center gap-4 flex-wrap">
        {/* Engine State Indicator */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">AI Gateway: Active</span>
          <span className="text-slate-600">|</span>
          <span>Mic State: {micState}</span>
        </div>

        {/* Source -> Target Mapping */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Globe size={12} className="text-cyan-400" />
          <span>Source: {detectedSourceLanguageInfo ? detectedSourceLanguageInfo.name : 'Auto'}</span>
          <span>→</span>
          <span className="text-cyan-300 font-bold">Target: {targetLanguageInfo.name} ({targetLanguageInfo.nativeName})</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* A11y Active Profile */}
        <div className="flex items-center gap-1.5">
          <HeartHandshake size={12} className="text-amber-400" />
          <span>A11y Mode: <strong className="text-white uppercase">{accessibilityMode}</strong></span>
          {highContrast && <span className="rounded bg-yellow-400/20 text-yellow-300 px-1 py-0.2 text-[9px]">High Contrast</span>}
        </div>

        {/* Local-First Privacy Guarantee */}
        <div className="hidden md:flex items-center gap-1 text-emerald-400 font-semibold">
          <ShieldCheck size={13} />
          <span>Private On-Device Storage</span>
        </div>
      </div>
    </footer>
  );
};
