import React from 'react';
import { Ear, Sparkles, MessageSquare, Radio, Volume2 } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAudio } from '../../contexts/AudioContext';

export const HearingAssistancePanel: React.FC = () => {
  const { currentTranscript, interimTranscript, currentTranslation, history } = useTranslation();
  const { isRecording, micState, speakText } = useAudio();

  const activeCaption = interimTranscript || currentTranscript;
  const isComplete = micState === 'COMPLETE';

  return (
    <div className="space-y-6" role="region" aria-label="Hearing Assistance Live Subtitles">
      {/* Live Visual Banner */}
      <div className="flex items-center justify-between glass-panel p-4 border border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
            <Ear size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Hearing Assistance & Real-Time Captions (07B)</h2>
            <p className="text-xs text-slate-400">High-visibility live subtitles and visual flash cues.</p>
          </div>
        </div>

        {/* Visual Flash Beacon */}
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-xs font-bold text-rose-300 animate-pulse">
              <Radio size={14} className="animate-spin" />
              <span>RECORDING AUDIO</span>
            </span>
          )}
          {isComplete && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles size={14} />
              <span>TRANSLATION READY</span>
            </span>
          )}
        </div>
      </div>

      {/* Large Real-Time Subtitle Card */}
      <div
        className="glass-panel p-6 min-h-[160px] flex flex-col justify-center text-center rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(8, 14, 28, 0.95), rgba(15, 23, 42, 0.98))',
          border: isRecording ? '2px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isRecording ? '0 0 35px rgba(0, 242, 254, 0.3)' : 'none',
        }}
      >
        <span className="text-[11px] uppercase tracking-widest font-mono text-cyan-400/80 mb-2">
          Live Real-Time Captions
        </span>

        {activeCaption ? (
          <p className="text-2xl md:text-3xl font-extrabold text-white font-indic leading-snug">
            "{activeCaption}"
          </p>
        ) : (
          <p className="text-base text-slate-500 italic">
            Captions will appear in real time as speech is spoken...
          </p>
        )}

        {currentTranslation && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-400 block mb-1">
              Translated Result ({currentTranslation.targetLanguageName})
            </span>
            <p className="text-xl md:text-2xl font-bold text-emerald-300 font-indic">
              "{currentTranslation.translatedText}"
            </p>
            <button
              type="button"
              onClick={() => speakText(currentTranslation.translatedText, currentTranslation.targetLanguage)}
              className="mt-2.5 btn-secondary text-xs px-3 py-1 inline-flex items-center gap-1.5"
            >
              <Volume2 size={13} className="text-emerald-400" />
              <span>Speak Subtitle ({currentTranslation.targetLanguageName})</span>
            </button>
          </div>
        )}
      </div>

      {/* Recent Visual Conversation Log */}
      <div className="glass-panel p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-cyan-400" /> Recent Conversation Subtitle Log
        </h3>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {history.length > 0 ? (
            history.slice(0, 8).map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-left flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                    <span>{item.sourceLanguageName} → {item.targetLanguageName}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-slate-300 font-indic font-medium">"{item.sourceText}"</p>
                  <p className="text-sm text-cyan-300 font-indic font-semibold mt-1">"{item.translatedText}"</p>
                </div>
                <button
                  type="button"
                  onClick={() => speakText(item.translatedText, item.targetLanguage)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-cyan-300 shrink-0 mt-1"
                  title="Speak Subtitle Audio"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">No conversation log yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
