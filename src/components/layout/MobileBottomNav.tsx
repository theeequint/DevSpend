// ============================================================
// DevSpend — Native Mobile Bottom Navigation Dock
// Pinned Glassmorphic iOS/Android Tab Bar (< 768px & Mobile App)
// Project-Gated Navigation: Only Projects tab visible when !hasActiveProject
// ============================================================

import React from 'react';
import {
  FolderKanban,
  LayoutDashboard,
  Receipt,
  PieChart,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useSpendStore, useUserProjects, useActiveProject } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { AppView } from '../../types';

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView } = useSpendStore();
  const { currentUser } = useAuthStore();
  const userProjects = useUserProjects(currentUser?.id);
  const activeProject = useActiveProject(currentUser?.id);
  const hasActiveProject = Boolean(
    activeProject && userProjects.some((p) => p.id === activeProject.id)
  );

  const handleAiSimClick = () => {
    if (activeView === 'audit') {
      setActiveView('simulator');
    } else {
      setActiveView('audit');
    }
  };

  const isAiSimActive = activeView === 'audit' || activeView === 'simulator';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090B]/95 backdrop-blur-xl border-t border-zinc-800/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_25px_rgba(0,0,0,0.5)]">
      {hasActiveProject ? (
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {/* Tab 1: Home / Projects */}
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-90 cursor-pointer ${
              activeView === 'home'
                ? 'text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {activeView === 'home' && (
              <span
                className="absolute top-0 w-8 h-1 rounded-full shadow-sm animate-in fade-in zoom-in-75 duration-200"
                style={{ background: 'var(--accent-gradient, #10B981)' }}
              />
            )}
            <FolderKanban size={20} className="mb-0.5" />
            <span className="text-[10px] tracking-tight">Projects</span>
          </button>

          {/* Tab 2: Overview / Dashboard */}
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-90 cursor-pointer ${
              activeView === 'dashboard'
                ? 'text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {activeView === 'dashboard' && (
              <span
                className="absolute top-0 w-8 h-1 rounded-full shadow-sm animate-in fade-in zoom-in-75 duration-200"
                style={{ background: 'var(--accent-gradient, #10B981)' }}
              />
            )}
            <LayoutDashboard size={20} className="mb-0.5" />
            <span className="text-[10px] tracking-tight">Overview</span>
          </button>

          {/* Tab 3: Unified Ledger */}
          <button
            type="button"
            onClick={() => setActiveView('ledger')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-90 cursor-pointer ${
              activeView === 'ledger'
                ? 'text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {activeView === 'ledger' && (
              <span
                className="absolute top-0 w-8 h-1 rounded-full shadow-sm animate-in fade-in zoom-in-75 duration-200"
                style={{ background: 'var(--accent-gradient, #10B981)' }}
              />
            )}
            <Receipt size={20} className="mb-0.5" />
            <span className="text-[10px] tracking-tight">Ledger</span>
          </button>

          {/* Tab 4: Ownership & Cap Table */}
          <button
            type="button"
            onClick={() => setActiveView('ownership')}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-90 cursor-pointer ${
              activeView === 'ownership'
                ? 'text-emerald-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {activeView === 'ownership' && (
              <span
                className="absolute top-0 w-8 h-1 rounded-full shadow-sm animate-in fade-in zoom-in-75 duration-200"
                style={{ background: 'var(--accent-gradient, #10B981)' }}
              />
            )}
            <PieChart size={20} className="mb-0.5" />
            <span className="text-[10px] tracking-tight">Ownership</span>
          </button>

          {/* Tab 5: AI & Sim (Dual Toggle) */}
          <button
            type="button"
            onClick={handleAiSimClick}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all duration-150 active:scale-90 cursor-pointer ${
              isAiSimActive
                ? 'text-violet-400 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isAiSimActive && (
              <span
                className="absolute top-0 w-8 h-1 rounded-full shadow-sm animate-in fade-in zoom-in-75 duration-200"
                style={{ background: 'var(--accent-gradient, #8B5CF6)' }}
              />
            )}
            {activeView === 'simulator' ? (
              <Layers size={20} className="mb-0.5 text-cyan-400" />
            ) : (
              <Sparkles size={20} className="mb-0.5 text-violet-400" />
            )}
            <span className="text-[10px] tracking-tight">
              {activeView === 'simulator' ? 'Simulator' : 'AI Auditor'}
            </span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-16 px-4 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-emerald-400 font-bold text-xs border border-zinc-700/60 shadow-sm"
          >
            <FolderKanban size={18} />
            <span>Projects Workspace</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default MobileBottomNav;
