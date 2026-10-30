import React, { useState } from 'react';
import { History, Search, Trash2, Volume2, Copy, Check, Filter } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAudio } from '../../contexts/AudioContext';
import { TranslationResult } from '../../types';

export const HistoryWorkspace: React.FC = () => {
  const { history, deleteHistoryItem, clearAllHistory } = useTranslation();
  const { speakText } = useAudio();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceLanguageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetLanguageName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMode = selectedModeFilter === 'All' || item.mode === selectedModeFilter.toLowerCase();
    return matchesSearch && matchesMode;
  });

  const handleCopy = (item: TranslationResult) => {
    navigator.clipboard.writeText(item.translatedText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReplay = (item: TranslationResult) => {
    speakText(item.translatedText, item.targetLanguage);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" role="region" aria-label="Translation History & Saved Logs">
      {/* Header & Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Local-First Translation History (Module 11)</h2>
            <p className="text-xs text-slate-400">
              Private, on-device encrypted history. No data is stored on remote servers.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={clearAllHistory}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 transition-all"
          >
            <Trash2 size={13} />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">Mode:</span>
          {['All', 'Voice', 'Text', 'Conversation', 'OCR', 'AAC'].map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedModeFilter(mode)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedModeFilter === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white bg-white/5 border border-transparent'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:border-cyan-500/30 transition-all group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-cyan-300 font-bold uppercase border border-cyan-500/20">
                    {item.mode}
                  </span>
                  <span className="text-slate-200">{item.sourceLanguageName}</span>
                  <span>→</span>
                  <span className="text-cyan-300 font-semibold">{item.targetLanguageName}</span>
                  <span className="text-slate-500">•</span>
                  <span>{new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>

                <p className="text-sm text-slate-300 font-indic">
                  <span className="text-slate-500 text-xs font-mono">Original:</span> "{item.sourceText}"
                </p>

                <p className="text-base font-bold text-white font-indic">
                  <span className="text-cyan-400 text-xs font-mono">Translated:</span> "{item.translatedText}"
                </p>

                {item.transliteration && (
                  <p className="text-xs text-slate-400 italic font-mono">
                    Pronunciation: {item.transliteration}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleReplay(item)}
                  title="Replay Audio Speech"
                  aria-label="Replay Audio Speech"
                  className="btn-icon h-9 w-9 text-cyan-400 hover:text-cyan-300"
                >
                  <Volume2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  title="Copy Translated Text"
                  aria-label="Copy Translated Text"
                  className="btn-icon h-9 w-9"
                >
                  {copiedId === item.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => deleteHistoryItem(item.id)}
                  title="Delete Entry"
                  aria-label="Delete Entry"
                  className="btn-icon h-9 w-9 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel p-12 text-center text-slate-500">
            <History size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No Translation History Found</p>
            <p className="text-xs text-slate-600 mt-1">Translations you make will appear in this private log.</p>
          </div>
        )}
      </div>
    </div>
  );
};
