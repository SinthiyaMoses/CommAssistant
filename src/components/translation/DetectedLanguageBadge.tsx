import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Sparkles, HelpCircle } from 'lucide-react';

export const DetectedLanguageBadge: React.FC = () => {
  const { detectedSourceLanguageInfo, detectedConfidence } = useLanguage();

  if (!detectedSourceLanguageInfo) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
        <Sparkles size={12} className="text-slate-500" />
        <span>Auto Source Detection Ready</span>
      </div>
    );
  }

  const confidencePercent = detectedConfidence ? Math.round(detectedConfidence * 100) : 95;
  const isUncertain = confidencePercent < 70;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-all ${
        isUncertain
          ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
          : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
      }`}
      style={{
        boxShadow: isUncertain ? '0 0 15px rgba(245, 158, 11, 0.2)' : '0 0 15px rgba(0, 242, 254, 0.2)',
      }}
    >
      <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Source Detected:</span>
      <span className="font-semibold text-slate-100">{detectedSourceLanguageInfo.name}</span>
      <span className="text-slate-400 font-indic">({detectedSourceLanguageInfo.nativeName})</span>
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
        {confidencePercent}%
      </span>
      {isUncertain && (
        <span title="Detection confidence is low" className="text-amber-400">
          <HelpCircle size={12} />
        </span>
      )}
    </div>
  );
};
