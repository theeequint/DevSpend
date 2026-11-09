// ============================================================
// DevSpend — Mobile Ergonomic Quick-Action FAB (< 768px)
// Thumb-reachable floating action trigger with native spring menu
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Receipt,
  TrendingUp,
  Bug,
  Terminal,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { useSpendStore, useActiveProject } from '../../store/useSpendStore';
import { useAuthStore } from '../../store/useAuthStore';

export const MobileQuickActionFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    setAddExpenseModalOpen,
    setAddRevenueModalOpen,
    setCommandPaletteOpen,
    activeDebugTimer,
    startDebugTimer,
    stopAndLogDebugTimer,
    setActiveView,
  } = useSpendStore();

  const { currentUser } = useAuthStore();
  const activeProject = useActiveProject();

  // Close when clicked outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleTimer = () => {
    setIsOpen(false);
    if (activeDebugTimer?.running) {
      stopAndLogDebugTimer();
    } else {
      startDebugTimer({
        projectId: activeProject?.id ?? '',
        ownerUserId: currentUser?.id || activeProject?.ownerUserId || 'user_demo',
        description: 'Mobile Bug Triage',
        component: 'Active Module',
        severity: 'medium',
      });
      setActiveView('ledger');
    }
  };

  const bottomPositionClass = activeDebugTimer
    ? 'bottom-[calc(8.5rem+env(safe-area-inset-bottom))]'
    : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))]';

  return (
    <div
      ref={containerRef}
      className={`fixed right-4 ${bottomPositionClass} z-40 select-none transition-all duration-200`}
    >
      {/* Quick-action Popover Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10 animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-16 mb-2 w-56 rounded-2xl bg-[#121215]/98 border border-zinc-700/80 p-2 shadow-2xl space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-150 font-sans text-xs">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              Quick Actions
            </div>

            {/* + Log Expense */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setAddExpenseModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Receipt size={14} />
              </div>
              <div>
                <div className="font-semibold text-xs">Log Expense</div>
                <div className="text-[10px] text-zinc-400">Record outgoing burn</div>
              </div>
            </button>

            {/* + Log Revenue */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setAddRevenueModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp size={14} />
              </div>
              <div>
                <div className="font-semibold text-xs">Log Revenue</div>
                <div className="text-[10px] text-zinc-400">Record incoming MRR/grant</div>
              </div>
            </button>

            {/* Start/Stop Debug Timer */}
            <button
              type="button"
              onClick={handleToggleTimer}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  activeDebugTimer?.running
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {activeDebugTimer?.running ? <Square size={13} /> : <Play size={13} />}
              </div>
              <div>
                <div className="font-semibold text-xs">
                  {activeDebugTimer?.running ? 'Stop Bug Timer' : 'Start Bug Timer'}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {activeDebugTimer?.running ? 'Save session to ledger' : 'Track live debug burn'}
                </div>
              </div>
            </button>

            {/* Command Palette */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCommandPaletteOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Terminal size={14} />
              </div>
              <div>
                <div className="font-semibold text-xs">Command Palette</div>
                <div className="text-[10px] text-zinc-400">Global search & shortcuts</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* FAB Primary Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Actions"
        className="w-13 h-13 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-950/60 border border-white/20 active:scale-90 transition-all duration-200 cursor-pointer"
        style={{
          background: 'var(--accent-gradient, linear-gradient(135deg, #10B981, #065F46))',
          boxShadow: '0 8px 24px var(--accent-glow, rgba(16, 185, 129, 0.4))',
        }}
      >
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
          <Plus size={24} className="stroke-[2.5]" />
        </span>
      </button>
    </div>
  );
};

export default MobileQuickActionFab;
