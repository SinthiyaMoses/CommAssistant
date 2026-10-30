import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SupportedLanguageCode, LanguageInfo } from '../../types';

export const TargetLanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { targetLanguage, setTargetLanguage, supportedLanguages, targetLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = supportedLanguages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: SupportedLanguageCode) => {
    setTargetLanguage(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id="target-language-selector-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2.5 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-3.5 py-1.5 font-medium text-white shadow-lg backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
          compact ? 'text-xs py-1 px-2.5' : 'text-sm'
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
          <Globe size={14} />
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400">
            Target Language (Locked)
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-100 text-xs sm:text-sm">
            <span>{targetLanguageInfo.flag}</span>
            <span>{targetLanguageInfo.name}</span>
            <span className="text-xs text-slate-400 font-normal font-indic">({targetLanguageInfo.nativeName})</span>
          </span>
        </div>
        <ChevronDown size={14} className={`ml-1 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-cyan-500/30 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <div className="mb-2 p-1">
            <input
              type="text"
              placeholder="Search Indian or world language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredLanguages.map((lang: LanguageInfo) => {
              const isSelected = lang.code === targetLanguage;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{lang.name}</span>
                      <span className="text-xs text-slate-400 font-indic">{lang.nativeName}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-white/10 pt-2 px-2 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Sparkles size={11} className="text-cyan-400 shrink-0" />
            <span>Target language is strictly preserved and never mutated.</span>
          </div>
        </div>
      )}
    </div>
  );
};
