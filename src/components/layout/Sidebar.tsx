import React from 'react';
import { Mic, Users, HeartHandshake, Image, History, Settings, Hand, Navigation } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    {
      id: 'translate',
      label: 'Speech Translate',
      icon: <Mic size={18} />,
      badge: 'Main',
    },
    {
      id: 'map',
      label: 'Map Guide (Blind/Deaf)',
      icon: <Navigation size={18} />,
      badge: 'Voice & Text',
    },
    {
      id: 'sign',
      label: 'Live Sign & Subtitles',
      icon: <Hand size={18} />,
      badge: 'Vision AI',
    },
    {
      id: 'ocr',
      label: 'OCR Vision',
      icon: <Image size={18} />,
      badge: 'All Langs',
    },
    {
      id: 'conversation',
      label: 'Two-Person Chat',
      icon: <Users size={18} />,
      badge: 'Live',
    },
    {
      id: 'accessibility',
      label: 'Accessibility Suite',
      icon: <HeartHandshake size={18} />,
      badge: '4 Modes',
    },
    {
      id: 'history',
      label: 'History & Saved',
      icon: <History size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings & Status',
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col justify-between w-64 border-r border-white/10 p-4 shrink-0 bg-slate-950/60 backdrop-blur-xl min-h-[calc(100vh-65px)]"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-2 font-mono">
          System Modules
        </span>

        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase font-mono ${
                    isActive ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Academic Capstone Info Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 text-[11px] space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Final-Year Capstone Project</span>
        </div>
        <p className="text-slate-400 leading-tight">
          Inclusive Multilingual Speech-to-Speech Assistant (Tamil, Hindi, Telugu, Malayalam, Bengali, Kannada, English).
        </p>
      </div>
    </aside>
  );
};
