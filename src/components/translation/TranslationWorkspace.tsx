import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Volume2,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Edit3,
  Send,
  Sparkles,
  UploadCloud,
  FileAudio,
  Loader2,
  Cpu,
} from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { WaveformAudioPlayer } from '../speech/WaveformAudioPlayer';
import { DetectedLanguageBadge } from './DetectedLanguageBadge';
import { TargetLanguageSelector } from './TargetLanguageSelector';
import { db } from '../../services/db';

export const TranslationWorkspace: React.FC = () => {
  const {
    currentTranscript,
    interimTranscript,
    currentTranslation,
    performTranslation,
    isTranslating,
    setCurrentTranscript,
  } = useTranslation();
  const { targetLanguage, targetLanguageInfo, detectedSourceLanguageInfo, setDetectedSource } =
    useLanguage();
  const { speakText, transcribeAudioFile } = useAudio();

  const [manualInput, setManualInput] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [isSavedPhrase, setIsSavedPhrase] = useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const activeTranscript = interimTranscript || currentTranscript || manualInput;
  const translationText = currentTranslation?.translatedText || '';

  const handleCopyTarget = () => {
    if (translationText) {
      navigator.clipboard.writeText(translationText);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    }
  };

  const handleCopySource = () => {
    if (activeTranscript) {
      navigator.clipboard.writeText(activeTranscript);
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      performTranslation(manualInput.trim(), 'text');
      setIsEditing(false);
    }
  };

  const handleSavePhrase = async () => {
    if (translationText) {
      try {
        await db.phrases.add({
          id: `saved-${Date.now()}`,
          category: 'Custom',
          textEn: activeTranscript || translationText,
          customLabel: translationText.slice(0, 20),
          isQuickAccess: true,
          usageCount: 1,
        });
        setIsSavedPhrase(true);
        setTimeout(() => setIsSavedPhrase(false), 3000);
      } catch (err) {
        console.warn('Could not save phrase:', err);
      }
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    setIsUploadingAudio(true);

    try {
      // Transcribe via Whisper / Gemini STT API
      const result = await transcribeAudioFile(file);
      if (result.transcript) {
        setCurrentTranscript(result.transcript);
        setManualInput(result.transcript);
        if (result.detectedLanguage) {
          setDetectedSource(result.detectedLanguage, 0.98);
        }
        await performTranslation(result.transcript, 'voice');
      }
    } catch (err) {
      console.warn('Whisper STT upload failed:', err);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <div className="w-full space-y-5" role="region" aria-label="Translation Workspace">
      {/* Workspace Header Toolbar */}
      <div className="glass-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-3">
          <DetectedLanguageBadge />
          {currentTranslation?.provider && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300">
              <Cpu size={12} className="text-cyan-400" />
              <span>{currentTranslation.provider}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Upload (Whisper STT) Trigger */}
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg,.aac"
            ref={audioFileInputRef}
            onChange={handleAudioUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => audioFileInputRef.current?.click()}
            disabled={isUploadingAudio || isTranslating}
            className="btn-secondary px-3 py-1 text-xs inline-flex items-center gap-1.5"
            title="Upload audio recording to transcribe with Whisper STT"
          >
            {isUploadingAudio ? (
              <>
                <Loader2 size={13} className="animate-spin text-cyan-400" />
                <span>Whisper Transcribing...</span>
              </>
            ) : (
              <>
                <UploadCloud size={13} className="text-cyan-400" />
                <span>Upload Audio File</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-mono">Translating into →</span>
            <TargetLanguageSelector compact />
          </div>
        </div>
      </div>

      {/* Audio File Notice Banner */}
      {audioFileName && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <FileAudio size={14} className="text-cyan-400" />
            <span>Audio source: <strong>{audioFileName}</strong> (Transcribed via Whisper / Gemini STT)</span>
          </div>
          <button
            type="button"
            onClick={() => setAudioFileName(null)}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Dual Panel Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Language Panel */}
        <div className="glass-panel p-5 flex flex-col justify-between min-h-[240px] border border-white/10 bg-slate-900/60">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Transcription & Source
                </h2>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                {detectedSourceLanguageInfo?.name || 'Auto Detected'}
              </span>
            </div>

            {/* Transcription Display or Manual Input */}
            {isEditing ? (
              <form onSubmit={handleManualSubmit} className="mt-1">
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Type any phrase in Tamil, Hindi, Telugu, Malayalam, Bengali, Kannada, English, Spanish, French..."
                  className="w-full h-28 rounded-xl border border-cyan-500/40 bg-slate-950/90 p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-indic resize-none"
                  autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary px-3 py-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-3.5 py-1 text-xs">
                    <Send size={12} /> Translate Text
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-2 min-h-[100px] flex items-center">
                {activeTranscript ? (
                  <p className="text-lg md:text-xl font-medium text-slate-100 font-indic leading-relaxed">
                    "{activeTranscript}"
                  </p>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-6 text-center text-slate-500">
                    <Sparkles size={24} className="mb-1.5 text-slate-600 opacity-60" />
                    <p className="text-xs">Speak into microphone, upload audio, or click "Type / Edit" below</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Source Action Toolbar */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setManualInput(activeTranscript);
                setIsEditing(!isEditing);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <Edit3 size={13} />
              <span>{isEditing ? 'Close Editor' : 'Type / Edit'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySource}
              title="Copy Source Transcript"
              aria-label="Copy Source Transcript"
              className="btn-icon h-8 w-8"
              disabled={!activeTranscript}
            >
              {copiedSource ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Target Language Panel */}
        <div className="glass-panel p-5 flex flex-col justify-between min-h-[240px] border border-cyan-500/30 bg-slate-900/80 shadow-lg shadow-cyan-500/5">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Target Translation
                </h2>
              </div>
              <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                {targetLanguageInfo.name} ({targetLanguageInfo.nativeName})
              </span>
            </div>

            {/* Translation Output Display */}
            <div className="py-2 min-h-[100px] flex items-center">
              {isTranslating ? (
                <div className="flex items-center gap-3 text-cyan-300">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  <span className="text-sm font-medium">Translating into {targetLanguageInfo.name}...</span>
                </div>
              ) : translationText ? (
                <div>
                  <p className="text-xl md:text-2xl font-bold text-white font-indic leading-relaxed">
                    "{translationText}"
                  </p>
                  {currentTranslation?.transliteration && (
                    <p className="mt-2 text-xs font-mono text-cyan-400 italic">
                      Pronunciation: {currentTranslation.transliteration}
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-6 text-center text-slate-500">
                  <ArrowRight size={24} className="mb-1.5 text-slate-600 opacity-60" />
                  <p className="text-xs">Translation in {targetLanguageInfo.name} will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Target Action Toolbar */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => translationText && speakText(translationText, targetLanguage)}
                title="Speak Translation"
                aria-label="Speak Translation"
                className="btn-icon h-8 w-8 text-cyan-400 hover:text-cyan-300"
                disabled={!translationText}
              >
                <Volume2 size={15} />
              </button>

              <button
                type="button"
                onClick={handleCopyTarget}
                title="Copy Translation"
                aria-label="Copy Translation"
                className="btn-icon h-8 w-8"
                disabled={!translationText}
              >
                {copiedTarget ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>

              <button
                type="button"
                onClick={handleSavePhrase}
                title="Save to AAC Phraseboard"
                aria-label="Save to Phraseboard"
                className="btn-icon h-8 w-8"
                disabled={!translationText}
              >
                {isSavedPhrase ? <BookmarkCheck size={14} className="text-emerald-400" /> : <Bookmark size={14} />}
              </button>
            </div>

            {currentTranslation && (
              <span className="text-[11px] font-mono text-emerald-400">
                Confidence: {Math.round((currentTranslation.confidence || 0.98) * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Output Audio Waveform Player */}
      {translationText && (
        <WaveformAudioPlayer
          text={translationText}
          targetLanguage={targetLanguage}
          transliteration={currentTranslation?.transliteration}
        />
      )}
    </div>
  );
};
