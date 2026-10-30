import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { AdvancedMicrophone } from '../speech/AdvancedMicrophone';
import { TranslationWorkspace } from '../translation/TranslationWorkspace';
import { ConversationWorkspace } from '../conversation/ConversationWorkspace';
import { VisualAssistanceDock } from '../accessibility/VisualAssistanceDock';
import { HearingAssistancePanel } from '../accessibility/HearingAssistancePanel';
import { AACPhraseBoard } from '../accessibility/AACPhraseBoard';
import { SignLanguageView } from '../accessibility/SignLanguageView';
import { OCRWorkspace } from '../ocr/OCRWorkspace';
import { HistoryWorkspace } from '../history/HistoryWorkspace';
import { SettingsWorkspace } from '../settings/SettingsWorkspace';
import { AccessibleMapGuide } from '../navigation/AccessibleMapGuide';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useAudio } from '../../contexts/AudioContext';
import { Mic, HeartHandshake, Image, History, Eye, Ear, MessageSquare, Hand, Navigation } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('translate');
  const [a11ySubTab, setA11ySubTab] = useState<'visual' | 'hearing' | 'aac' | 'sign' | 'map'>('map');

  const { accessibilityMode, highContrast, setHighContrast, announceToScreenReader } = useAccessibility();
  const { isRecording, startRecording, stopRecording } = useAudio();

  // Sync a11y active mode with sub-tab
  useEffect(() => {
    if (accessibilityMode !== 'standard') {
      setA11ySubTab(accessibilityMode);
    }
  }, [accessibilityMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
          announceToScreenReader('Recording stopped');
        } else {
          startRecording();
          announceToScreenReader('Recording started. Speak now.');
        }
      }

      if (e.ctrlKey) {
        if (e.key === '1') { e.preventDefault(); setActiveView('translate'); }
        if (e.key === '2') { e.preventDefault(); setActiveView('conversation'); }
        if (e.key === '3') { e.preventDefault(); setActiveView('accessibility'); }
        if (e.key === '4') { e.preventDefault(); setActiveView('ocr'); }
        if (e.key === '5') { e.preventDefault(); setActiveView('history'); }
        if (e.key === '6') { e.preventDefault(); setActiveView('settings'); }
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          setHighContrast(!highContrast);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, startRecording, stopRecording, highContrast, setHighContrast, announceToScreenReader]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#06090f] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Application Header */}
      <Header activeView={activeView} setActiveView={setActiveView} />

      <div className="flex flex-1 w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-115px)] pb-24 md:pb-8">
          {/* Main Speech Translation View */}
          {activeView === 'translate' && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              <AdvancedMicrophone />
              <TranslationWorkspace />
            </div>
          )}

          {/* Accessible Map Guide View (Blind Voice & Deaf Text Wayfinding) */}
          {activeView === 'map' && (
            <div className="animate-fade-in max-w-5xl mx-auto">
              <AccessibleMapGuide />
            </div>
          )}

          {/* Live Sign Language Subtitles & Audio View */}
          {activeView === 'sign' && (
            <div className="animate-fade-in max-w-5xl mx-auto">
              <SignLanguageView />
            </div>
          )}

          {/* Two-Person Live Conversation View */}
          {activeView === 'conversation' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <ConversationWorkspace />
            </div>
          )}

          {/* Dedicated Accessibility Modes Suite */}
          {activeView === 'accessibility' && (
            <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
              {/* A11y Module Selector Tabs */}
              <div className="glass-panel p-2 flex flex-wrap gap-2 justify-center sm:justify-start border border-cyan-500/20">
                <button
                  type="button"
                  onClick={() => setA11ySubTab('map')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    a11ySubTab === 'map'
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Navigation size={15} />
                  <span>07E: Map Guide (Voice & Text)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setA11ySubTab('sign')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    a11ySubTab === 'sign'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Hand size={15} />
                  <span>07D: Live Sign & Subtitles</span>
                </button>

                <button
                  type="button"
                  onClick={() => setA11ySubTab('aac')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    a11ySubTab === 'aac'
                      ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare size={15} />
                  <span>07C: AAC Phraseboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setA11ySubTab('visual')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    a11ySubTab === 'visual'
                      ? 'bg-amber-400 text-black shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Eye size={15} />
                  <span>07A: Visual Assistance</span>
                </button>

                <button
                  type="button"
                  onClick={() => setA11ySubTab('hearing')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    a11ySubTab === 'hearing'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Ear size={15} />
                  <span>07B: Hearing Subtitles</span>
                </button>
              </div>

              {/* Submodule View */}
              {a11ySubTab === 'map' && <AccessibleMapGuide />}
              {a11ySubTab === 'sign' && <SignLanguageView />}
              {a11ySubTab === 'aac' && <AACPhraseBoard />}
              {a11ySubTab === 'visual' && <VisualAssistanceDock />}
              {a11ySubTab === 'hearing' && <HearingAssistancePanel />}
            </div>
          )}

          {/* OCR Document & Signboard Vision View */}
          {activeView === 'ocr' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <OCRWorkspace />
            </div>
          )}

          {/* History & Saved Phrases View */}
          {activeView === 'history' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <HistoryWorkspace />
            </div>
          )}

          {/* System Settings & Diagnostics View */}
          {activeView === 'settings' && (
            <div className="animate-fade-in max-w-4xl mx-auto">
              <SettingsWorkspace />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 px-2 py-2 flex items-center justify-around backdrop-blur-2xl bg-slate-950/95"
        aria-label="Mobile Navigation"
      >
        {[
          { id: 'translate', label: 'Translate', icon: <Mic size={18} /> },
          { id: 'map', label: 'Map Guide', icon: <Navigation size={18} /> },
          { id: 'sign', label: 'Sign & CC', icon: <Hand size={18} /> },
          { id: 'ocr', label: 'OCR', icon: <Image size={18} /> },
          { id: 'accessibility', label: 'A11y', icon: <HeartHandshake size={18} /> },
          { id: 'history', label: 'History', icon: <History size={18} /> },
        ].map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Persistent Status Bar */}
      <StatusBar />
    </div>
  );
};
