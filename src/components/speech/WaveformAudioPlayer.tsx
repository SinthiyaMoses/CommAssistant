import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Gauge } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { SupportedLanguageCode } from '../../types';
import { getLanguageByCode } from '../../services/languageService';

interface WaveformAudioPlayerProps {
  text: string;
  targetLanguage: SupportedLanguageCode;
  transliteration?: string;
  autoPlay?: boolean;
}

export const WaveformAudioPlayer: React.FC<WaveformAudioPlayerProps> = ({
  text,
  targetLanguage,
  transliteration,
}) => {
  const { speakText, stopSpeaking, isSpeaking, speechRate, setSpeechRate } = useAudio();
  const [progress, setProgress] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(speechRate);

  const langInfo = getLanguageByCode(targetLanguage);

  useEffect(() => {
    let interval: any;
    if (isSpeaking) {
      setProgress(0);
      const estDurationMs = Math.max(1500, (text.length / 10) * 1000 / currentSpeed);
      const startTime = Date.now();

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(100, (elapsed / estDurationMs) * 100);
        setProgress(p);
        if (p >= 100) clearInterval(interval);
      }, 50);
    } else {
      setProgress(0);
    }

    return () => clearInterval(interval);
  }, [isSpeaking, text, currentSpeed]);

  const handlePlayPause = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(text, targetLanguage);
    }
  };

  const handleReplay = () => {
    stopSpeaking();
    setTimeout(() => {
      speakText(text, targetLanguage);
    }, 100);
  };

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setCurrentSpeed(nextSpeed);
    setSpeechRate(nextSpeed);
  };

  // 24 simulated static waveform bars for visual aesthetic
  const waveformBars = [
    25, 45, 75, 95, 60, 40, 80, 100, 65, 35, 70, 85, 90, 60, 45, 80, 95, 70, 40, 60, 85, 50, 30, 20,
  ];

  return (
    <div
      className="glass-panel p-4 mt-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(14, 22, 38, 0.85), rgba(8, 14, 26, 0.9))',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 242, 254, 0.05)',
      }}
      role="region"
      aria-label="Neural Speech Player"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        {/* Language & Voice Header */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Volume2 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Neural Speech Output
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-medium text-slate-300">
                {langInfo.name} ({langInfo.nativeName})
              </span>
            </div>
            {transliteration && (
              <p className="text-xs text-slate-400 italic">"{transliteration}"</p>
            )}
          </div>
        </div>

        {/* Speed Adjustment */}
        <button
          type="button"
          onClick={cycleSpeed}
          aria-label={`Playback speed ${currentSpeed}x`}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1 text-xs font-mono font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-all"
        >
          <Gauge size={12} />
          <span>{currentSpeed}x</span>
        </button>
      </div>

      {/* Interactive Waveform Bar Visualizer */}
      <div className="my-3 flex items-center justify-between gap-1 h-10 px-2 bg-slate-950/60 rounded-xl border border-white/5 relative overflow-hidden">
        {/* Progress Fill Background */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-cyan-500/10 pointer-events-none transition-all duration-100"
          style={{ width: `${progress}%` }}
        />

        {waveformBars.map((heightPercent, idx) => {
          const isActiveBar = (idx / waveformBars.length) * 100 <= progress;
          return (
            <div
              key={idx}
              className="flex-1 rounded-full transition-all duration-150"
              style={{
                height: isSpeaking ? `${Math.max(15, (heightPercent * (Math.sin(Date.now() / 150 + idx) + 1.2)) / 2)}%` : `${heightPercent * 0.7}%`,
                background: isActiveBar
                  ? 'linear-gradient(to top, #00f2fe, #4facfe)'
                  : 'rgba(255, 255, 255, 0.15)',
                boxShadow: isActiveBar ? '0 0 8px rgba(0, 242, 254, 0.6)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Player Action Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={handlePlayPause}
            aria-label={isSpeaking ? 'Pause Audio' : 'Play Translation Speech'}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              boxShadow: '0 4px 15px rgba(0, 242, 254, 0.4)',
            }}
          >
            {isSpeaking ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Replay Button */}
          <button
            type="button"
            onClick={handleReplay}
            title="Replay Audio"
            aria-label="Replay Audio"
            className="btn-icon h-10 w-10"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="text-right text-[11px] font-mono text-slate-400">
          <span>{isSpeaking ? 'Playing...' : 'Audio Ready'}</span>
        </div>
      </div>
    </div>
  );
};
