import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Droplet,
  PhoneCall,
  HeartPulse,
  Cross,
  Clock,
  Smile,
  HelpCircle,
  Plus,
  Volume2,
  Search,
  Sparkles,
} from 'lucide-react';
import { AACPhrase } from '../../types';
import { db } from '../../services/db';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const AACPhraseBoard: React.FC = () => {
  const [phrases, setPhrases] = useState<AACPhrase[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newPhraseText, setNewPhraseText] = useState<string>('');
  const [newPhraseLabel, setNewPhraseLabel] = useState<string>('');
  const [isAddingPhrase, setIsAddingPhrase] = useState<boolean>(false);

  const { performTranslation } = useTranslation();
  const { targetLanguageInfo } = useLanguage();

  const loadPhrases = async () => {
    try {
      const records = await db.phrases.toArray();
      setPhrases(records);
    } catch (err) {
      console.warn('Error loading phrases from db:', err);
    }
  };

  useEffect(() => {
    loadPhrases();
  }, []);

  const handlePhraseClick = async (phrase: AACPhrase) => {
    // 1-touch translate and speak in target language
    await performTranslation(phrase.textEn, 'aac');
    try {
      await db.phrases.update(phrase.id, { usageCount: (phrase.usageCount || 0) + 1 });
      loadPhrases();
    } catch {
      // Ignore
    }
  };

  const handleAddCustomPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhraseText.trim()) return;

    const newPhrase: AACPhrase = {
      id: `custom-${Date.now()}`,
      category: 'Custom',
      textEn: newPhraseText.trim(),
      customLabel: newPhraseLabel.trim() || newPhraseText.trim().slice(0, 16),
      isQuickAccess: true,
      usageCount: 1,
    };

    await db.phrases.add(newPhrase);
    setNewPhraseText('');
    setNewPhraseLabel('');
    setIsAddingPhrase(false);
    loadPhrases();
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'help me':
      case 'i need help':
        return <AlertCircle size={24} className="text-rose-400" />;
      case 'water':
      case 'i need water':
        return <Droplet size={24} className="text-cyan-400" />;
      case 'call family':
      case 'please call my family':
        return <PhoneCall size={24} className="text-purple-400" />;
      case 'not well':
      case 'i am not feeling well':
        return <HeartPulse size={24} className="text-amber-400" />;
      case 'hospital?':
      case 'where is the hospital?':
        return <Cross size={24} className="text-rose-500" />;
      case 'wait':
      case 'please wait':
        return <Clock size={24} className="text-blue-400" />;
      case 'thanks':
      case 'thank you':
        return <Smile size={24} className="text-emerald-400" />;
      case 'repeat':
      case "i don't understand":
        return <HelpCircle size={24} className="text-indigo-400" />;
      default:
        return <Volume2 size={24} className="text-cyan-400" />;
    }
  };

  const categories = ['All', 'Emergency', 'Medical', 'Assistance', 'Everyday', 'Custom'];

  const filteredPhrases = phrases.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.textEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customLabel && p.customLabel.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6" role="region" aria-label="Alternative & Augmentative Communication Phrase Board">
      {/* Category Pills & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search phrases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/90 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddingPhrase(!isAddingPhrase)}
            className="btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Custom Phrase</span>
          </button>
        </div>
      </div>

      {/* Custom Phrase Form Modal */}
      {isAddingPhrase && (
        <form onSubmit={handleAddCustomPhrase} className="glass-panel p-5 animate-fade-in border border-cyan-500/30">
          <h3 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
            <Sparkles size={16} /> Create Personalized Assistive Phrase
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Full Phrase (e.g. Please bring my spectacles)"
              value={newPhraseText}
              onChange={(e) => setNewPhraseText(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 p-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Button Label (e.g. Spectacles)"
              value={newPhraseLabel}
              onChange={(e) => setNewPhraseLabel(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/80 p-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingPhrase(false)}
              className="btn-secondary px-3 py-1 text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary px-4 py-1 text-xs">
              Save to Board
            </button>
          </div>
        </form>
      )}

      {/* AAC Quick Tap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredPhrases.map((phrase) => {
          return (
            <button
              key={phrase.id}
              type="button"
              onClick={() => handlePhraseClick(phrase)}
              className="glass-panel glass-card-interactive p-4 flex flex-col items-center justify-center text-center gap-2.5 min-h-[120px] rounded-2xl border border-white/10 hover:border-cyan-400/50 group"
              style={{
                background: 'linear-gradient(145deg, rgba(16, 24, 40, 0.8), rgba(10, 15, 26, 0.9))',
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
                {getIcon(phrase.customLabel || phrase.textEn)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {phrase.customLabel || phrase.textEn}
                </span>
                <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {phrase.textEn}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/60 uppercase">
                Tap → {targetLanguageInfo.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
