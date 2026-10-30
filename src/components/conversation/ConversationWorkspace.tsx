import React, { useState } from 'react';
import { Users, Mic, MicOff, Volume2, RotateCcw, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { ConversationTurn, SupportedLanguageCode } from '../../types';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../../services/languageService';
import { useAudio } from '../../contexts/AudioContext';
import { translateTextAPI } from '../../services/api';

export const ConversationWorkspace: React.FC = () => {
  const [personALang, setPersonALang] = useState<SupportedLanguageCode>('ta'); // e.g. Tamil
  const [personBLang, setPersonBLang] = useState<SupportedLanguageCode>('en'); // e.g. English
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'PERSON_A' | 'PERSON_B' | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const { speakText, startRecording, stopRecording, setOnTranscriptReceived, isRecording } = useAudio();

  const handleSpeakerMic = async (speaker: 'PERSON_A' | 'PERSON_B') => {
    if (isRecording && activeSpeaker === speaker) {
      stopRecording();
      setActiveSpeaker(null);
    } else {
      setActiveSpeaker(speaker);
      const speakerLang = speaker === 'PERSON_A' ? personALang : personBLang;
      
      setOnTranscriptReceived(async (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          stopRecording();
          setActiveSpeaker(null);
          await processConversationTurn(speaker, transcript);
        }
      });

      await startRecording(speakerLang);
    }
  };

  const processConversationTurn = async (speaker: 'PERSON_A' | 'PERSON_B', text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    const sourceLang = speaker === 'PERSON_A' ? personALang : personBLang;
    const targetLang = speaker === 'PERSON_A' ? personBLang : personALang;

    try {
      const translation = await translateTextAPI(text.trim(), targetLang, sourceLang);

      const newTurn: ConversationTurn = {
        id: `turn-${Date.now()}`,
        speaker,
        speakerName: speaker === 'PERSON_A' ? `Person A (${getLanguageByCode(personALang).name})` : `Person B (${getLanguageByCode(personBLang).name})`,
        sourceText: text.trim(),
        translatedText: translation.translatedText,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        timestamp: Date.now(),
      };

      setTurns((prev) => [newTurn, ...prev]);

      // Automatically speak translation to the other person in their target language
      speakText(translation.translatedText, targetLang);
    } catch (err) {
      console.warn('Conversation turn error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = personALang;
    setPersonALang(personBLang);
    setPersonBLang(temp);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" role="region" aria-label="Real-time Two-Person Conversation Mode">
      {/* Session Controls & Language Pair Selection */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Two-Person Live Dialogue (Module 08)</h2>
            <p className="text-xs text-slate-400">Bidirectional real-time speech translation with speaker separation.</p>
          </div>
        </div>

        {/* Language Pairing Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-cyan-400">Person A:</span>
            <select
              value={personALang}
              onChange={(e) => setPersonALang(e.target.value as SupportedLanguageCode)}
              className="rounded-lg bg-slate-900 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-medium"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.name} ({l.nativeName})</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSwapLanguages}
            title="Swap Speaker Languages"
            aria-label="Swap Speaker Languages"
            className="btn-icon h-7 w-7 rounded-lg"
          >
            <ArrowRightLeft size={13} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-purple-400">Person B:</span>
            <select
              value={personBLang}
              onChange={(e) => setPersonBLang(e.target.value as SupportedLanguageCode)}
              className="rounded-lg bg-slate-900 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-400 font-medium"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.name} ({l.nativeName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dual Speaker Interactive Control Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Person A Station */}
        <div
          className={`glass-panel p-5 flex flex-col justify-between rounded-2xl border transition-all ${
            activeSpeaker === 'PERSON_A'
              ? 'border-cyan-400 shadow-glow-cyan bg-cyan-950/30'
              : 'border-cyan-500/20 bg-slate-900/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                Person A ({getLanguageByCode(personALang).name})
              </span>
              <span className="text-xs text-slate-400 font-indic">
                {getLanguageByCode(personALang).nativeName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Speaks in {getLanguageByCode(personALang).name} → Automatically translated to {getLanguageByCode(personBLang).name} for Person B.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSpeakerMic('PERSON_A')}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
                activeSpeaker === 'PERSON_A' && isRecording
                  ? 'bg-cyan-400 text-slate-950 border-white shadow-glow-mic scale-105'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30 hover:scale-105'
              }`}
            >
              {activeSpeaker === 'PERSON_A' && isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <span className="text-xs font-semibold text-slate-300">
              {activeSpeaker === 'PERSON_A' && isRecording ? 'Listening to Person A...' : 'Tap to Speak (Person A)'}
            </span>
          </div>
        </div>

        {/* Person B Station */}
        <div
          className={`glass-panel p-5 flex flex-col justify-between rounded-2xl border transition-all ${
            activeSpeaker === 'PERSON_B'
              ? 'border-purple-400 shadow-glow-violet bg-purple-950/30'
              : 'border-purple-500/20 bg-slate-900/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                Person B ({getLanguageByCode(personBLang).name})
              </span>
              <span className="text-xs text-slate-400 font-indic">
                {getLanguageByCode(personBLang).nativeName}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Speaks in {getLanguageByCode(personBLang).name} → Automatically translated to {getLanguageByCode(personALang).name} for Person A.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleSpeakerMic('PERSON_B')}
              className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
                activeSpeaker === 'PERSON_B' && isRecording
                  ? 'bg-purple-400 text-slate-950 border-white shadow-glow-violet scale-105'
                  : 'bg-purple-500/20 text-purple-300 border-purple-400/40 hover:bg-purple-500/30 hover:scale-105'
              }`}
            >
              {activeSpeaker === 'PERSON_B' && isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <span className="text-xs font-semibold text-slate-300">
              {activeSpeaker === 'PERSON_B' && isRecording ? 'Listening to Person B...' : 'Tap to Speak (Person B)'}
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Conversation Transcript */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <MessageSquare size={16} className="text-cyan-400" /> Live Conversation Dialogue Stream
          </h3>
          {turns.length > 0 && (
            <button
              type="button"
              onClick={() => setTurns([])}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
            >
              <RotateCcw size={12} /> Clear Chat
            </button>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 py-3 text-cyan-300 text-xs font-medium">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span>Translating dialogue turn...</span>
          </div>
        )}

        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {turns.length > 0 ? (
            turns.map((turn) => {
              const isA = turn.speaker === 'PERSON_A';
              return (
                <div
                  key={turn.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isA
                      ? 'bg-cyan-950/30 border-cyan-500/30 ml-0 mr-12'
                      : 'bg-purple-950/30 border-purple-500/30 ml-12 mr-0 text-right'
                  }`}
                >
                  <div className={`flex items-center gap-2 text-[11px] font-mono mb-1 ${isA ? 'text-cyan-400 justify-start' : 'text-purple-400 justify-end'}`}>
                    <span className="font-bold">{turn.speakerName}</span>
                    <span className="text-slate-500">•</span>
                    <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <p className="text-sm text-slate-200 font-indic font-medium">"{turn.sourceText}"</p>
                  
                  <div className={`mt-2 pt-2 border-t border-white/5 flex items-center gap-2 ${isA ? 'justify-start' : 'justify-end'}`}>
                    <span className={`text-sm font-bold font-indic ${isA ? 'text-cyan-300' : 'text-purple-300'}`}>
                      "{turn.translatedText}"
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(turn.translatedText, turn.targetLanguage)}
                      className="btn-icon h-7 w-7"
                    >
                      <Volume2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No dialogue yet. Tap a speaker button above to start the real-time conversation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
